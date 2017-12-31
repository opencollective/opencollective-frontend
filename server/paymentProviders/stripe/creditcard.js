import config from 'config';
import debugLib from 'debug';
import _ from 'lodash';

import errors from '../../lib/errors';
import { planId } from '../../lib/utils';
import models, { sequelize } from '../../models';
import * as constants from '../../constants/transactions';
import roles from '../../constants/roles';
import * as stripeGateway from './gateway';
import activities from '../../constants/activities';
import emailLib from '../../lib/email';
import currencies from '../../constants/currencies';

import { retrieveCharge, extractFees, retrieveBalanceTransaction } from './gateway';

const debug = debugLib("stripecc");

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

export default {

  features: {
    recurring: true,
    waitToCharge: false
  },

  processOrder: (order) => {

    const {
      fromCollective,
      collective,
      paymentMethod,
      subscription,
      tier
    } = order;

    const user = order.createdByUser;

    let hostStripePlan, hostStripeCustomerId;

    /**
     * Get or create a customer under the platform stripe account
     */
    const getOrCreateCustomerOnPlatformAccount = () => {
      if (!paymentMethod.customerId) {
        return stripeGateway.createCustomer(null, paymentMethod.token, {
          email: user.email,
          collective: order.fromCollective.info
        })
        .then(customer => customer.id)
        .then(platformCustomerId => paymentMethod.update({ customerId: platformCustomerId}))
      }
      return Promise.resolve();
    }
    
    /**
     * Get the customerId for the Stripe Account of the Host
     * Or create one using the Stripe token associated with the platform (paymentMethod.token)
     * and saves it under PaymentMethod.data[hostStripeAccount.username]
     * @param {*} hostStripeAccount
     */
    const getOrCreateCustomerIdForHost = (hostStripeAccount) => {
      const data = paymentMethod.data || {};
      data.customerIdForHost = data.customerIdForHost || {};
      return data.customerIdForHost[hostStripeAccount.username] || stripeGateway.createToken(hostStripeAccount, paymentMethod.customerId)
      .then(token => stripeGateway.createCustomer(hostStripeAccount, token.id, {
        email: user.email,
        collective: fromCollective.info
      }))
      .then(customer => customer.id)
      .tap(customerId => {
        data.customerIdForHost[hostStripeAccount.username] = customerId;
        paymentMethod.data = data;
        paymentMethod.save();
      })
    }

    const createSubscription = (hostStripeAccount) => {
      return stripeGateway.getOrCreatePlan(
        hostStripeAccount,
        {
          interval: subscription.interval,
          amount: order.totalAmount,
          currency: order.currency
        })
        .tap(plan => hostStripePlan = plan)
        .then(() => stripeGateway.createSubscription(
          hostStripeAccount,
          hostStripeCustomerId,
          {
            plan: hostStripePlan.id,
            application_fee_percent: constants.OC_FEE_PERCENT,
            trial_end: getSubscriptionTrialEndDate(order.createdAt, subscription.interval),
            metadata: {
              from: `${config.host.website}/${fromCollective.slug}`,
              to: `${config.host.website}/${collective.slug}`,
              PaymentMethodId: paymentMethod.id
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
     * Note: we need to create a token for hostStripeAccount because paymentMethod.customerId is a customer of the platform
     * See: Shared Customers: https://stripe.com/docs/connect/shared-customers
     */
    const createChargeAndTransactions = (hostStripeAccount) => {
      
      const { collective, createdByUser: user, paymentMethod } = order;
      let charge;

      return stripeGateway.createCharge(
        hostStripeAccount,
        {
          amount: order.totalAmount,
          currency: order.currency,
          customer: hostStripeCustomerId,
          description: order.description,
          application_fee: parseInt(order.totalAmount * constants.OC_FEE_PERCENT / 100, 10),
          metadata: {
            from: `${config.host.website}/${order.fromCollective.slug}`,
            to: `${config.host.website}/${order.collective.slug}`,
            customerEmail: user.email,
            PaymentMethodId: paymentMethod.id
          }
        })
        .tap(c => charge = c)
        .then(charge => stripeGateway.retrieveBalanceTransaction(
          hostStripeAccount,
          charge.balance_transaction))
        .then(balanceTransaction => {
          // create a transaction
          const fees = stripeGateway.extractFees(balanceTransaction);
          const hostFeePercent = collective.hostFeePercent;
          const payload = {
            CreatedByUserId: user.id,
            FromCollectiveId: order.FromCollectiveId,
            CollectiveId: collective.id,
            PaymentMethodId: paymentMethod.id
          };
          payload.transaction = {
            type: constants.type.CREDIT,
            OrderId: order.id,
            amount: order.totalAmount,
            currency: order.currency,
            hostCurrency: balanceTransaction.currency,
            amountInHostCurrency: balanceTransaction.amount,
            hostCurrencyFxRate: order.totalAmount / balanceTransaction.amount,
            hostFeeInHostCurrency: parseInt(balanceTransaction.amount * hostFeePercent / 100, 10),
            platformFeeInHostCurrency: fees.applicationFee,
            paymentProcessorFeeInHostCurrency: fees.stripeFee,
            description: order.description,
            data: { charge, balanceTransaction },
          };
          return models.Transaction.createFromPayload(payload);
        });
    };

    let hostStripeAccount, transactions;
    return collective.getHostStripeAccount()
      .then(stripeAccount => hostStripeAccount = stripeAccount)

      // get or create a customer under platform account
      .then(() => getOrCreateCustomerOnPlatformAccount())

      // create a customer on the host stripe account
      .then(() => getOrCreateCustomerIdForHost(hostStripeAccount))
      .tap(customerId => hostStripeCustomerId = customerId)

      // both one-time and subscriptions get charged immediately
      .then(() => createChargeAndTransactions(hostStripeAccount))
      .tap(t => transactions = t)

      // if this is a subscription, we create it now on Stripe
      .tap(() => subscription ? createSubscription(hostStripeAccount, subscription, order, paymentMethod, collective) : null)

      // add user to the collective
      .tap(() => collective.findOrAddUserWithRole({ id: user.id, CollectiveId: fromCollective.id}, roles.BACKER, { CreatedByUserId: user.id, TierId: order.TierId }))

      // Mark order row as processed
      .tap(() => order.update({ processedAt: new Date() }))

      // Mark paymentMethod as confirmed
      .tap(() => paymentMethod.update({ confirmedAt: new Date }))

      .then(() => transactions); // make sure we return the transactions created
  },

  webhook: (requestBody, event) => {

    const isProduction = process.env.NODE_ENV === 'production';

    const invoice = event.data.object;
    const invoiceLineItems = invoice.lines.data;
    const stripeSubscription = _.find(invoiceLineItems, { type: 'subscription' });
    const stripeSubscriptionId = stripeSubscription.id;

    /**
     * With connected accounts we get all the events of the account
     * We will return a 200 if the plan is not in our format (not generated by us)
     * Example: Ruby together has a subscription model outside of us.
     * https://dashboard.stripe.com/acct_15avvkAcWgwn5pBt/events/evt_17oYejAcWgwn5pBtRo5gRiyY
     */
    if (planId(stripeSubscription.plan) !== stripeSubscription.plan.id) {
      debug("fetchEvent", "unrecognized plan id", planId(stripeSubscription.plan), stripeSubscription.plan.id);
      return Promise.resolve();        
    }

    /*
     * In case we get $0 order, return 200. Otherwise, Stripe will keep pinging us.
     */
    if (event.data.object.amount_due === 0) {
      debug("fetchEvent", "event.data.object.amount_due is 0");
      return Promise.resolve();
    }

    // create activity to record webhook
    return models.Activity.create({
      type: activities.WEBHOOK_STRIPE_RECEIVED,
      data: {
        event,
        stripeAccount: requestBody.user_id,
        eventId: requestBody.id,
        dashboardUrl: `https://dashboard.stripe.com/${requestBody.user_id}/events/${requestBody.id}`
      }
    })

    // find the order
    .then(() => models.Order.findOne({
      include: [
        { model: models.User, as: 'createdByUser' },
        { model: models.Collective, as: 'fromCollective' },
        { model: models.Collective, as: 'collective' },
        { model: models.Subscription, where: { stripeSubscriptionId } },
        { model: models.PaymentMethod, as: 'paymentMethod' }
      ]
    }))
    .then(order => {
      /**
       * Stripe doesn't make a difference between development, test, staging
       * environments. If we get a webhook from another env,
       * `transaction.Subscription.stripeSubscriptionId`
       * will not be found and throw an error. Stripe will retry to send the webhook
       * if it doesn't get a 2XX status code.
       * For non-production environments, we will simply return 200 to avoid
       * the retry on Stripe side (and the email from Stripe support).
       */
      if (!order && !isProduction) {
        debug("fetchOrder", "order not found with subscription id", stripeSubscriptionId);
        return Promise.resolve();
      }

      if (!order) {
        throw new errors.BadRequest('Order not found: unknown subscription id');
      }

      if (!order.Subscription.isActive) {
        throw new errors.BadRequest('This subscription is marked inActive');
      }

      // Confirm that this is a unique charge
      // deals with an bug where we found multiple transactions per chargeId
      const chargeId = event.data.object.charge;
      return sequelize.query(`
        SELECT * FROM "Transactions"
        WHERE 
          "OrderId" = ${order.id} AND
          CAST(data->'charge'->'id' AS TEXT) like '%${chargeId}%' AND
          "deletedAt" IS NULL
        `.replace(/\s\s+/g, ' '),
        {
          model: models.Transaction 
        })
        .then(t => {
          if (t.length > 0) {
            throw new errors.BadRequest(`This chargeId: ${chargeId} already exists.`);
          }
          // find customer and validate paymentMethod is associated with that customer
          // this check may not be needed
          const customer = event.data.object.customer;

          if (!customer) {
            throw new errors.BadRequest(`Customer Id not found. Order id: ${order.id}`);
          }
          if (!order.paymentMethod) {
            throw new errors.BadRequest('PaymentMethod not found');        
          }

          // For old subscriptions, they still reference the old customerId on the host stripe account
          if (order.paymentMethod.customerId !== customer) {
            // We need to iterate through the PaymentMethod.data.customerIdForHost[stripeAccount]
            const customerIdForHost = order.paymentMethod.data.customerIdForHost;
            if (customerIdForHost && !Object.values(customerIdForHost).find(c => c === customer)) {
              throw new errors.BadRequest(`Customer Id not found. Order id: ${order.id}`);
            }
          }

          // Get the charge from Stripe
          return retrieveCharge({ username: requestBody.user_id }, chargeId)
          .then(charge => {
            if (!charge) {
              throw new errors.BadRequest(`ChargeId not found: ${chargeId}`);
            }
            // retrieve balance, which has info we need to record transaction
            return retrieveBalanceTransaction({ username: requestBody.user_id }, charge.balance_transaction)
            .then(balanceTransaction => {
              if (!balanceTransaction) {
                throw new errors.BadRequest(`Balance transaction not found for chargeId: ${charge.id}`);
              }
              // create transaction
              const collective = order.collective || {};
              const fees = extractFees(balanceTransaction);
              const { hostFeePercent } = collective;

              // Now we record a new transaction
              const newTransaction = {
                OrderId: order.id,
                amount: stripeSubscription.amount,
                currency: stripeSubscription.currency,
                hostCurrency: balanceTransaction.currency,
                amountInHostCurrency: balanceTransaction.amount,
                hostCurrencyFxRate: order.totalAmount/balanceTransaction.amount,
                hostFeeInHostCurrency: parseInt(balanceTransaction.amount*hostFeePercent/100, 10),
                platformFeeInHostCurrency: fees.applicationFee,
                paymentProcessorFeeInHostCurrency: fees.stripeFee,
                data: {charge, balanceTransaction},
                description: `${order.Subscription.interval}ly recurring subscription`,
              };

              return models.Transaction.createFromPayload({
                CreatedByUserId: order.CreatedByUserId,
                FromCollectiveId: order.FromCollectiveId,
                CollectiveId: order.CollectiveId,
                transaction: newTransaction,
                PaymentMethodId: order.PaymentMethodId
              })
                // now we send receipt of transaction
              .then(transaction => {
                // We only send an invoice for orders > $10 equivalent
                if (order.totalAmount < 10 * currencies[order.currency].fxrate * 100) {
                  return Promise.resolve();
                }
                const user = order.createdByUser || {};
                const subscription = order.Subscription;
                return collective.getRelatedCollectives(2, 0)
                  .then(relatedCollectives => emailLib.send(
                    'thankyou',
                    user.email,
                    { order: order.info,
                      transaction: transaction.info,
                      user: user.info,
                      firstPayment: false,
                      collective: collective.info,
                      fromCollective: order.fromCollective.minimal,
                      relatedCollectives,
                      config: { host: config.host },
                      interval: subscription && subscription.interval,
                      subscriptionsLink: user.generateLoginLink('/subscriptions')
                    }, {
                      from: `${collective.name} <hello@${collective.slug}.opencollective.com>`
                    }))
              })
            })
          })
        })
    })
  }
}