/**
 * Dependencies.
 */
var Paypal = require('paypal-adaptive');
var knox = require('knox');
var config = require('config');
var nodemailer = require('nodemailer');

/**
 * Module.
 */
module.exports = function(app) {
  var env = config.env;

  // Stripe.
  app.stripe = require('stripe')(config.stripe.secret);

  // Paypal.
  app.paypalAdaptive = new Paypal({
    userId: config.paypal.classic.userId,
    password: config.paypal.classic.password,
    signature: config.paypal.classic.signature,
    appId: config.paypal.classic.appId,
    sandbox: env !== 'production'
  });

  // S3 bucket
  app.knox = knox.createClient({
    key: config.aws.s3.key,
    secret: config.aws.s3.secret,
    bucket: config.aws.s3.bucket,
    region: 'us-west-1'
  });

  // Mailgun.
  app.mailgun = nodemailer.createTransport({
    service: 'Mailgun',
    auth: {
      user: config.mailgun.user,
      pass: config.mailgun.password
    }
  });

};
