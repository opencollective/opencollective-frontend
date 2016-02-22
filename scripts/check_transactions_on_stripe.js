const Stripe = require('stripe');
const app = require('../index');
const models = app.set('models');
const slackLib = require('../app/lib/slack');

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

var message = [];

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
    )
    .catch((err) => {
      if (err.type === 'StripeInvalidRequest') {
        return;
      }

      return Promise.reject(err);
    });
  })
  .then(subscription => {
    if (!subscription) return ;

    const currency = subscription.plan.currency.toUpperCase();
    const amount = subscription.plan.amount / 100;
    const url = `https://dashboard.stripe.com/${accountId}/plans/${subscription.plan.id}`;

    if (amount !== transaction.amount) {
      message.push(`Missmatched amount: ${transaction.id}, url: ${url}`);
    }

    if (!transaction.interval) {
      message.push(`Interval missing: ${transaction.id}, url: ${url}`);
    } else if (transaction.interval !== subscription.plan.interval) {
      message.push(`Missmatched interval: ${transaction.id}, url: ${url}`);
    }

    if (currency !== transaction.currency) {
      message.push(`Missmatched currency: ${transaction.id}, url: ${url}`);
    }
  });
})
.then(() => {
  const str = message.join('\n');
  console.log(str);
  return slackLib.postMessage(str);
})
.then(() => done())
.catch(done)