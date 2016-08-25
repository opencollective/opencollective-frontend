/**
 * Dependencies.
 */
import Paypal from 'paypal-adaptive';
import knox from 'knox';
import config from 'config';

/**
 * Module.
 */
export default function(app) {
  const { env } = config;

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

};
