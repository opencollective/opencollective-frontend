/**
 * Dependencies.
 */
var config = require('config');
var Paypal = require('paypal-adaptive');

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
    sandbox: (env === 'development' || env === 'test')
  });

}
