const Stripe = require('stripe');
const app = require('../index');
const models = app.set('models');

const missmatched = [];

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

models.Transaction.findAll({
   include: [
    { model: models.Group },
    { model: models.User },
    { model: models.Card }
  ]
})
.map((transaction) => {
  if (!transaction.stripeSubscriptionId) {
    return Promise.resolve();
  }

  var accountId;

  return new Promise((resolve, reject) => {
    transaction.Group.getStripeAccount((err, account) => {
      if (err) return reject(err);
      accountId = account.stripeUserId;
      return resolve(Stripe(account.accessToken)); // connected account client
    });
  })
  .then(stripe => {
    return stripe.customers.retrieveSubscription(
      transaction.Card.serviceId, // cus_
      transaction.stripeSubscriptionId // sub_
    );
  })
  .then(subscription => {
    const currency = subscription.plan.currency.toUpperCase();
    const amount = subscription.plan.amount / 100;
    const url = `https://dashboard.stripe.com/${accountId}/plans/${subscription.plan.id}`;

    if (amount !== transaction.amount) {
      console.log(`missmatched amount: ${transaction.id}, url: ${url}`);
    }

    if (!transaction.interval) {
      console.log(`interval missing: ${transaction.id}, url: ${url}`);
    } else if (transaction.interval !== subscription.plan.interval) {
      console.log(`missmatched interval: ${transaction.id}, url: ${url}`);
    }

    if (currency !== transaction.currency) {
      console.log(`missmatched currency: ${transaction.id}, url: ${url}`);
    }

    return;
  });
})
.then(() => done())
.catch(done)