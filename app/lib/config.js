/**
 * Dependencies.
 */
var config = require('config');
var _ = require('lodash');
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

  /**
   * Load .env file
   */

  if (_.contains(['test', 'development'], process.env.NODE_ENV)) {
    require('dotenv').load();
  }

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
    key: process.env.AWS_KEY,
    secret: process.env.AWS_SECRET,
    bucket: config.aws.s3.bucket,
    region: 'us-west-1'
  });

};
