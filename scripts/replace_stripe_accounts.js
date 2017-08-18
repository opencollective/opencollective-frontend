const _ = require('lodash');
const config = require('config');
import models from '../server/models';

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

models.ConnectedAccount.findAll({ where: { service: 'stripe' } })
.map((stripeAccount) => {

  stripeAccount.token = secret;
  stripeAccount.data = stripeAccount.data || {};
  stripeAccount.data.publishableKey = publicKey;

  return stripeAccount.save();
})
.then(() => done())
.catch(done)
