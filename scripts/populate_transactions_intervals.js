const Stripe = require('stripe');
const app = require('../index');
const models = app.set('models');

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
  if (!transaction.stripeSubscriptionId || transaction.interval) {
    return Promise.resolve();
  }

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
  .then(subscription => {
    transaction.interval = subscription.plan.interval;
    return transaction.save();
  });
})
.then(() => done())
.catch(done)