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

const publicKey = 'pk_test_5aBB887rPuzvWzbdRiSzV3QB';
const secret = 'sk_test_XOFJ9lGbErcK5akcfdYM1D7j';


if (!isTest(publicKey) || !isTest(secret)) {
  console.log('can only replace with test keys');
  process.exit();
}

models.StripeAccount.findAll({})
.map((stripeAccount) => {

  stripeAccount.accessToken = secret;
  stripeAccount.stripePublishableKey = publicKey;

  return stripeAccount.save();
})
.then(() => done())
.catch(done)