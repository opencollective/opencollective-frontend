// transaction.stripeSubscriptionId -> subscription.stripeSubscriptionId
// transaction.amount -> subscription.amount
// transaction.currency -> subscription.currency
// transaction.interval -> subscription.interval
// stripe.subscription -> subscription.data
// stripe.subscription.status === 'active' -> subscription.isActive
// stripe.subscription.start -> subscription.activatedAt
// stripe.subscription.ended_at -> subscription.deactivatedAt
// subscription.id -> transaction.SubscriptionId


// Subscription.where({stripeSubscriptionId})
// .then((subscription) => {
//  if (!!subscription) return transaction.addSubscription(subscription);
//  else return transaction.createSubscription(obj);
// })

const Stripe = require('stripe');
const _ = require('lodash');
const app = require('../index');
const models = app.set('models');
const moment = require('moment');

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

const formatDate = unix => {
  if (unix) {
    return moment.unix(unix).format();
  } else {
    return null;
  }
};

function createSubscription(transaction) {
  const subscription = {
    stripeSubscriptionId: transaction.stripeSubscriptionId,
    amount: transaction.amount,
    interval: transaction.interval,
    currency: transaction.currency
  };

  return new Promise((resolve, reject) => {
    transaction.Group.getStripeAccount((err, account) => {
      if (err) return reject(err);
      return resolve(Stripe(account.accessToken)); // connected account client
    });
  })
  .then(stripe => {
    return stripe.customers.retrieveSubscription(
      transaction.Card.serviceId, // cus_
      transaction.stripeSubscriptionId // sub_
    );
  })
  .then(stripeSubscription => {
    return transaction.createSubscription(
      _.extend({}, subscription,
      {
        data: stripeSubscription,
        isActive: stripeSubscription.status === 'active',
        activatedAt: formatDate(stripeSubscription.start), // stripe return unix dates
        deactivatedAt: formatDate(stripeSubscription.ended_at) // stripe return unix dates
      })
    );
  })
  .catch(err => { // canceled by user
    return transaction.createSubscription(
      _.extend({}, subscription,
      {
        isActive: false
      })
    );
  });
}

models.Transaction.findAll({
   include: [
    { model: models.Group },
    { model: models.User },
    { model: models.Card }
  ]
})
.each((transaction) => { // each is sequential
  if (!transaction.stripeSubscriptionId) return;
  if (transaction.SubscriptionId) return;

  return models.Subscription.findAll({
    where: {
      stripeSubscriptionId: transaction.stripeSubscriptionId
    }
  })
  .then((subscriptions) => {
    if (subscriptions.length === 0) {
      return createSubscription(transaction);
    } else {
      return transaction.setSubscription(subscriptions[0]);
    }
  });
})
.then(() => done())
.catch(done)