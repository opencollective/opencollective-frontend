/*
 * Given an array of fromCollective Ids(field FromCollectiveId from Transactions model), 
 * This script creates refund transactions. It first tries to create the refun 
 * We also mark all those transactions Orders 
 * from status 'ACTIVE' to status 'CANCELLED'
 *  1) Refund transactions
 *  2) Get transactions ORders and Mark the order Subscriptions of orders as isActive False and deactivedAt now()
 * 
 */
import Promise from 'bluebird';
import debug from 'debug';
import models from '../server/models';
import * as libPayments from '../server/lib/payments';

// history: ,
// count	collective	  FromCollectiveId	CollectiveId	email
//                          23709 ------------------------------------------------------- OK
// 191	  anonymous1309	    23461             13775	    rato07@yopmail.com_old ---------- 
// 20	    anonymous1320	    23546             13775	    rato007@gmx.com_old ------------- 
// 7	    anonymous1155	    21715             13775	    vitinholippi00973@gmail.com -----
// DATABASE SCRIPTS
// --------
// ----  TOMORROW WITH PIA
// -- getting all transactions from the FromCollectiveId 21715
// select * from "Transactions" t 
// left join "Orders" o on t."OrderId"=o.id 
// left join "Subscriptions" s on o."SubscriptionId"=s.id 
// where t."FromCollectiveId"=21715; -- and s."isActive"=true and t."TransactionGroup"='271eb993-9092-4f55-8014-ad0d7e58514a'
// -- We have already refunded this transactions from FromCollectiveId 21715
// select * from "Transactions" where id in (130697,130698);
// -- and here are their refund transactions:
// select * from "Transactions" where id in (134631, 134632);

const fromCollectiveIds = process.env.FROM_COLLECTIVE_IDS || [21715];
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
  debugRefund(`stripeAccounts: ${JSON.stringify(stripeAccounts, null,2)}`);
  // If it's credit card then we will refund
  if (transaction.PaymentMethod && transaction.PaymentMethod.type === 'creditcard') {
    debugRefund('refunding transaction...');
    try {
      // try to do both stripe and database refunds
      const refundTransactions  = await paymentMethod.refundTransaction(transaction, {id: 18520});  
      debugRefund(`Stripe refundTransactions: ${JSON.stringify(refundTransactions, null,2)}`);
    } catch (error) {
      // Error means stripe has already refunded
      debugRefund(`STRIPE error meaning it was already refund...trying to refund only on our database:`);
      try {
        const refundTransactions  = await paymentMethod.refundTransactionOnlyInDatabase(transaction, {id: 18520});  
        debugRefund(`Database ONLY refundTransactions: ${JSON.stringify(refundTransactions, null,2)}`);  
      } catch (error) {
        // throwing error on purpose to stop everything if something unexpected happens..
        console.error(error);
        throw error;  
      }
    }
  }

  const order = transaction.Order;
  // We mark 
  if (order && order.status === 'ACTIVE' && order.SubscriptionId) {
    debugRefund('updating subscription to be deactived');
    // subscription
    const subscription = await models.Subscription.findById(order.SubscriptionId);
    subscription.isActive = false;
    subscription.deactivatedAt = new Date();
    
    await subscription.save();
    const newSubscription = await models.Subscription.findById(order.SubscriptionId);
    debugRefund(`UPDATED Subscripttion ${JSON.stringify(newSubscription, null,2)}`);
    // mark isActive as false and deactivedAt now.
  }
  return models.Transaction.findById(transaction.id);
}

async function run() {
  const transactions = await models.Transaction.findAll({
    where: {
      FromCollectiveId: fromCollectiveIds,
      type: 'CREDIT',
      RefundTransactionId: null
    },
    include: [models.Order, models.PaymentMethod],
  });
  // TO DO: instead of consider only the first of the above array, we'll consider all
  // doing this because we are carefully and slowly running this script in PROD
  const mapResult = await Promise.map([transactions[0]], refundTransaction);
  debugRefund(`mapResult(tip: result transactions need to have RefundTransactionId set): ${JSON.stringify(mapResult, null,2)}`);
  process.exit(0);
}

run();