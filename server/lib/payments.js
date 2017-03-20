import Promise from 'bluebird';
import _ from 'lodash';

import models from '../models';
import { capitalize } from '../lib/utils';
import emailLib from './email';
import roles from '../constants/roles';
import activities from '../constants/activities';
import * as transactions from '../constants/transactions';
import * as stripe from '../gateways/stripe';

/**
 * Creates payment - records the intent to pay in our system 
 */
const createPayment = (payload) => {
  const {
    user,
    group,
    response,
    payment
  } = payload;

  const {
    stripeToken,
    amount,
    currency,
    description,
    interval
  } = payment;

  const isSubscription = _.includes(['month', 'year'], interval);
  let paymentMethod, title;

  if (interval && !isSubscription) {
    return Promise.reject(new Error('Interval should be month or year.'));
  }

  if (!stripeToken) {
    return Promise.reject(new Error('Stripe Token missing.'));
  }

  if (!amount) {
    return Promise.reject(new Error('Payment amount missing'));
  }

  if (amount < 50) {
    return Promise.reject(new Error('Payment amount must be at least $0.50'));
  }

  // fetch Stripe Account and get or create Payment Method
  return Promise.props({
      stripeAccount: group.getStripeAccount(),
      paymentMethod: models.PaymentMethod.getOrCreate({
        token: stripeToken,
        service: 'stripe',
        UserId: user.id
      })
    })
    .then(results => {
      const stripeAccount = results.stripeAccount;
      if (!stripeAccount || !stripeAccount.accessToken) {
        return Promise.reject(new Error(`The host for the collective slug ${group.slug} has no Stripe account set up`));
      } else if (process.env.NODE_ENV !== 'production' && _.includes(stripeAccount.accessToken, 'live')) {
        return Promise.reject(new Error(`You can't use a Stripe live key on ${process.env.NODE_ENV}`));
      } else {
        paymentMethod = results.paymentMethod;
        return Promise.resolve();
      }
    })

    // create a new subscription
    // (this needs to happen first, because of hook on Donation model)
    .then(() => {
      if (isSubscription) {
        title = description || capitalize(`${interval}ly donation to ${group.name}`);
        return models.Subscription.create({
          amount,
          currency,
          interval
        })
      } else {
        title = description || `Donation to ${group.name}`
        return Promise.resolve();
      }
    })
    // create a new donation
    .then(subscription => models.Donation.create({
      UserId: user.id,
      GroupId: group.id,
      currency: currency,
      amount,
      title,
      PaymentMethodId: paymentMethod.id,
      SubscriptionId: subscription && subscription.id,
      ResponseId: response && response.id
    }))
    .then(paymentsLib.processPayment);
}

/*
 * Processes payments once they are recorded (above)
 * TODO: make this async with a messaging queue
 * runs immediatelys after createPayment()
 * Returns a Promise with the transaction created
 */
const processPayment = (donation) => {
  const services = {
    stripe: (donation) => {

      const group = donation.Group;
      const user = donation.User;
      const paymentMethod = donation.PaymentMethod;
      const subscription = donation.Subscription;
      const eventResponse = donation.Response;

      const createSubscription = (groupStripeAccount) => {
        return stripe.getOrCreatePlan(
          groupStripeAccount,
          {
            interval: subscription.interval,
            amount: donation.amount,
            currency: donation.currency
          })
          .then(plan => stripe.createSubscription(
            groupStripeAccount,
            paymentMethod.customerId,
            {
              plan: plan.id,
              application_fee_percent: transactions.OC_FEE_PERCENT,
              trial_end: getSubscriptionTrialEndDate(donation.createdAt, subscription.interval),
              metadata: {
                groupId: group.id,
                groupName: group.name,
                paymentMethodId: paymentMethod.id,
                description: `https://opencollective.com/${group.slug}`
              }
            }))
          .then(stripeSubscription => subscription.update({ stripeSubscriptionId: stripeSubscription.id }))
          .then(subscription => subscription.activate())
          .then(subscription => models.Activity.create({
            type: activities.SUBSCRIPTION_CONFIRMED,
            data: {
              group: group.minimal,
              user: user.minimal,
              donation: donation,
              subscription
            }
          }));
      };

      /**
       * Returns a Promise with the transaction created
       */
      const createChargeAndTransaction = (groupStripeAccount) => {
        let charge;
        return stripe.createCharge(
          groupStripeAccount,
          {
            amount: donation.amount,
            currency: donation.currency,
            customer: paymentMethod.customerId,
            description: `OpenCollective: ${group.slug}`,
            application_fee: parseInt(donation.amount * transactions.OC_FEE_PERCENT / 100, 10),
            metadata: {
              groupId: group.id,
              groupName: group.name,
              customerEmail: user.email,
              paymentMethodId: paymentMethod.id
            }
          })
          .tap(c => charge = c)
          .then(charge => stripe.retrieveBalanceTransaction(
            groupStripeAccount,
            charge.balance_transaction))
          .then(balanceTransaction => {
            // create a transaction
            const fees = stripe.extractFees(balanceTransaction);
            const hostFeePercent = group.hostFeePercent;
            const payload = {
              user,
              group,
              paymentMethod
            };
            payload.transaction = {
              type: transactions.type.DONATION,
              DonationId: donation.id,
              amount: donation.amount,
              currency: donation.currency,
              txnCurrency: balanceTransaction.currency,
              amountInTxnCurrency: balanceTransaction.amount,
              txnCurrencyFxRate: donation.amount / balanceTransaction.amount,
              hostFeeInTxnCurrency: parseInt(balanceTransaction.amount * hostFeePercent / 100, 10),
              platformFeeInTxnCurrency: fees.applicationFee,
              paymentProcessorFeeInTxnCurrency: fees.stripeFee,
              data: { charge, balanceTransaction },
            };
            return models.Transaction.createFromPayload(payload);
          });
      };

      let groupStripeAccount;

      return group.getStripeAccount()
        .then(stripeAccount => groupStripeAccount = stripeAccount)

        // get or create a customer
        .then(() => paymentMethod.customerId || stripe.createCustomer(
          groupStripeAccount,
          paymentMethod.token, {
            email: user.email,
            group
          }))

        .tap(customer => paymentMethod.customerId ? null : paymentMethod.update({ customerId: customer.id }))

        // both one-time and subscriptions get charged immediately
        .then(() => createChargeAndTransaction(groupStripeAccount, donation, paymentMethod, group, user))

        // if this is a subscription, we create it now on Stripe
        .tap(() => subscription ? createSubscription(groupStripeAccount, subscription, donation, paymentMethod, group) : null)

        // add user to the group
        .tap(() => group.findOrAddUserWithRole(user, roles.BACKER))

        // Mark donation row as processed
        .tap(() => donation.update({ isProcessed: true, processedAt: new Date() }))

        .tap(() => eventResponse ? eventResponse.update({ confirmedAt: new Date() }) : Promise.resolve())

        // send out confirmation email
        .tap(() => {
          if (eventResponse) {
            return emailLib.send(
              'ticket.confirmed',
              user.email,
              { donation: donation.info,
                user: user.info,
                group: group.info,
                response: eventResponse.info,
                event: eventResponse.Event.info,
                tier: eventResponse.Tier.info
              })
          } else {
            // normal donation
            return group.getRelatedGroups(2, 0)
            .then((relatedGroups) => emailLib.send(
              'thankyou',
              user.email,
              { donation: donation.info,
                user: user.info,
                group: group.info,
                relatedGroups,
                interval: subscription && subscription.interval,
                monthlyInterval: subscription && subscription.interval && (subscription.interval.indexOf('month') !== -1),
                firstPayment: true,
                subscriptionsLink: user.generateLoginLink('/subscriptions')
              }));
          }
      })
    },
    manual: (donation) => {
      const group = donation.Group;
      const user = donation.User;
      let isUserHost;

      const payload = {
        user,
        group,
        transaction: {
          type: transactions.type.DONATION,
          DonationId: donation.id,
          amount: donation.amount,
          currency: donation.currency,
          txnCurrency: donation.currency,
          amountInTxnCurrency: donation.amount,
          txnCurrencyFxRate: 1,
          platformFeeInTxnCurrency: 0,
          paymentProcessorFeeInTxnCurrency: 0,
        }        
      }

      return group.getHost()
      .then(host => host.UserId == user.id)
      .tap(isHost => isUserHost = isHost)
      .then(isUserHost => {
        payload.transaction.hostFeeInTxnCurrency = isUserHost ? 0 : Math.trunc(group.hostFeePercent/100 * donation.amount);
        return models.Transaction.createFromPayload(payload);
      })
      .then(() => !isUserHost ? group.findOrAddUserWithRole(user, roles.BACKER) : Promise.resolve())
      .then(() => donation.update({isProcessed: true, processedAt: new Date()}))
    }
  };

  return models.Donation.findById(donation.id, {
      include: [{ model: models.User },
      { model: models.Group },
      { model: models.PaymentMethod },
      { model: models.Subscription },
      { model: models.Response,
        include: [{ model: models.Event },
                  { model: models.Tier }]
      }]
    })
    .then(donation => {
      if (!donation.PaymentMethod) {
        return services.manual(donation);
      } else if (donation.PaymentMethod.service === 'paypal') {
        // for manual add funds and paypal, which isn't processed this way yet
        return donation.update({ isProcessed: true, processedAt: new Date() });
      } else {
        return services[donation.PaymentMethod.service](donation)
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