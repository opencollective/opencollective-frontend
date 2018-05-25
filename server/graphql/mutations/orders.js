import { pick, omit, get } from 'lodash';
import debug from 'debug';
import Promise from 'bluebird';

import models from '../../models';
import { capitalize, pluralize } from '../../lib/utils';
import * as libPayments from '../../lib/payments';
import emailLib from '../../lib/email';
import { types } from '../../constants/collectives';
import roles from '../../constants/roles';
import * as errors from '../errors';
import activities from '../../constants/activities';
import { getNextChargeAndPeriodStartDates, getChargeRetryCount} from '../../lib/subscriptions';

const debugOrder = debug('order');

export function createOrder(order, loaders, remoteUser) {
  let tier, collective, fromCollective, paymentRequired, interval, orderCreated, user;

  if (order.paymentMethod && order.paymentMethod.service === 'stripe' && order.paymentMethod.uuid && !remoteUser) {
    throw new Error("You need to be logged in to be able to use a payment method on file");
  }

  if (!order.collective || !order.collective.id) {
    throw new Error("No collective id provided");
  }

  if (order.platformFeePercent && !remoteUser.isRoot()) {
    throw new Error(`Only a root can change the platformFeePercent`);
  }

  // Check the existence of the recipient Collective
  return loaders.collective.findById.load(order.collective.id)
  .then(c => {
    if (!c) {
      throw new Error(`No collective found with id: ${order.collective.id}`);
    }
    order.collective = collective = c;

    if (!collective.isActive) {
      throw new Error(`This collective is not active`);
    }

    if (order.fromCollective && order.fromCollective.id === collective.id) {
      throw new Error(`Well tried. But no you can't order yourself something ;-)`);
    }

    if (order.hostFeePercent) {
      return collective.getHostCollectiveId().then(HostCollectiveId => {
        if (!remoteUser.isAdmin(HostCollectiveId)) {
          throw new Error(`Only an admin of the host can change the hostFeePercent`);
        }
      });
    }
  })
  // Check the existence of the tier
  .then(() => {
    if (!order.tier) return;
    return models.Tier.findById(order.tier.id)
      .then(tier => {
        if (!tier) throw new Error(`No tier found with tier id: ${order.tier.id} for collective slug ${collective.slug}`);
        return tier;
      })
  })
  .then(t => {
    tier = t; // we may not have a tier
    paymentRequired = order.totalAmount > 0 || tier && tier.amount > 0;

    // interval of the tier can only be overridden if it is null (e.g. for custom donations)
    // TODO: using order.interval over Tiers will likely include donations that shouldn't be in tiers.
    // Need to reevalute with always respecting user choice.

    interval = order.interval;
  })

  // make sure that we have a payment method attached if this order requires a payment (totalAmount > 0)
  .then(() => {
    if (paymentRequired) {
      if (!order.paymentMethod || !(order.paymentMethod.uuid || order.paymentMethod.token)) {
        throw new Error(`This order requires a payment method`);
      }
    }
  })

  // check for available quantity of the tier if any
  .then(() => {
    if (!tier) return;
    if (tier.maxQuantityPerUser > 0 && order.quantity > tier.maxQuantityPerUser) {
      Promise.reject(new Error(`You can buy up to ${tier.maxQuantityPerUser} ${pluralize('ticket', tier.maxQuantityPerUser)} per person`));
    }
    return tier.checkAvailableQuantity(order.quantity)
    .then(enoughQuantityAvailable => enoughQuantityAvailable ?
      Promise.resolve() : Promise.reject(new Error(`No more tickets left for ${tier.name}`)))
    })

    // find or create user, check permissions to set `fromCollective`
    .then(() => {
      if (order.user && order.user.email) {
        return models.User.findOrCreateByEmail(order.user.email, {
          ...order.user,
          currency: order.currency,
          CreatedByUserId: remoteUser ? remoteUser.id : null,
        });
      }
      if (remoteUser) return remoteUser;
    })

    // returns the fromCollective
    .then(u => {
      user = u;

      if (!order.fromCollective || (!order.fromCollective.id && !order.fromCollective.name)) {
        return models.Collective.findById(user.CollectiveId);
      }

      // If a `fromCollective` is provided, we check its existence and if the user can create an order on its behalf
      if (order.fromCollective.id) {
        if (!remoteUser) throw new Error(`You need to be logged in to create an order for an existing open collective`);
        return loaders.collective.findById.load(order.fromCollective.id)
        .then(c => {
          if (!c) throw new Error(`From collective id ${order.fromCollective.id} not found`);
          const possibleRoles = [roles.ADMIN, roles.HOST];
          if (c.type === types.ORGANIZATION) {
            possibleRoles.push(roles.MEMBER);
          }
          if (!remoteUser.hasRole(possibleRoles, order.fromCollective.id)) {
            // We only allow to add funds on behalf of a collective if the user is an admin of that collective or an admin of the host of the collective that receives the money
            return collective.getHostCollectiveId().then(HostCollectiveId => {
              if (!remoteUser.isAdmin(HostCollectiveId)) {
                throw new Error(`You don't have sufficient permissions to create an order on behalf of the ${c.name} ${c.type.toLowerCase()}`);
              } else {
                return c;
              }
            });
          }
          return c;
        });
      } else {
        // Create new organization collective
        if (remoteUser) {
          order.fromCollective.CreatedByUserId = remoteUser.id;
        }
        return models.Collective.createOrganization(order.fromCollective, user)
      }
    })
    .then(c => fromCollective = c)

    // check if the MatchingFund is valid and has enough funds
    .then(async () => {
      if (order.matchingFund) {
        const matchingPaymentMethod = await models.PaymentMethod.getMatchingFund(order.matchingFund, { ForCollectiveId: collective.id });
        const canBeUsedForOrder = await matchingPaymentMethod.canBeUsedForOrder(order, user);
        if (canBeUsedForOrder) return matchingPaymentMethod;
        else return null;
      }
    })
    .then((matchingFund) => {
      if (matchingFund) {
        order.matchingFund = matchingFund;
        order.MatchingPaymentMethodId = matchingFund.id;
        order.referral = { id: matchingFund.CollectiveId }; // if there is a matching fund, we force the referral to be the owner of the fund
      }
      const currency = tier && tier.currency || collective.currency;
      if (order.currency && order.currency !== currency) {
        throw new Error(`Invalid currency. Expected ${currency}.`);
      }
      const quantity = order.quantity || 1;
      let totalAmount;
      if (tier && tier.amount && !tier.presets) { // if the tier has presets, we can't enforce tier.amount
        totalAmount = tier.amount * quantity;
      } else {
        totalAmount = order.totalAmount; // e.g. the donor tier doesn't set an amount
      }

      const tierNameInfo = (tier && tier.name) ? ` (${tier.name})` : '';
      let defaultDescription;
      if (interval) {
        defaultDescription = `${capitalize(interval)}ly donation to ${collective.name}${tierNameInfo}`;
      } else {
        defaultDescription = `Donation to ${collective.name}${tierNameInfo}`
      }

      const orderData = {
        CreatedByUserId: remoteUser ? remoteUser.id : user.id,
        FromCollectiveId: fromCollective.id,
        CollectiveId: collective.id,
        TierId: tier && tier.id,
        quantity,
        totalAmount,
        currency,
        interval,
        description: order.description || defaultDescription,
        publicMessage: order.publicMessage,
        privateMessage: order.privateMessage,
        processedAt: paymentRequired ? null : new Date,
        MatchingPaymentMethodId: order.MatchingPaymentMethodId
      };

      if (order.referral && get(order, 'referral.id') !== orderData.FromCollectiveId) {
        orderData.ReferralCollectiveId = order.referral.id;
      }

      return models.Order.create(orderData)
    })

    // process payment, if needed
    .then(oi => {
      orderCreated = oi;
      orderCreated.interval = interval;
      orderCreated.matchingFund = order.matchingFund;
      if (order.paymentMethod && order.paymentMethod.save) {
        order.paymentMethod.CollectiveId = orderCreated.FromCollectiveId;
      }
      if (paymentRequired) {
        return orderCreated
          .setPaymentMethod(order.paymentMethod)
          .then(() => libPayments.executeOrder(remoteUser || user, orderCreated, pick(order, ['hostFeePercent', 'platformFeePercent']))) // also adds the user as a BACKER of collective
      } else {
        // Free ticket, add user as an ATTENDEE
        const email = (remoteUser) ? remoteUser.email : order.user.email;
        return collective.addUserWithRole(user, roles.ATTENDEE)
          .then(() => emailLib.send('ticket.confirmed', email, {
          recipient: { name: fromCollective.name },
          collective: collective.info,
          order: orderCreated.info,
          tier: tier && tier.info
        }));
      }
    })
    // make sure we return the latest version of the Order Instance
    .then(() => models.Order.findById(orderCreated.id))
    .then(order => {
      // If there was a referral for this order, we add it as a FUNDRAISER role
      if (order.ReferralCollectiveId && order.ReferralCollectiveId !== user.CollectiveId) {
        collective.addUserWithRole({ id: user.id, CollectiveId: order.ReferralCollectiveId }, roles.FUNDRAISER);
      }
      return order;
    })
    .catch(e => {
      debugOrder("createOrder mutation error: ", e);
      throw e;
    });
}

export function cancelSubscription(remoteUser, orderId) {

  if (!remoteUser) {
    throw new errors.Unauthorized({ message: "You need to be logged in to cancel a subscription" });
  }

  let order = null;
  const query = {
    where: {
      id: orderId
    },
    include: [
      { model: models.Subscription},
      { model: models.Collective, as: 'collective'},
      { model: models.Collective, as: 'fromCollective'}
    ]
  };
  return models.Order.findOne(query)
  .tap(o => order = o)
  .tap(order => {
    if (!order) {
      throw new Error("Subscription not found")
    }
    return Promise.resolve()
  })
  .tap(order => {
    if (!remoteUser.isAdmin(order.FromCollectiveId)) {
      throw new errors.Unauthorized({
        message: "You don't have permission to cancel this subscription"
      })
    }
    return Promise.resolve();
  })
  .tap(order => {
    if (!order.Subscription.isActive) {
      throw new Error("Subscription already canceled")
    }
    return Promise.resolve();
  })
  .then(order => order.Subscription.deactivate())

  // createActivity - that sends out the email
  .then(() => models.Activity.create({
        type: activities.SUBSCRIPTION_CANCELED,
        CollectiveId: order.CollectiveId,
        UserId: order.CreatedByUserId,
        data: {
          subscription: order.Subscription,
          collective: order.collective.minimal,
          user: remoteUser.minimal,
          fromCollective: order.fromCollective.minimal
        }
      }))
  .then(() => models.Order.findOne(query)) // need to fetch it second time to get updated data.
}

export async function updateSubscription(remoteUser, args) {
  if (!remoteUser) {
    throw new errors.Unauthorized({ message: "You need to be logged in to update a subscription"});
  }

  const { id, paymentMethod, amount } = args;

  const query = {
    where: {
      id,
    },
    include: [
      { model: models.Subscription},
      { model: models.PaymentMethod, as: 'paymentMethod'}
    ]
  };

  let order = await models.Order.findOne(query);

  if (!order) {
    throw new Error("Subscription not found")
  }
  if (!remoteUser.isAdmin(order.FromCollectiveId)) {
    throw new errors.Unauthorized({
      message: "You don't have permission to update this subscription"
    })
  }
  if (!order.Subscription.isActive) {
    throw new Error('Subscription must be active to be updated');
  }

  if (paymentMethod !== undefined) {
      let newPm;

      // TODO: Would be even better if we could charge you here directly
      // before letting you proceed

      // means it's an existing paymentMethod
      if (paymentMethod.uuid && paymentMethod.uuid.length === 36) {
        newPm = await models.PaymentMethod.findOne({ where: { uuid: paymentMethod.uuid }});
        if (!newPm){
          throw new Error('Payment method not found with this uuid', paymentMethod.uuid);
        }
      } else {
        // means it's a new paymentMethod
        const newPMData = Object.assign(paymentMethod, { CollectiveId: order.FromCollectiveId });
        newPm = await models.PaymentMethod.createFromStripeSourceToken(newPMData);
      }

      // determine if this order was pastdue
      if (order.Subscription.chargeRetryCount > 0) {
        const updatedDates = getNextChargeAndPeriodStartDates('updated', order);
        const chargeRetryCount = getChargeRetryCount('updated', order);

        await order.Subscription.update({ nextChargeDate: updatedDates.nextChargeDate, chargeRetryCount });
      }

      order = await order.update({ PaymentMethodId: newPm.id});
  }

  if (amount !== undefined) {

    if (amount == order.Subscription.amount) {
      throw new Error('Same amount');
    }

    if (amount < 100 || amount % 100 !== 0) {
      throw new Error('Invalid amount');
    }

    order.Subscription.deactivate();

    const newSubscriptionDataValues = Object.assign(omit(order.Subscription.dataValues, [
      'id',
      'deactivatedAt',
    ]), {
      amount: amount,
      updatedAt: new Date,
      activatedAt: new Date,
      isActive: true,
    });

    const newSubscription = await models.Subscription.create(newSubscriptionDataValues);

    const newOrderDataValues = Object.assign(omit(order.dataValues, [
      'id',
    ]), {
      totalAmount: amount,
      SubscriptionId: newSubscription.id,
      updatedAt: new Date,
    });

    order = await models.Order.create(newOrderDataValues);
  }

  return order;
}

export async function refundTransaction(_, args, req) {
  // 0. Retrieve transaction from database
  const transaction = await models.Transaction.findById(args.id, {
    include: [models.Order, models.PaymentMethod] });
  if (!transaction) {
    throw new errors.NotFound({ message: 'Transaction not found' });
  }

  // 1. Verify user permission. User must be either
  //   a. User that created transaction (within 24h) -- Not implemented yet
  //   b. Host Collective receiving the donation -- Not implemented yet
  //   c. Site Admin
  if (!req.remoteUser.isRoot()) {
    throw new errors.Unauthorized({ message: "Not a site admin" });
  }

  // 2. Refund via payment method
  // 3. Create new transactions with the refund value in our database
  const result = await libPayments.refundTransaction(
    transaction, req.remoteUser);

  // Return the transaction passed to the `refundTransaction` method
  // after it was updated.
  return result;
}
