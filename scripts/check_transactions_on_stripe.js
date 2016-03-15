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
    { model: models.Card },
    { model: models.Subscription }
  ]
})
.map((transaction) => {
  if (!transaction.Subscription) {
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
      transaction.Subscription.stripeSubscriptionId // sub_
    )
    .catch((err) => {
      if (err.type === 'StripeInvalidRequest') {
        return;
      }

      return Promise.reject(err);
    });
  })
  .then(stripeSubscription => {
    if (!stripeSubscription) return ;

    const currency = stripeSubscription.plan.currency.toUpperCase();
    const amount = stripeSubscription.plan.amount / 100;
    const url = `https://dashboard.stripe.com/${accountId}/plans/${stripeSubscription.plan.id}`;

    if (amount !== transaction.amount) {
      message.push(`Missmatched amount: ${transaction.id}, url: ${url}`);
    }

    if (!transaction.interval) {
      message.push(`Interval missing: ${transaction.id}, url: ${url}`);
    } else if (transaction.interval !== stripeSubscription.plan.interval) {
      message.push(`Missmatched interval: ${transaction.id}, url: ${url}`);
    }

    if (currency !== transaction.currency) {
      message.push(`Missmatched currency: ${transaction.id}, url: ${url}`);
    }
  });
})
.then(() => {
  const str = message.join('\n');

  if (str.length > 0) {
    return slackLib.postMessage(str, { channel: '#critical' });
  }
})
.then(() => done())
.catch(done)
