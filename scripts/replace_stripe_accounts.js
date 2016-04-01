const _ = require('lodash');
const app = require('../index');
const config = require('config');
const models = app.set('models');

const done = (err) => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
}

const isTest = (str) => _.contains(str, 'test');

const publicKey = config.stripe.key;
const secret = config.stripe.secret;


if (!isTest(publicKey) || !isTest(secret)) {
  console.log('can only replace with test keys');
  return;
}

models.StripeAccount.findAll({})
.map((stripeAccount) => {

  stripeAccount.accessToken = secret;
  stripeAccount.stripePublishableKey = key;

  return stripeAccount.save();
})
.then(() => done())
.catch(done)