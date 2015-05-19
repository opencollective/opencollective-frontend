/**
 * Dependencies.
 */
var config = require('config');

/**
 * Module.
 */
module.exports = function(app) {

  // Environment.
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  app.set('env', process.env.NODE_ENV);

  // Stripe.
  app.stripe = require('stripe')(config.stripe.secret);

}
