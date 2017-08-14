import Promise from 'bluebird';
import _ from 'lodash';

import models from '../models';
import { capitalize } from '../lib/utils';
import emailLib from './email';
import roles from '../constants/roles';
import { types } from '../constants/collectives';
import activities from '../constants/activities';
import * as transactions from '../constants/transactions';
import * as stripe from '../gateways/stripe';

/**
 * Creates payment - records the intent to pay in our system 
 * TODO: refactor to only pass the order instance
 */
const createPayment = (payload) => {

  const {
    order,
    payment
  } = payload;

  const {
    paymentMethod,
    amount,
    currency,
    interval
  } = payment;

  const isSubscription = _.includes(['month', 'year'], interval);
  let paymentMethodInstance, description = payment.description;

  if (interval && !isSubscription) {
    return Promise.reject(new Error('Interval should be month or year.'));
  }

  if (!paymentMethod || !paymentMethod.token) {
    return Promise.reject(new Error('paymentMethod.token missing in payment object.'));
  }

  if (!amount) {
    return Promise.reject(new Error('payment.amount missing'));
  }

  if (amount < 50) {
    return Promise.reject(new Error('payment.amount must be at least $0.50'));
  }

  const getOrCreatePaymentMethod = (paymentMethod) => {
    if (paymentMethod instanceof models.PaymentMethod.Instance) return Promise.resolve(paymentMethod);
    else return models.PaymentMethod.create({
      ...paymentMethod,
      service: 'stripe',
      CreatedByUserId: order.CreatedByUserId,
      CollectiveId: order.FromCollectiveId
    });
  }

  let collective;
  // fetch Stripe Account and get or create Payment Method
  return Promise.props({
      stripeAccount: order.getToCollective()
        .then(c => {
          collective = c;
          return c.getStripeAccount()
        }),
      paymentMethod: getOrCreatePaymentMethod(paymentMethod)
    })
    .then(results => {
      const stripeAccount = results.stripeAccount;
      if (!stripeAccount || !stripeAccount.accessToken) {
        return Promise.reject(new Error(`The host for the ${collective.slug} collective has no Stripe account set up`));
      } else if (process.env.NODE_ENV !== 'production' && _.includes(stripeAccount.accessToken, 'live')) {
        return Promise.reject(new Error(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
      } else {
        paymentMethodInstance = results.paymentMethod;
        return Promise.resolve();
      }
    })

    // create a new subscription
    // (this needs to happen first, because of hook on Order model)
    .then(() => {
      if (isSubscription) {
        description = description || capitalize(`${interval}ly donation to ${collective.name}`);
        return models.Subscription.create({
          amount,
          currency,
          interval
        })
      } else {
        description = description || `Donation to ${collective.name}`
        return Promise.resolve();
      }
    })
    .then(subscription => {
      order.PaymentMethodId = paymentMethodInstance.id;
      order.SubscriptionId = subscription && subscription.id;
      order.description = order.description || description;
      return order.save();
    })
    .then(paymentsLib.processPayment);
}

/*
 * Processes payments once they are recorded (above)
 * TODO: make this async with a messaging queue
 * runs immediatelys after createPayment()
 * Returns a Promise with the transaction created
 */
const processPayment = (order) => {

  const services = {
    stripe: (order) => {

      if (order.processedAt) {
        return Promise.reject(new Error(`This order (#${order.id}) has already been processed at ${order.processedAt}`));
      }

      const collective = order.toCollective;
      const user = order.createdByUser;
      const paymentMethod = order.PaymentMethod;
      const subscription = order.Subscription;
      const tier = order.Tier;

      const createSubscription = (hostStripeAccount) => {
        return stripe.getOrCreatePlan(
          hostStripeAccount,
          {
            interval: subscription.interval,
            amount: order.totalAmount,
            currency: order.currency
          })
          .then(plan => stripe.createSubscription(
            hostStripeAccount,
            paymentMethod.customerId,
            {
              plan: plan.id,
              application_fee_percent: transactions.OC_FEE_PERCENT,
              trial_end: getSubscriptionTrialEndDate(order.createdAt, subscription.interval),
              metadata: {
                collectiveId: collective.id,
                collectiveName: collective.name,
                paymentMethodId: paymentMethod.id,
                description: `https://opencollective.com/${collective.slug}`
              }
            }))
          .then(stripeSubscription => subscription.update({ stripeSubscriptionId: stripeSubscription.id }))
          .then(subscription => subscription.activate())
          .then(subscription => models.Activity.create({
            type: activities.SUBSCRIPTION_CONFIRMED,
            data: {
              collective: collective.minimal,
              user: user.minimal,
              tier,
              subscription
            }
          }));
      };

      /**
       * Returns a Promise with the transaction created
       */
      const createChargeAndTransaction = (hostStripeAccount) => {
        let charge;
        return stripe.createCharge(
          hostStripeAccount,
          {
            amount: order.totalAmount,
            currency: order.currency,
            customer: paymentMethod.customerId,
            description: `OpenCollective: ${collective.slug}`,
            application_fee: parseInt(order.totalAmount * transactions.OC_FEE_PERCENT / 100, 10),
            metadata: {
              collectiveId: collective.id,
              collectiveName: collective.name,
              customerEmail: user.email,
              paymentMethodId: paymentMethod.id
            }
          })
          .tap(c => charge = c)
          .then(charge => stripe.retrieveBalanceTransaction(
            hostStripeAccount,
            charge.balance_transaction))
          .then(balanceTransaction => {
            // create a transaction
            const fees = stripe.extractFees(balanceTransaction);
            const hostFeePercent = collective.hostFeePercent;
            const payload = {
              CreatedByUserId: user.id,
              FromCollectiveId: user.CollectiveId,
              ToCollectiveId: collective.id,
              paymentMethod
            };
            payload.transaction = {
              type: transactions.type.DONATION,
              OrderId: order.id,
              amount: order.totalAmount,
              currency: order.currency,
              txnCurrency: balanceTransaction.currency,
              amountInTxnCurrency: balanceTransaction.amount,
              txnCurrencyFxRate: order.totalAmount / balanceTransaction.amount,
              hostFeeInTxnCurrency: parseInt(balanceTransaction.amount * hostFeePercent / 100, 10),
              platformFeeInTxnCurrency: fees.applicationFee,
              paymentProcessorFeeInTxnCurrency: fees.stripeFee,
              description: order.description,
              data: { charge, balanceTransaction },
            };
            return models.Transaction.createFromPayload(payload);
          });
      };

      let hostStripeAccount, transaction;
      return collective.getStripeAccount()
        .then(stripeAccount => hostStripeAccount = stripeAccount)
        // get or create a customer
        .then(() => paymentMethod.customerId || stripe.createCustomer(
          hostStripeAccount,
          paymentMethod.token, {
            email: user.email,
            collective: collective.info
          }).then(customer => customer.id))
        .tap(customerId => {
          if (!paymentMethod.customerId) {
            paymentMethod.customerId = customerId;
            paymentMethod.update({ customerId: customerId })
          }
        })
        
        // both one-time and subscriptions get charged immediately
        .then(() => createChargeAndTransaction(hostStripeAccount))
        .tap(t => transaction = t)

        // if this is a subscription, we create it now on Stripe
        .tap(() => subscription ? createSubscription(hostStripeAccount, subscription, order, paymentMethod, collective) : null)

        // add user to the collective
        .tap(() => collective.findOrAddUserWithRole(user, roles.BACKER, { CreatedByUserId: user.id, TierId: order.TierId }))

        // Mark order row as processed
        .tap(() => order.update({ processedAt: new Date() }))

        // Mark paymentMethod as confirmed
        .tap(() => paymentMethod.update({confirmedAt: new Date}))

        // send out confirmation email
        .then(() => {
          if (collective.type === types.EVENT) {
            return emailLib.send(
              'ticket.confirmed',
              user.email,
              { order: order.info,
                transaction: transaction.info,
                user: user.info,
                collective: collective && collective.info,
                tier: order.Tier.info
              }, {
                from: `${collective.name} <hello@${collective.slug}.opencollective.com>`
              })
          } else {
            // normal order
            return collective.getRelatedCollectives(2, 0)
            .then((relatedCollectives) => emailLib.send(
              'thankyou',
              user.email,
              { order: order.info,
                transaction: transaction.info,
                user: user.info,
                collective: collective.info,
                relatedCollectives,
                interval: subscription && subscription.interval,
                monthlyInterval: subscription && subscription.interval && (subscription.interval.indexOf('month') !== -1),
                firstPayment: true,
                subscriptionsLink: user.generateLoginLink('/subscriptions')
              }));
          }
        })
        .then(() => transaction); // make sure we return the transaction created
    },
    manual: (order) => {
      const collective = order.toCollective;
      const user = order.createdByUser;
      let isFromCollectiveHost, transaction;

      const payload = {
        CreatedByUserId: user.id,
        FromCollectiveId: order.FromCollectiveId,
        ToCollectiveId: order.ToCollectiveId,
        transaction: {
          type: transactions.type.DONATION,
          OrderId: order.id,
          amount: order.totalAmount,
          currency: order.currency,
          txnCurrency: order.currency,
          amountInTxnCurrency: order.totalAmount,
          txnCurrencyFxRate: 1,
          platformFeeInTxnCurrency: 0,
          paymentProcessorFeeInTxnCurrency: 0,
        }
      }
      return collective
        .getHostId()
        .then(HostId => HostId === order.FromCollectiveId)
        .tap(isHost => isFromCollectiveHost = isHost)
        .then(isFromCollectiveHost => {
          payload.transaction.hostFeeInTxnCurrency = isFromCollectiveHost ? 0 : Math.trunc(collective.hostFeePercent/100 * order.totalAmount);
          return models.Transaction.createFromPayload(payload);
        })
        .then(t => transaction = t)
        .then(() => !isFromCollectiveHost ? collective.findOrAddUserWithRole(user, roles.BACKER, { CreatedByUserId: user.id, TierId: order.TierId }) : Promise.resolve())
        .then(() => order.update({ processedAt: new Date }))
        .then(() => transaction); // make sure we return the transaction created
    }
  };

  return models.Order.findOne({
      where: { id: order.id },
      include: [
        { model: models.User, as: 'createdByUser' },
        { model: models.Collective, as: 'fromCollective' },
        { model: models.Collective, as: 'toCollective' },
        { model: models.PaymentMethod },
        { model: models.Subscription },
        { model: models.Tier }
      ]
    })
    .then(order => {
      if (!order.PaymentMethod) {
        return services.manual(order);
      } else {
        return services[order.PaymentMethod.service](order)
      }
    });
}

/**
 * Calculates the 1st of next month
 * input: date
 * output: 1st of following month, needs to be in Unix time and in seconds (not ms)
 */
const getSubscriptionTrialEndDate = (originalDate, interval) => {
  const newDate = new Date(originalDate.getTime())
  newDate.setDate(1);
  if (interval === 'month') {
    return Math.floor(newDate.setMonth(newDate.getMonth() + 1) / 1000); // set to 1st of next month
  } else if (interval === 'year') {
    return Math.floor(newDate.setMonth(newDate.getMonth() + 12) / 1000); // set to 1st of next year's same month
  } else {
    return null;
  }
}

const paymentsLib = {
  createPayment,
  processPayment
}

export default paymentsLib;