const paypal = require('paypal-rest-sdk');
const async = require('async');
const config = require('config');

const createBillingPlan = (transaction, group, paypalConfig, cb) => {
  const callbackUrl = `${config.host.api}/groups/${group.id}/transactions/${transaction.id}/callback`;

  // Paypal frequency is uppercase: 'MONTH'
  const amount = transaction.amount;
  const currency = transaction.currency;
  const interval = transaction.interval;
  const frequency = interval.toUpperCase();

  const billingPlan = {
    description: `Plan for donation to ${group.name} (${currency} ${amount} / ${interval})`,
    name: `Plan ${group.name}`,
    merchant_preferences: {
      cancel_url: callbackUrl,
      return_url: callbackUrl
    },
    payment_definitions: [{
      amount: {
        currency,
        value: amount
      },
      cycles: '0',
      frequency,
      frequency_interval: '1',
      name: `Regular payment`,
      type: 'REGULAR' // or TRIAL
    }],
    type: 'INFINITE' // or FIXED
  };

  paypal.billingPlan.create(billingPlan, paypalConfig, cb);
};

const createBillingAgreement = (group, planId, paypalConfig, cb) => {
  // From paypal example, fails with moment js, TO REFACTOR
  var isoDate = new Date();
  isoDate.setSeconds(isoDate.getSeconds() + 4);
  isoDate.toISOString().slice(0, 19) + 'Z';

  const billingAgreement = {
    name: `Agreement for donation to ${group.name}`,
    description: `Agreement for donation to ${group.name}`,
    start_date: isoDate,
    plan: {
      id: planId
    },
    payer: {
      payment_method: 'paypal'
    }
  };

  paypal.billingAgreement.create(billingAgreement, paypalConfig, cb);
}

/**
 * Create a subscription payment and return the links to the paypal approval
 */
const createSubscription = (args, callback) => {
  const connectedAccount = args.connectedAccount;
  const transaction = args.transaction;
  const group = args.group;

  // We will pass the config in all the subsequent calls to be sure we don't
  // overwrite the configuration of the global sdk
  // Example: https://github.com/paypal/PayPal-node-SDK/blob/master/samples/configuration/multiple_config.js
  const paypalConfig = {
    mode: config.paypal.rest.mode,
    client_id: connectedAccount.clientId,
    client_secret: connectedAccount.secret
  };

  async.auto({
    createBillingPlan: (cb) => {
      createBillingPlan(
        transaction,
        group,
        paypalConfig,
        cb
      );
    },

    activatePlan: ['createBillingPlan', (cb, results) => {
      paypal.billingPlan.activate(
        results.createBillingPlan.id,
        paypalConfig,
        cb
      );
    }],

    createBillingAgreement: ['activatePlan', (cb, results) => {
      createBillingAgreement(
        group,
        results.createBillingPlan.id,
        paypalConfig,
        cb
      );
    }]

  }, (err, results) => {
    if (err) return callback(err);

    return callback(null, {
      billingPlan: results.createBillingPlan,
      billingAgreement: results.createBillingAgreement
    })
  });

};

module.exports.createSubscription = createSubscription;
