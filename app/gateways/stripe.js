const _ = require('lodash');
const Stripe = require('stripe');

const utils = require('../lib/utils');

/**
 * Get the stripe client for the connected account
 */
const client = stripeAccount => Stripe(stripeAccount.accessToken);

/**
 * Create a plan if it doesn not find it
 */
const getOrCreatePlan = (stripeAccount, plan) => {
  const stripeClient = client(stripeAccount);
  const planId = utils.planId(plan);

  plan.id = planId;
  plan.name = planId;

  return stripeClient.plans.retrieve(plan.id)
    .catch((err) => {
      if (err.type === 'StripeInvalidRequest' && _.contains(err.message, 'No such plan')) {
        return stripeClient.plans.create(plan);
      }

      return Promise.reject(err);
    });
}

/**
 * Create stripe subscription with plan
 */
const createSubscription = (stripeAccount, customerId, subscription) => {
  return client(stripeAccount).customers.createSubscription(customerId, subscription);
};

/**
 * Create stripe customer
 */
const createCustomer = (stripeAccount, token, options) => {
  const group = options.group || {};
  const email = options.email || '';

  return client(stripeAccount).customers.create({
    source: token,
    description:  `Paying ${email} to ${group.name}`,
    email
  });
};

/**
 * Create charge
 */
const createCharge = (stripeAccount, charge) => {
  return client(stripeAccount).charges.create(charge);
};

module.exports = {
  getOrCreatePlan,
  createSubscription,
  createCharge,
  createCustomer
};

