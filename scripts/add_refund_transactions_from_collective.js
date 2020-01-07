#!/usr/bin/env node
import '../server/env';

/*
 * Given an array of fromCollective Ids(field FromCollectiveId from Transactions model),
 * This script creates refund transactions.
 * We also mark all those transactions Orders
 * from status 'ACTIVE' to status 'CANCELLED'
 *  1) Refund transactions
 *  2) Mark Orders as cancelled
 *  3) Get transactions ORders and Mark the order Subscriptions of orders as isActive False and deactivedAt now()
 */
import Promise from 'bluebird';
import debug from 'debug';

import models from '../server/models';
import * as libPayments from '../server/lib/payments';
import { purgeCacheForPage } from '../server/lib/cloudflare';

// the user id of the one who's running this script, will be set on the field `CreatedByUserId`.
const UPDATER_USER_ID = parseInt(process.env.UPDATER_USER_ID);
if (!UPDATER_USER_ID) {
  throw Error('You need to define a user id to run this script');
}
const fromCollectiveIds = process.env.FROM_COLLECTIVE_IDS ? process.env.FROM_COLLECTIVE_IDS.split(',').map(Number) : [];

const debugRefund = debug('refundTransactions');

async function refundTransaction(transaction) {
  // find the kind of payment method type
  const paymentMethod = libPayments.findPaymentMethodProvider(transaction.PaymentMethod);
  // look for the Stripe Connected Account
  const stripeAccounts = await models.ConnectedAccount.findAll({
    where: {
      CollectiveId: transaction.HostCollectiveId,
      service: 'stripe',
    },
  });
  debugRefund(`stripeAccounts: ${JSON.stringify(stripeAccounts, null, 2)}`);
  // If it's credit card then we will refund
  if (transaction.PaymentMethod && transaction.PaymentMethod.type === 'creditcard') {
    debugRefund('refunding transaction.', transaction);
    try {
      // try to do both stripe and database refunds
      const refundTransactions = await paymentMethod.refundTransaction(transaction, { id: UPDATER_USER_ID });
      debugRefund(`Stripe refundTransactions: ${JSON.stringify(refundTransactions, null, 2)}`);
    } catch (error) {
      // Error means stripe has already refunded
      debugRefund(`STRIPE error meaning it was already refund...trying to refund only on our database:`);
      try {
        const refundTransactions = await paymentMethod.refundTransactionOnlyInDatabase(transaction, {
          id: UPDATER_USER_ID,
        });
        debugRefund(`Database ONLY refundTransactions: ${JSON.stringify(refundTransactions, null, 2)}`);
      } catch (error) {
        // throwing error on purpose to stop everything if something unexpected happens..
        console.error(error);
        throw error;
      }
    }
  }
  const order = transaction.Order;
  // We mark then Active Orders as CANCELLED and deactivated their subscriptions
  if (order && order.status === 'ACTIVE' && order.SubscriptionId) {
    order.status = 'CANCELLED';
    await order.save();
    debugRefund('updating subscription to be deactived');

    // if the order has a subscription, mark it with isActive as false and deactivedAt now.
    if (order.SubscriptionId) {
      const subscription = await models.Subscription.findByPk(order.SubscriptionId);
      subscription.isActive = false;
      subscription.deactivatedAt = new Date();
      await subscription.save();
    }
  }
  const collective = await transaction.getCollective();
  const fromCollective = await transaction.getFromCollective();
  // purging cloudflare cache
  if (collective) {
    purgeCacheForPage(`/${collective.slug}`);
  }
  if (fromCollective) {
    purgeCacheForPage(`/${fromCollective.slug}`);
  }

  return models.Transaction.findByPk(transaction.id);
}

async function run() {
  debugRefund(`Running refund scripts to get Transactions with the following FromCollectiveId:
    ${JSON.stringify(fromCollectiveIds, null, 2)}`);
  const transactions = await models.Transaction.findAll({
    where: {
      FromCollectiveId: fromCollectiveIds,
      type: 'CREDIT',
      RefundTransactionId: null,
    },
    include: [models.Order, models.PaymentMethod],
  });
  try {
    debugRefund(`Trying to refund ${(transactions && transactions.length) || 0} transactions...`);
    const mapResult = await Promise.map(transactions, refundTransaction);
    debugRefund(`Script finished successfully,
      mapResult(tip: result transactions need to have RefundTransactionId set):
      ${JSON.stringify(mapResult, null, 2)}`);
    process.exit(0);
  } catch (error) {
    debugRefund('Error executing script', error);
    process.exit(1);
  }
}

run();
