import _ from 'lodash';
import Stripe from 'stripe';

import utils from '../lib/utils';

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
      if (err.type === 'StripeInvalidRequestError' && _.contains(err.message, 'No such plan')) {
        return stripeClient.plans.create(plan);
      }

      console.log(err);
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
 * Retrieve stripe subscription
 */
const retrieveSubscription = (stripeAccount, customerId, stripeSubsriptionId) => {
  return client(stripeAccount).customers.retrieveSubscription(customerId, stripeSubsriptionId);
}

/**
 * Get all subscriptions
 */
const getSubscriptionsList = (stripeAccount, limit) => {
  if (!limit) {
    limit = 10;
  }
  return client(stripeAccount).subscriptions.list({ limit });
}

/**
 * Delete a subscription
 */
const cancelSubscription = (stripeAccount, stripeSubscriptionId) => {
  return client(stripeAccount).subscriptions.del(stripeSubscriptionId);
}

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
 * Fetch customer
 */
const retrieveCustomer = (stripeAccount, customerId) => {
  return client(stripeAccount).customers.retrieve(customerId);
}

/**
 * Create charge
 */
const createCharge = (stripeAccount, charge) => {
  return client(stripeAccount).charges.create(charge);
};

/**
 * Retrieve a balance transaction (for fees)
 */
const retrieveBalanceTransaction = (stripeAccount, txn) => {
  return client(stripeAccount).balance.retrieveTransaction(txn);
}

const extractFees = (balance) => {
  const fees = {
    total: balance.fee,
    stripeFee: 0,
    applicationFee: 0,
    other: 0
  };

  balance.fee_details.forEach(fee => {
    if (fee.type === 'stripe_fee') {
      fees.stripeFee += fee.amount;
    } else if (fee.type === 'application_fee') {
      fees.applicationFee += fee.amount;
    } else {
      fees.other += fee.amount;
    }
  })
  return fees;
}

export {
  getOrCreatePlan,
  createSubscription,
  retrieveSubscription,
  getSubscriptionsList,
  cancelSubscription,
  createCharge,
  createCustomer,
  retrieveCustomer,
  retrieveBalanceTransaction,
  extractFees
};

