const paypal = require('paypal-rest-sdk');
const async = require('async');
const config = require('config');

/**
 * We will pass the config in all the subsequent calls to be sure we don't
 * overwrite the configuration of the global sdk
 * Example: https://github.com/paypal/PayPal-node-SDK/blob/master/samples/configuration/multiple_config.js
 */
const getConfig = (connectedAccount) => ({
  mode: config.paypal.rest.mode,
  client_id: connectedAccount.clientId,
  client_secret: connectedAccount.secret
});

const getCallbackUrl = (group, transaction) => `${config.host.api}/groups/${group.id}/transactions/${transaction.id}/callback`;

const createBillingPlan = (group, transaction, paypalConfig, cb) => {
  const callbackUrl = getCallbackUrl(group, transaction);

  const amount = transaction.amount;
  const currency = transaction.currency;
  const interval = transaction.interval;

  // Paypal frequency is uppercase: 'MONTH'
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
  isoDate.toISOString().slice(0, 19) + 'Z';  // eslint-disable-line

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
const createSubscription = (connectedAccount, group, transaction, callback) => {
  const paypalConfig = getConfig(connectedAccount);

  async.auto({
    createBillingPlan: (cb) => {
      createBillingPlan(
        group,
        transaction,
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

/**
 * Create a single payment
 * https://developer.paypal.com/docs/rest/api/payments/#payment.create
 */
const createPayment = (connectedAccount, group, transaction, callback) => {
  const currency = transaction.currency;
  const amount = transaction.amount;
  const callbackUrl = getCallbackUrl(group, transaction);
  const paypalConfig = getConfig(connectedAccount);

  const payment = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    redirect_urls: {
        return_url: callbackUrl,
        cancel_url: callbackUrl
    },
    transactions: [{
      amount: {
        currency,
        total: amount
      },
      description: `Donation to ${group.name} (${currency} ${amount})`
    }]
  };

  paypal.payment.create(payment, paypalConfig, callback);
};

/**
 * Execute a payment
 * https://developer.paypal.com/docs/rest/api/payments/#payment.execute
 */

const execute = (connectedAccount, token, paymentId, PayerID, cb) => {
  const paypalConfig = getConfig(connectedAccount);

  // Single payment
  if (paymentId && PayerID) {
    paypal.payment.execute(paymentId, { payer_id: PayerID }, paypalConfig, cb);
  } else {
    paypal.billingAgreement.execute(token, {}, paypalConfig, cb);
  }

}

module.exports = {
  createSubscription,
  createPayment,
  execute
};
