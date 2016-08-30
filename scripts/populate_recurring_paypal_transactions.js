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

const app = require('../server/index');
const models = app.set('models');
const slack = require('../server/lib/slack');

const startDate = '2016-03-01'; // date that we started paypal payments
const endDate = moment().format('YYYY-MM-DD');

// Promisify the paypal-rest-sdk
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

const findUnregisteredTransaction = (transactions, paypalTransactions) => {
  return paypalTransactions.filter((pt) => {
    return !_.find(transactions, (t) => {
      return t.data && (t.data.transaction_id === pt.transaction_id);
    });
  });
}

const updateTransactions = (subscription, group, user, paypalTransactions) => {
  // Find the missing transactions in our db and create them
  const missingPaypalTransactions = findUnregisteredTransaction(subscription.Transactions, paypalTransactions);

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
      SubscriptionId: subscription.id,
      data: pt
    };

    return models.Transaction.createFromPayload({
        transaction,
        group,
        user
      });
  });
};

const updateFirstTransaction = (transaction, subscription, paypalTransaction) => {
  const updateTransaction = () => {
    transaction.data = paypalTransaction;
    return transaction.save();
  };

  return Bluebird.props({ // for testing
    transaction: updateTransaction(),
    subscription: subscription.activate()
  });
};

const findSubscriptions = () => {
  return models.Subscription.findAll({
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
  });
};

const log = (message) => {
  console.log(message);

  if (process.env.NODE_ENV === 'production') {
    slack.postMessage(message, { channel: '#critical' });
  }

  return message; // for testing
};

const handlePaypalTransactions = (paypalTransactions, transaction, subscription, billingAgreementId) => {
  const group = transaction.Group;
  const user = transaction.User;
  const completedList = _.filter(paypalTransactions, { status: 'Completed'});
  const created = _.find(paypalTransactions, { status: 'Created'});

  if (!created) {
    return log(`No Created event, invalid: ${billingAgreementId}`);
  }

  // Unactive subscription
  if (!subscription.isActive) {

    // No completed events, it takes up to one day for paypal to process the subscription,
    // so we will just pass
    if (completedList.length === 0) {
      return log(`Billing agreement (${billingAgreementId}) not processed yet, no completed event`);

    // Only one completed item means that it is the first payment, no
    // need to create a new Transaction. We just need to activate the subscription
    // and save the paypalTransaction in our transaction.
    } else if (completedList.length === 1) {
      return updateFirstTransaction(transaction, subscription, completedList[0]);
    } else {
      return log(`Invalid subscription ${subscription.id} with billingAgreement ${billingAgreementId}, it should be activated already`);
    }

  // Active subscription
  } else {

    if (completedList.length === 0) {
      return log(`Subscription should not be active, subscription.id: ${subscription.id}, billingAgreementId: ${billingAgreementId}`);
    } else {
      return updateTransactions(subscription, group, user, completedList);
    }
  }

};

const populateTransactions = (subscription) => {
  const billingAgreementId = subscription.data.billingAgreementId;
  const transaction = subscription.Transactions[0] || {};
  const group = transaction.Group;
  const user = transaction.User;

  if (!billingAgreementId) {
    return log(`No billingAgreementId, subscription.id ${subscription.id}, transaction.id ${transaction.id}`);
  }

  if (!user) {
    return log(`No user, subscription.id ${subscription.id}, transaction.id ${transaction.id}`)
  }

  if (!group) {
    return log(`No group, subscription.id ${subscription.id}, transaction.id ${transaction.id}`);
  }

  return group.getConnectedAccount()
    .then(connectedAccount => searchTransactions(billingAgreementId, connectedAccount.paypalConfig))
    .then((paypalTransactions) => {
      return handlePaypalTransactions(
        paypalTransactions,
        transaction,
        subscription,
        billingAgreementId
      );
    });
};

const run = () => findSubscriptions().map(populateTransactions);

module.exports = {
  handlePaypalTransactions,
  populateTransactions,
  run,
  findSubscriptions
};
