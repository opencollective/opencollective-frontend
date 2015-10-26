/**
 * Dependencies.
 */
var config = require('config');
var Paypal = require('paypal-adaptive');
var knox = require('knox');

/**
 * Module.
 */
module.exports = function(app) {

  // Environment.
  var env = process.env.NODE_ENV || 'development';
  process.env.NODE_ENV = env;
  app.set('env', env);

  // Stripe.
  app.stripe = require('stripe')(config.stripe.secret);

  // Paypal.
  app.paypalAdaptive = new Paypal({
    userId: config.paypal.classic.userId,
    password: config.paypal.classic.password,
    signature: config.paypal.classic.signature,
    appId: config.paypal.classic.appId,
    sandbox: (env === 'development' || env === 'test' || env === 'circleci')
  });

  // S3 bucket
  app.knox = knox.createClient({
    key: config.aws.s3.key,
    secret: config.aws.s3.secret,
    bucket: config.aws.s3.bucket,
    region: 'us-west-1'
  });

};
