import moment from 'moment';
import uuidv4 from 'uuid/v4';
import debugLib from 'debug';
import Promise from 'bluebird';
import { pick, omit, get, isNil } from 'lodash';
import config from 'config';
import * as LibTaxes from '@opencollective/taxes';

import models from '../../../models';
import * as errors from '../../errors';
import cache from '../../../lib/cache';
import * as github from '../../../lib/github';
import recaptcha from '../../../lib/recaptcha';
import * as libPayments from '../../../lib/payments';
import { setupCreditCard } from '../../../paymentProviders/stripe/creditcard';
import { capitalize, pluralize, formatCurrency, md5 } from '../../../lib/utils';
import { getNextChargeAndPeriodStartDates, getChargeRetryCount } from '../../../lib/subscriptions';

import roles from '../../../constants/roles';
import status from '../../../constants/order_status';
import activities from '../../../constants/activities';
import { types } from '../../../constants/collectives';
import { VAT_OPTIONS } from '../../../constants/vat';

const oneHourInSeconds = 60 * 60;

const debug = debugLib('orders');

async function checkOrdersLimit(order, remoteUser, reqIp) {
  if (['circleci', 'test'].includes(process.env.NODE_ENV)) {
    return;
  }

  const ordersLimits = config.limits.ordersPerHour;
  const collectiveId = get(order, 'collective.id');
  const fromCollectiveId = get(order, 'fromCollective.id');
  const userEmail = get(order, 'user.email');

  const limits = [];

  if (fromCollectiveId) {
    // Limit on authenticated users
    limits.push({
      key: `order_limit_on_account_${fromCollectiveId}`,
      value: ordersLimits.perAccount,
    });
    if (collectiveId) {
      limits.push({
        key: `order_limit_on_account_${fromCollectiveId}_and_collective_${collectiveId}`,
        value: ordersLimits.perAccountForCollective,
      });
    }
  } else {
    // Limit on first time users
    if (userEmail) {
      const emailHash = md5(userEmail);
      limits.push({
        key: `order_limit_on_email_${emailHash}`,
        value: ordersLimits.perEmail,
      });
      if (collectiveId) {
        limits.push({
          key: `order_limit_on_email_${emailHash}_and_collective_${collectiveId}`,
          value: ordersLimits.perEmailForCollective,
        });
      }
    }
    // Limit on IPs
    if (reqIp) {
      limits.push({
        key: `order_limit_on_ip_${md5(reqIp)}`,
        value: ordersLimits.perIp,
      });
    }
  }

  for (const limit of limits) {
    const count = (await cache.get(limit.key)) || 0;
    debug(`${count} orders for limit '${limit.key}'`);
    const limitReached = count >= limit.value;
    cache.set(limit.key, count + 1, oneHourInSeconds);
    if (limitReached) {
      debug(`Order limit reached for limit '${limit.key}'`);
      const errorMessage =
        'Error while processing your request, please try again or contact support@opencollective.com';
      // Show a developer-friendly message in DEV
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`${errorMessage} - Orders limit reached`);
      } else {
        throw new Error(errorMessage);
      }
    }
  }
}

async function checkRecaptcha(order, remoteUser, reqIp) {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'circleci') {
    return;
  }

  if (!order.recaptchaToken) {
    // Fail if Recaptcha is required
    if (!remoteUser) {
      debug('Recaptcha token missing');
      throw new Error(
        'Error while processing your request (Recaptcha token missing), please try again or contact support@opencollective.com',
      );
    }
    // Otherwise, pass for now
    return;
  }

  const response = recaptcha.verify(order.recaptchaToken, reqIp);

  // TODO: check response and throw an error if needed

  return response;
}

export async function createOrder(order, loaders, remoteUser, reqIp) {
  debug('Beginning creation of order', order);
  await checkOrdersLimit(order, remoteUser, reqIp);
  const recaptchaResponse = await checkRecaptcha(order, remoteUser, reqIp);

  let orderCreated;
  try {
    // ---- Set defaults ----
    order.quantity = order.quantity || 1;
    order.taxAmount = order.taxAmount || 0;

    if (order.paymentMethod && order.paymentMethod.service === 'stripe' && order.paymentMethod.uuid && !remoteUser) {
      throw new Error('You need to be logged in to be able to use a payment method on file');
    }

    if (!order.collective || (!order.collective.id && !order.collective.website && !order.collective.githubHandle)) {
      throw new Error('No collective id/website/githubHandle provided');
    }

    const { id, githubHandle } = order.collective;

    if (!id && !githubHandle) {
      throw new errors.ValidationFailed({
        message: 'An Open Collective id or a GitHub handle is mandatory.',
      });
    }

    // Pledge to a GitHub organization or project
    if (githubHandle) {
      if (githubHandle.includes('/')) {
        // A repository GitHub Handle (most common)
        const repo = await github.getRepo(githubHandle).catch(() => null);
        if (!repo) {
          throw new errors.ValidationFailed({
            message: 'We could not verify the GitHub repository',
          });
        }
        if (repo.stargazers_count < 100) {
          throw new errors.ValidationFailed({
            message: 'The repository need at least 100 GitHub stars to be pledged.',
          });
        }
      } else {
        // An organization GitHub Handle
        const org = await github.getOrg(githubHandle).catch(() => null);
        if (!org) {
          throw new errors.ValidationFailed({
            message: 'We could not verify the GitHub organization',
          });
        }
        const allRepos = await github.getAllOrganizationPublicRepos(githubHandle).catch(() => null);
        const repoWith100stars = allRepos.find(repo => repo.stargazers_count >= 100);
        if (!repoWith100stars) {
          throw new errors.ValidationFailed({
            message: 'The organization need at least one repository with 100 GitHub stars to be pledged.',
          });
        }
      }
    }

    if (order.platformFeePercent && !remoteUser.isRoot()) {
      throw new Error('Only a root can change the platformFeePercent');
    }

    // Check the existence of the recipient Collective
    let collective;
    if (order.collective.id) {
      collective = await loaders.collective.findById.load(order.collective.id);
    } else if (order.collective.website) {
      collective = (await models.Collective.findOrCreate({
        where: { website: order.collective.website },
        defaults: order.collective,
      }))[0];
    } else if (order.collective.githubHandle) {
      collective = await models.Collective.findOne({ where: { githubHandle: order.collective.githubHandle } });
      if (!collective) {
        collective = await models.Collective.create({ ...order.collective, isPledged: true });
      }
    }

    if (!collective) {
      throw new Error(`No collective found: ${order.collective.id || order.collective.website}`);
    }

    if (order.fromCollective && order.fromCollective.id === collective.id) {
      throw new Error('Orders cannot be created for a collective by that same collective.');
    }
    if (order.hostFeePercent) {
      const HostCollectiveId = await collective.getHostCollectiveId();

      if (!remoteUser.isAdmin(HostCollectiveId)) {
        throw new Error('Only an admin of the host can change the hostFeePercent');
      }
    }

    order.collective = collective;

    let tier;
    if (order.tier) {
      tier = await models.Tier.findByPk(order.tier.id);

      if (!tier) {
        throw new Error(`No tier found with tier id: ${order.tier.id} for collective slug ${order.collective.slug}`);
      }
    }

    const paymentRequired = (order.totalAmount > 0 || (tier && tier.amount > 0)) && collective.isActive;
    debug('paymentRequired', paymentRequired, 'total amount:', order.totalAmount, 'isActive', collective.isActive);
    if (
      paymentRequired &&
      (!order.paymentMethod ||
        !(order.paymentMethod.uuid || order.paymentMethod.token || order.paymentMethod.type === 'manual'))
    ) {
      throw new Error('This order requires a payment method');
    }

    if (tier && tier.maxQuantityPerUser > 0 && order.quantity > tier.maxQuantityPerUser) {
      throw new Error(
        `You can buy up to ${tier.maxQuantityPerUser} ${pluralize('ticket', tier.maxQuantityPerUser)} per person`,
      );
    }

    if (tier) {
      const enoughQuantityAvailable = await tier.checkAvailableQuantity(order.quantity);
      if (!enoughQuantityAvailable) {
        throw new Error(`No more tickets left for ${tier.name}`);
      }
    }

    // find or create user, check permissions to set `fromCollective`
    let user;
    if (order.user && order.user.email) {
      // Form changes in frontend when trying to create an order with an
      // existing email, asking user to login. So if user given in `order.user`
      // already exists, that could mean two things:
      // 1. Email is registered under another account as Paypal address.
      // 2. We got a bad payload trying to impersonate another user.
      const existingUser = await models.User.findByEmailOrPaypalEmail(order.user.email);
      if (existingUser) {
        throw new Error('An account already exists for this email address. Please login.');
      }
      user = await models.User.createUserWithCollective({
        ...order.user,
        currency: order.currency,
        CreatedByUserId: remoteUser ? remoteUser.id : null,
      });
    } else if (remoteUser) {
      user = remoteUser;
    }

    let fromCollective;
    if (!order.fromCollective || (!order.fromCollective.id && !order.fromCollective.name)) {
      fromCollective = await loaders.collective.findById.load(user.CollectiveId);
    }

    // If a `fromCollective` is provided, we check its existence and if the user can create an order on its behalf
    if (order.fromCollective && order.fromCollective.id) {
      if (!remoteUser) {
        throw new Error('You need to be logged in to create an order for an existing open collective');
      }

      fromCollective = await loaders.collective.findById.load(order.fromCollective.id);
      if (!fromCollective) {
        throw new Error(`From collective id ${order.fromCollective.id} not found`);
      }

      const possibleRoles = [roles.ADMIN, roles.HOST];
      if (fromCollective.type === types.ORGANIZATION) {
        possibleRoles.push(roles.MEMBER);
      }

      if (!remoteUser.hasRole(possibleRoles, order.fromCollective.id)) {
        // We only allow to add funds on behalf of a collective if the user is an admin of that collective or an admin of the host of the collective that receives the money
        const HostId = await collective.getHostCollectiveId();
        if (!remoteUser.isAdmin(HostId)) {
          throw new Error(
            `You don't have sufficient permissions to create an order on behalf of the ${
              fromCollective.name
            } ${fromCollective.type.toLowerCase()}`,
          );
        }
      }
    }

    if (!fromCollective) {
      fromCollective = await models.Collective.createOrganization(order.fromCollective, user, remoteUser);
    }

    const currency = (tier && tier.currency) || collective.currency;
    if (order.currency && order.currency !== currency) {
      throw new Error(`Invalid currency. Expected ${currency}.`);
    }

    // ---- Taxes (VAT) ----
    let taxFromCountry = null;
    let taxPercent = 0;
    let vatSettings = {};

    // Load tax info from DB, ignore if amount is 0
    if (order.totalAmount !== 0 && tier && LibTaxes.isTierTypeSubjectToVAT(tier.type)) {
      let hostCollective = null;
      let parentCollective = null;

      // Load host and parent collective
      if (collective.HostCollectiveId) {
        hostCollective = await loaders.collective.findById.load(collective.HostCollectiveId);
      }

      if (collective.ParentCollectiveId) {
        parentCollective = await loaders.collective.findById.load(collective.ParentCollectiveId);
        if (parentCollective && !hostCollective) {
          hostCollective = await loaders.collective.findById.load(parentCollective.HostCollectiveId);
        }
      }

      // Check if VAT is enabled
      const vatType = get(collective, 'settings.VAT.type') || get(parentCollective, 'settings.VAT.type');
      const baseCountry = collective.countryISO || get(parentCollective, 'countryISO');
      if (vatType === VAT_OPTIONS.OWN) {
        taxFromCountry = LibTaxes.getVatOriginCountry(tier.type, baseCountry, baseCountry);
        vatSettings = { ...get(parentCollective, 'settings.VAT'), ...get(collective, 'settings.VAT') };
      } else {
        const hostCountry = get(hostCollective, 'countryISO');
        taxFromCountry = LibTaxes.getVatOriginCountry(tier.type, hostCountry, baseCountry);
        vatSettings = get(hostCollective, 'settings.VAT') || {};
      }

      // Adapt tax based on country / tax ID number
      if (taxFromCountry) {
        if (!order.countryISO) {
          throw Error('This order has a tax attached, you must set a country');
        } else if (order.taxIDNumber && !LibTaxes.checkVATNumberFormat(order.taxIDNumber).isValid) {
          throw Error('Invalid VAT number');
        }

        const hasVatNumber = Boolean(order.taxIDNumber);
        taxPercent = LibTaxes.getVatPercentage(tier.type, taxFromCountry, order.countryISO, hasVatNumber);
      }
    }

    // Ensure tax amount is not out-of-bound
    if (order.taxAmount < 0) {
      throw Error('Tax amount cannot be negative');
    } else if (taxPercent === 0 && order.taxAmount !== 0) {
      throw Error(
        `This order should not have any tax attached. Received tax amount ${formatCurrency(order.taxAmount, currency)}`,
      );
    }

    // ---- Checks on totalAmount ----
    if (order.totalAmount < 0) {
      throw new Error('Total amount cannot be a negative value');
    }
    // Don't allow custom values if using a tier with fixed amount
    if (tier && tier.amount && !tier.presets) {
      // Manually force the totalAmount if it has not been passed
      if (isNil(order.totalAmount)) {
        order.totalAmount = Math.round(order.quantity * tier.amount * (1 + taxPercent / 100));
      }

      const netAmountForCollective = order.totalAmount - order.taxAmount;
      const expectedAmountForCollective = order.quantity * tier.amount;
      const expectedTaxAmount = Math.round((expectedAmountForCollective * taxPercent) / 100);

      if (netAmountForCollective !== expectedAmountForCollective || order.taxAmount !== expectedTaxAmount) {
        const prettyTotalAmount = formatCurrency(order.totalAmount, currency, 2);
        const prettyExpectedAmount = formatCurrency(expectedAmountForCollective, currency, 2);
        const taxInfo = expectedTaxAmount ? ` + ${formatCurrency(expectedTaxAmount, currency, 2)} tax` : '';
        throw new Error(
          `This tier uses a fixed amount. Order total must be ${prettyExpectedAmount}${taxInfo}. You set: ${prettyTotalAmount}`,
        );
      }
    }

    // If using a tier, amount can never be less than the minimum amount
    if (tier && tier.minimumAmount) {
      const minAmount = tier.minimumAmount * order.quantity;
      const minTotalAmount = taxPercent ? Math.round(minAmount * (1 + taxPercent / 100)) : minAmount;
      if ((order.totalAmount || 0) < minTotalAmount) {
        const prettyMinTotal = formatCurrency(minTotalAmount, currency);
        throw new Error(`The amount you set is below minimum tier value, it should be at least ${prettyMinTotal}`);
      }
    }

    const tierNameInfo = tier && tier.name ? ` (${tier.name})` : '';
    let defaultDescription;
    if (order.interval) {
      defaultDescription = `${capitalize(order.interval)}ly donation to ${collective.name}${tierNameInfo}`;
    } else {
      defaultDescription = `${
        order.totalAmount === 0 || collective.type === types.EVENT ? 'Registration' : 'Donation'
      } to ${collective.name}${tierNameInfo}`;
    }
    debug('defaultDescription', defaultDescription, 'collective.type', collective.type);

    const orderData = {
      CreatedByUserId: remoteUser ? remoteUser.id : user.id,
      FromCollectiveId: fromCollective.id,
      CollectiveId: collective.id,
      TierId: tier && tier.id,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      currency,
      taxAmount: taxFromCountry ? order.taxAmount : null,
      interval: order.interval,
      description: order.description || defaultDescription,
      publicMessage: order.publicMessage, // deprecated: '2019-07-03: This info is now stored at the Member level'
      privateMessage: order.privateMessage,
      processedAt: paymentRequired || !collective.isActive ? null : new Date(),
      data: {
        reqIp,
        recaptchaResponse,
        tax: taxFromCountry && {
          id: 'VAT',
          taxerCountry: taxFromCountry,
          taxedCountry: order.countryISO,
          percentage: taxPercent,
          taxIDNumber: order.taxIDNumber,
          taxIDNumberFrom: vatSettings.number,
        },
        customData: order.customData,
      },
      status: status.PENDING, // default status, will get updated after the order is processed
    };

    // Handle status for "free" orders
    if (orderData.totalAmount === 0) {
      orderData.status = order.interval ? status.ACTIVE : status.PAID;
    }

    if (order.referral && get(order, 'referral.id') !== orderData.FromCollectiveId) {
      orderData.ReferralCollectiveId = order.referral.id;
    }

    orderCreated = await models.Order.create(orderData);

    if (order.paymentMethod && order.paymentMethod.save) {
      order.paymentMethod.CollectiveId = orderCreated.FromCollectiveId;
    }

    if (paymentRequired) {
      if (get(order, 'paymentMethod.type') === 'manual') {
        orderCreated.paymentMethod = order.paymentMethod;
      } else {
        await orderCreated.setPaymentMethod(order.paymentMethod);
      }
      // also adds the user as a BACKER of collective
      try {
        await libPayments.executeOrder(
          remoteUser || user,
          orderCreated,
          pick(order, ['hostFeePercent', 'platformFeePercent']),
        );
      } catch (e) {
        // Don't save new card for user if order failed
        if (!order.paymentMethod.id && !order.paymentMethod.uuid) {
          await orderCreated.paymentMethod.update({ CollectiveId: null });
        }
        throw e;
      }
    } else if (!paymentRequired && order.interval && collective.type === types.COLLECTIVE) {
      // create inactive subscription to hold the interval info for the pledge
      const subscription = await models.Subscription.create({
        amount: order.totalAmount,
        interval: order.interval,
        currency: order.currency,
      });
      await orderCreated.update({ SubscriptionId: subscription.id });
    } else if (collective.type === types.EVENT) {
      // Free ticket, mark as processed and add user as an ATTENDEE
      await orderCreated.update({ status: 'PAID', processedAt: new Date() });
      const UserId = remoteUser ? remoteUser.id : user.id;
      await collective.addUserWithRole(user, roles.ATTENDEE);
      await models.Activity.create({
        type: activities.TICKET_CONFIRMED,
        data: {
          EventCollectiveId: collective.id,
          UserId,
          recipient: { name: fromCollective.name },
          order: orderCreated.info,
          tier: tier && tier.info,
        },
      });
    }

    order = await models.Order.findByPk(orderCreated.id);

    // If there was a referral for this order, we add it as a FUNDRAISER role
    if (order.ReferralCollectiveId && order.ReferralCollectiveId !== user.CollectiveId) {
      collective.addUserWithRole({ id: user.id, CollectiveId: order.ReferralCollectiveId }, roles.FUNDRAISER);
    }

    return order;
  } catch (error) {
    console.log(error);

    if (orderCreated) {
      if (!orderCreated.processedAt) {
        // TODO: Order should be updated with data JSON field to store the error to review later
        orderCreated.update({ status: status.ERROR });
      }

      if (!error.stripeResponse) {
        throw error;
      }

      orderCreated.stripeError = {
        message: error.message,
        account: error.stripeAccount,
        response: error.stripeResponse,
      };

      return orderCreated;
    }

    throw error;
  }
}

export async function confirmOrder(order, remoteUser) {
  if (!remoteUser) {
    throw new errors.Unauthorized({ message: 'You need to be logged in to confirm an order' });
  }

  const existingOrder = await models.Order.findOne({
    where: {
      id: order.id,
    },
    include: [
      { model: models.Collective, as: 'collective' },
      { model: models.Collective, as: 'fromCollective' },
      { model: models.PaymentMethod, as: 'paymentMethod' },
    ],
  });

  if (!existingOrder) {
    throw new errors.NotFound({ message: 'Order not found' });
  }
  if (!remoteUser.isAdmin(existingOrder.FromCollectiveId)) {
    throw new errors.Unauthorized({ message: "You don't have permission to confirm this order" });
  }
  if (existingOrder.status !== 'ERROR' && existingOrder.status !== 'PENDING') {
    throw new errors.NotFound({ message: 'Order can only be confirmed if ERROR or PENDING.' });
  }

  try {
    await libPayments.executeOrder(remoteUser, existingOrder);

    return existingOrder;
  } catch (error) {
    console.log(error);

    if (!error.stripeResponse) {
      throw error;
    }

    existingOrder.stripeError = {
      message: error.message,
      account: error.stripeAccount,
      response: error.stripeResponse,
    };

    return existingOrder;
  }
}

export async function completePledge(remoteUser, order) {
  if (!remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to update an order',
    });
  }

  const existingOrder = await models.Order.findOne({
    where: {
      id: order.id,
    },
    include: [{ model: models.Collective, as: 'collective' }, { model: models.Collective, as: 'fromCollective' }],
  });

  if (!existingOrder) {
    throw new errors.NotFound({
      message: 'Existing order not found',
    });
  }

  const paymentRequired = order.totalAmount > 0 && existingOrder.collective.isActive;

  if (
    paymentRequired &&
    (!order.paymentMethod ||
      !(order.paymentMethod.uuid || order.paymentMethod.token || order.paymentMethod.type === 'manual'))
  ) {
    throw new Error('This order requires a payment method');
  }

  if (order.paymentMethod && order.paymentMethod.save) {
    order.paymentMethod.CollectiveId = existingOrder.FromCollectiveId;
  }

  if (paymentRequired) {
    existingOrder.interval = order.interval;
    if (get(order, 'paymentMethod.type') === 'manual') {
      existingOrder.paymentMethod = order.paymentMethod;
    } else {
      await existingOrder.setPaymentMethod(order.paymentMethod);
    }
    // also adds the user as a BACKER of collective
    await libPayments.executeOrder(remoteUser, existingOrder, pick(order, ['hostFeePercent', 'platformFeePercent']));
  }
  await existingOrder.reload();
  return existingOrder;
}

export function cancelSubscription(remoteUser, orderId) {
  if (!remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to cancel a subscription',
    });
  }

  let order = null;
  const query = {
    where: {
      id: orderId,
    },
    include: [
      { model: models.Subscription },
      { model: models.Collective, as: 'collective' },
      { model: models.Collective, as: 'fromCollective' },
    ],
  };
  return (
    models.Order.findOne(query)
      .tap(o => (order = o))
      .tap(order => {
        if (!order) {
          throw new Error('Subscription not found');
        }
        return Promise.resolve();
      })
      .tap(order => {
        if (!remoteUser.isAdmin(order.FromCollectiveId)) {
          throw new errors.Unauthorized({
            message: "You don't have permission to cancel this subscription",
          });
        }
        return Promise.resolve();
      })
      .tap(order => {
        if (!order.Subscription.isActive && order.status === status.CANCELLED) {
          throw new Error('Subscription already canceled');
        }
        return Promise.resolve();
      })
      .then(order => Promise.all([order.update({ status: status.CANCELLED }), order.Subscription.deactivate()]))

      // createActivity - that sends out the email
      .then(() =>
        models.Activity.create({
          type: activities.SUBSCRIPTION_CANCELED,
          CollectiveId: order.CollectiveId,
          UserId: order.CreatedByUserId,
          data: {
            subscription: order.Subscription,
            collective: order.collective.minimal,
            user: remoteUser.minimal,
            fromCollective: order.fromCollective.minimal,
          },
        }),
      )
      .then(() => models.Order.findOne(query))
  ); // need to fetch it second time to get updated data.
}

export async function updateSubscription(remoteUser, args) {
  if (!remoteUser) {
    throw new errors.Unauthorized({
      message: 'You need to be logged in to update a subscription',
    });
  }

  const { id, paymentMethod, amount } = args;

  const query = {
    where: {
      id,
    },
    include: [{ model: models.Subscription }, { model: models.PaymentMethod, as: 'paymentMethod' }],
  };

  let order = await models.Order.findOne(query);

  if (!order) {
    throw new Error('Subscription not found');
  }
  if (!remoteUser.isAdmin(order.FromCollectiveId)) {
    throw new errors.Unauthorized({
      message: "You don't have permission to update this subscription",
    });
  }
  if (!order.Subscription.isActive) {
    throw new Error('Subscription must be active to be updated');
  }

  if (paymentMethod !== undefined) {
    let newPm;

    // TODO: Would be even better if we could charge you here directly
    // before letting you proceed

    try {
      // means it's an existing paymentMethod
      if (paymentMethod.uuid && paymentMethod.uuid.length === 36) {
        newPm = await models.PaymentMethod.findOne({
          where: { uuid: paymentMethod.uuid },
        });
        if (!newPm) {
          throw new Error('Payment method not found with this uuid', paymentMethod.uuid);
        }
      } else {
        // means it's a new paymentMethod
        const newPMData = Object.assign(paymentMethod, {
          CollectiveId: order.FromCollectiveId,
        });

        newPm = await models.PaymentMethod.create(newPMData);
        newPm = await setupCreditCard(newPm, {
          user: remoteUser,
        });
      }

      // determine if this order was pastdue
      if (order.Subscription.chargeRetryCount > 0) {
        const updatedDates = getNextChargeAndPeriodStartDates('updated', order);
        const chargeRetryCount = getChargeRetryCount('updated', order);

        await order.Subscription.update({
          nextChargeDate: updatedDates.nextChargeDate,
          chargeRetryCount,
        });
      }

      order = await order.update({ PaymentMethodId: newPm.id });
    } catch (error) {
      console.log(error);

      if (!error.stripeResponse) {
        throw error;
      }

      order.stripeError = {
        message: error.message,
        response: error.stripeResponse,
      };
    }
  }

  if (amount !== undefined) {
    if (amount == order.Subscription.amount) {
      throw new Error('Same amount');
    }

    if (amount < 100 || amount % 100 !== 0) {
      throw new Error('Invalid amount');
    }
    await order.Subscription.deactivate();
    order.status = status.CANCELLED;
    await order.save();

    const newSubscriptionDataValues = Object.assign(omit(order.Subscription.dataValues, ['id', 'deactivatedAt']), {
      amount: amount,
      createdAt: new Date(),
      updatedAt: new Date(),
      activatedAt: new Date(),
      isActive: true,
    });

    const newSubscription = await models.Subscription.create(newSubscriptionDataValues);

    const newOrderDataValues = Object.assign(omit(order.dataValues, ['id']), {
      totalAmount: amount,
      SubscriptionId: newSubscription.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: status.ACTIVE,
    });

    order = await models.Order.create(newOrderDataValues);
  }

  return order;
}

export async function refundTransaction(_, args, req) {
  // 0. Retrieve transaction from database
  const transaction = await models.Transaction.findByPk(args.id, {
    include: [models.Order, models.PaymentMethod],
  });

  if (!transaction) {
    throw new errors.NotFound({ message: 'Transaction not found' });
  }

  const collective = await models.Collective.findByPk(transaction.CollectiveId);
  const isHost = await collective.isHost();
  const HostCollectiveId = isHost ? collective.id : await collective.getHostCollectiveId();

  // 1. Verify user permission. User must be either
  //   a. User that created transaction (within 24h) -- Not implemented yet
  //   b. Host Collective receiving the donation
  //   c. Site Admin

  if (!req.remoteUser.isAdmin(HostCollectiveId) && !req.remoteUser.isRoot()) {
    throw new errors.Unauthorized({ message: 'Not a site admin or host collective admin' });
  }

  // 2. Refund via payment method
  // 3. Create new transactions with the refund value in our database
  const result = await libPayments.refundTransaction(transaction, req.remoteUser);

  // Return the transaction passed to the `refundTransaction` method
  // after it was updated.
  return result;
}

/** Create prepaid payment method that can be used by an organization
 *
 * @param {Object} args contains the parameters to create the new
 *  payment method.
 * @param {String} args.description The description of the new payment
 *  method.
 * @param {Number} args.CollectiveId The ID of the organization
 *  receiving the prepaid card.
 * @param {Number} args.HostCollectiveId The ID of the host that
 *  received the money on its bank account.
 * @param {Number} args.totalAmount The total amount that will be
 *  credited to the newly created payment method.
 * @param {models.User} remoteUser is the user creating the new credit
 *  card. Right now only site admins can use this feature.
 */
export async function addFundsToOrg(args, remoteUser) {
  if (!remoteUser.isRoot()) throw new Error('Only site admins can perform this operation');
  const [fromCollective, hostCollective] = await Promise.all([
    models.Collective.findByPk(args.CollectiveId),
    models.Collective.findByPk(args.HostCollectiveId),
  ]);
  // creates a new Payment method
  const paymentMethod = await models.PaymentMethod.create({
    name: args.description || 'Host funds',
    initialBalance: args.totalAmount,
    monthlyLimitPerMember: null,
    currency: hostCollective.currency,
    CollectiveId: args.CollectiveId,
    customerId: fromCollective.slug,
    expiryDate: moment()
      .add(1, 'year')
      .format(),
    uuid: uuidv4(),
    data: { HostCollectiveId: args.HostCollectiveId },
    service: 'opencollective',
    type: 'prepaid',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return paymentMethod;
}

export async function markOrderAsPaid(remoteUser, id) {
  if (!remoteUser) {
    throw new errors.Unauthorized();
  }

  // fetch the order
  const order = await models.Order.findByPk(id);
  if (!order) {
    throw new errors.NotFound({ message: 'Order not found' });
  }
  if (order.status !== 'PENDING') {
    throw new errors.ValidationFailed({
      message: "The order's status must be PENDING",
    });
  }
  const HostCollectiveId = await models.Collective.getHostCollectiveId(order.CollectiveId);
  if (!remoteUser.isAdmin(HostCollectiveId)) {
    throw new errors.Unauthorized({
      message: 'You must be logged in as an admin of the host of the collective',
    });
  }

  order.paymentMethod = {
    service: 'opencollective',
    type: 'manual',
    paid: true,
  };
  /**
   * Takes care of:
   * - creating the transactions
   * - add backer as a BACKER in the Members table
   * - send confirmation email
   * - update order.status and order.processedAt
   */
  await libPayments.executeOrder(remoteUser, order);
  return order;
}

export async function addFundsToCollective(order, remoteUser) {
  if (!remoteUser) {
    throw new Error('You need to be logged in to add fund to collective');
  }

  if (order.totalAmount < 0) {
    throw new Error('Total amount cannot be a negative value');
  }

  const collective = await models.Collective.findByPk(order.collective.id);
  if (!collective) {
    throw new Error(`No collective found: ${order.collective.id}`);
  }

  if (order.fromCollective && order.fromCollective.id === collective.id) {
    throw new Error('Orders cannot be created for a collective by that same collective.');
  }

  const HostCollectiveId = await collective.getHostCollectiveId();
  if (!remoteUser.isAdmin(HostCollectiveId) && !remoteUser.isRoot()) {
    throw new Error('Only an site admin or collective host admin can add fund');
  }

  order.collective = collective;
  let fromCollective, user;

  if (order.user && order.user.email) {
    user = await models.User.findByEmailOrPaypalEmail(order.user.email);
    if (!user) {
      user = await models.User.createUserWithCollective({
        ...order.user,
        currency: collective.currency,
        CreatedByUserId: remoteUser ? remoteUser.id : null,
      });
    }
  } else if (remoteUser) {
    user = remoteUser;
  }

  if (order.fromCollective.id) {
    fromCollective = await models.Collective.findByPk(order.fromCollective.id);
    if (!fromCollective) {
      throw new Error(`From collective id ${order.fromCollective.id} not found`);
    }
  } else {
    fromCollective = await models.Collective.createOrganization(order.fromCollective, user, remoteUser);
  }

  const orderData = {
    CreatedByUserId: remoteUser.id || user.id,
    FromCollectiveId: fromCollective.id,
    CollectiveId: collective.id,
    totalAmount: order.totalAmount,
    currency: collective.currency,
    description: order.description,
    status: status.PENDING,
  };

  const orderCreated = await models.Order.create(orderData);
  await orderCreated.setPaymentMethod(order.paymentMethod);

  try {
    await libPayments.executeOrder(
      remoteUser || user,
      orderCreated,
      pick(order, ['hostFeePercent', 'platformFeePercent']),
    );
  } catch (e) {
    // Don't save new card for user if order failed
    if (!order.paymentMethod.id && !order.paymentMethod.uuid) {
      await orderCreated.paymentMethod.update({ CollectiveId: null });
    }
    throw e;
  }

  return models.Order.findByPk(orderCreated.id);
}
