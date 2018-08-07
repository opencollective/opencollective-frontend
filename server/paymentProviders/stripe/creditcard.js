import _ from 'lodash';
import config from 'config';

import models from '../../models';
import * as constants from '../../constants/transactions';
import roles from '../../constants/roles';
import * as stripeGateway from './gateway';
import * as paymentsLib from '../../lib/payments';
import { planId } from '../../lib/utils';
import errors from '../../lib/errors';

/**
 * Calculates the 1st of next month
 * input: date
 * output: 1st of following month, needs to be in Unix time and in seconds (not ms)
 */
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
    } = order;

    const user = order.createdByUser;

    let hostStripeCustomerId;

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
      // Customers pre-migration will have their stripe user connected
      // to the platform stripe account, not to the host's stripe
      // account. Since payment methods had no name before that
      // migration, we're using it to test for pre-migration users;
      if (!paymentMethod.name) return paymentMethod.customerId;

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
      });
    };

    /**
     * Returns a Promise with the transaction created
     * Note: we need to create a token for hostStripeAccount because paymentMethod.customerId is a customer of the platform
     * See: Shared Customers: https://stripe.com/docs/connect/shared-customers
     */
    const createChargeAndTransactions = (hostStripeAccount) => {

      const { collective, createdByUser: user, paymentMethod } = order;
      let charge;
      const platformFee = isNaN(order.platformFee)
        ? parseInt(order.totalAmount * constants.OC_FEE_PERCENT / 100, 10)
        : order.platformFee;
      return stripeGateway.createCharge(
        hostStripeAccount,
        {
          amount: order.totalAmount,
          currency: order.currency,
          customer: hostStripeCustomerId,
          description: order.description,
          application_fee: platformFee,
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
          const hostFeeInHostCurrency = paymentsLib.calcFee(
            balanceTransaction.amount,
            collective.hostFeePercent);
          const payload = {
            CreatedByUserId: user.id,
            FromCollectiveId: order.FromCollectiveId,
            CollectiveId: collective.id,
            PaymentMethodId: paymentMethod.id
          };
          payload.transaction = {
            type: constants.TransactionTypes.CREDIT,
            OrderId: order.id,
            amount: order.totalAmount,
            currency: order.currency,
            hostCurrency: balanceTransaction.currency,
            amountInHostCurrency: balanceTransaction.amount,
            hostCurrencyFxRate: balanceTransaction.amount / order.totalAmount,
            hostFeeInHostCurrency,
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

      // add user to the collective
      .tap(() => collective.findOrAddUserWithRole({ id: user.id, CollectiveId: fromCollective.id}, roles.BACKER, { CreatedByUserId: user.id, TierId: order.TierId }))

      // Mark order row as processed
      .tap(() => order.update({ processedAt: new Date() }))

      // Mark paymentMethod as confirmed
      .tap(() => paymentMethod.update({ confirmedAt: new Date }))

      .then(() => transactions); // make sure we return the transactions created
  },

  /** Refund a given transaction */
  refundTransaction: async (transaction, user) => {
    /* What's going to be refunded */
    const chargeId = _.result(transaction.data, 'charge.id');

    /* From which stripe account it's going to be refunded */
    const collective = await models.Collective.findById(
      transaction.type === 'CREDIT'
        ? transaction.CollectiveId
        : transaction.FromCollectiveId);
    const hostStripeAccount = await collective.getHostStripeAccount();

    /* Refund both charge & application fee */
    const refund = await stripeGateway.refundCharge(hostStripeAccount, chargeId);
    const balance = await stripeGateway.retrieveBalanceTransaction(
      hostStripeAccount, refund.balance_transaction);
    const fees = stripeGateway.extractFees(balance);

    /* Create negative transactions for the received transaction */
    const refundTransaction = await paymentsLib.createRefundTransaction(
      transaction, fees.stripeFee, { refund, balance }, user);

    /* Associate RefundTransactionId to all the transactions created */
    return paymentsLib.associateTransactionRefundId(
      transaction, refundTransaction);
  },

  webhook: (requestBody, event) => {
    const invoice = event.data.object;
    const invoiceLineItems = invoice.lines.data;
    const stripeSubscription = _.find(invoiceLineItems, { type: 'subscription' });

    /*
      If it's an ACH payment (which we don't accept but a host might have others
      sending it), we need to send back a 200 or Stripe will keep trying

      This assumes that any 'invoice.payment_succeeded' that is not a subscription
      will be ignored.

      TODO: when we start accepting other payment types, need to update this.
    */
    if (!stripeSubscription) {
      return Promise.resolve();
    }

    /* Stripe might send pings for lots of reasons, but we're logging
       this one because it could flag a subscription that wasn't
       migrated to the new system.  */
    if (planId(stripeSubscription.plan) === stripeSubscription.plan.id) {
      return Promise.reject(
        new errors.BadRequest('Subscription not migrated ${stripeSubscription.id}'));
    }
    /* We return 200 because Stripe can keep pinging us if we don't do
       so for some events. */
    return Promise.resolve();
  }
};
