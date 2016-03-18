/**
 * PayPal REST API webhooks don't support billing agreements and subscription related
 * events (https://github.com/paypal/PayPal-Python-SDK/issues/69). There are two
 * ways to solve that, either using the IPN API to get the events or retrieve the transactions on a daily
 * basis. The latter allows us to find orphan transactions that we did not register
 * during the payment process because of an error/bug. The former would work but we
 * won't get the free checks and it uses an old PayPal API (bug and weird stuff to expect)
 *
 * ! This is temporary until https://github.com/paypal/PayPal-Python-SDK/issues/69 gets fixed and
 * we implement webhooks. !
 *
 * AB
 */

const paypal = require('paypal-rest-sdk');
const Bluebird = require('bluebird');
const moment = require('moment');
const _ = require('lodash');

const app = require('../index');
const models = app.set('models');
const transactionsController = require('../app/controllers/transactions')(app);

// Check last 3 days
const startDate = moment().subtract(3, 'day').format('YYYY-MM-DD');
const endDate = moment().format('YYYY-MM-DD');

const searchTransactions = (billingAgreementId, paypalConfig) => {
  return new Promise((resolve, reject) => {
    paypal.billingAgreement.searchTransactions(
      billingAgreementId,
      startDate,
      endDate,
      paypalConfig,
      (err, res) => {
        if (err) return reject(err);
        return resolve(res.agreement_transaction_list);
      }
    );
  })
};

const updateTransactions = (subscription, group, user, paypalTransactions) => {

  // Find the missing transactions in our db and create them
  const missingPaypalTransactions = paypalTransactions.map((pt) => {
    return !_.find(subscription.Transactions, (t) => data.transaction_id === pt.transaction_id); // TODO: schema to build
  });

  return Bluebird.map(missingPaypalTransactions, (pt) => {
    const transaction = {
      type: 'payment',
      amount: subscription.amount,
      currency: subscription.currency,
      paidby: user && user.id,
      description: 'Recurring subscription',
      tags: ['Donation'],
      approved: true,
      interval: subscription.interval,
      SubscriptionId: subscription.id
    };

    return transactionsController._create({
      transaction,
      group,
      user
    });
  });
};

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done');
  process.exit();
}

models.Subscription.findAll({
  where: {
    stripeSubscriptionId: null
  },
  include: [{
    model: models.Transaction,
    include: [
      { model: models.Group },
      { model: models.User }
    ]
  }]
})
.map((subscription) => {
  const billingAgreementId = subscription.data.billingAgreementId;
  const transaction = subscription.Transactions[0] || {};
  const group = transaction.Group;
  const user = transaction.User;

  if (!billingAgreementId) return;
  if (!group) return;

  return group.getConnectedAccount()
  .then(connectedAccount => searchTransactions(billingAgreementId, connectedAccount.paypalConfig))
  .then((paypalTransactions) => {
    const completedList = _.filter(paypalTransactions, { status: 'Completed'});
    const created = _.find(paypalTransactions, { status: 'Created'});

    if (!created) {
      console.log(`No Created event, invalid ${billingAgreementId}`);
      return;
    }

    // Unactive subscription
    if (!subscription.isActive) {

      // No completed events, it takes up to one day for paypal to process the subscription,
      // so we will just pass
      if (completedList.length === 0) {
        console.log(`Billing agreement not processed yet ${billingAgreementId}`);
        return;

      // Only one completed item means that it is the first payment, no
      // need to create a new Transaction. We just need to activate the subscription.
      } else if (completedList.length === 1) {
        // TODO: Add transaction_id to Transaction.data
        return subscription.activate();
      } else {
        console.log(`Invalid subscription ${subscription.id} with billingAgreement ${billingAgreementId}, it should be activated already `);
        return;
      }

    // Active subscription
    } else {

      if (completedList.length === 0 || completedList.length === 1) {
        console.log(`Subscription should not be active ${subscription.id} ${billingAgreementId}`);
        return;
      } else {
        return updateTransactions(subscription, group, user, completedList);
      }

    }
  });
})
.then(() => done())
.catch(done);
