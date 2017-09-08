import _ from 'lodash';
import Stripe from 'stripe';
import config from 'config';

import { planId } from '../lib/utils';
import debugLib from 'debug';
const debug = debugLib('stripe');
export const appStripe = Stripe(config.stripe.secret);

/**
 * Get the stripe client for the connected account
 */
const client = stripeAccount => Stripe(stripeAccount.token);

/**
 * Create a plan if it doesn not find it
 */
export const getOrCreatePlan = (stripeAccount, plan) => {
  debug(">>> stripe: createCharge using stripeAccount", { username: stripeAccount.username, CollectiveId: stripeAccount.CollectiveId }, "plan:", plan);
  const id = planId(plan);

  plan.id = id;
  plan.name = id;

  return appStripe.plans.retrieve(plan.id, { stripe_account: stripeAccount.username })
    .catch((err) => {
      if (err.type === 'StripeInvalidRequestError' && _.contains(err.message, 'No such plan')) {
        return appStripe.plans.create(plan, { stripe_account: stripeAccount.username });
      }

      console.error(err);
      return Promise.reject(err);
    });
};

/**
 * Create stripe subscription with plan
 */
export const createSubscription = (stripeAccount, customerId, subscription) => {
  return appStripe.customers.createSubscription(customerId, subscription, { stripe_account: stripeAccount.username });
};

/**
 * Retrieve stripe subscription
 */
export const retrieveSubscription = (stripeAccount, stripeSubsriptionId) => {
  debug("retrieveSubscription", "account", stripeAccount.username, "stripeSubsriptionId", stripeSubsriptionId)
  return appStripe.subscriptions.retrieve(stripeSubsriptionId, { stripe_account: stripeAccount.username });
};

/**
 * Get all subscriptions
 */
export const getSubscriptionsList = (stripeAccount, limit) => {
  if (!limit) {
    limit = 10;
  }
  return appStripe.subscriptions.list({ limit }, { stripe_account: stripeAccount.username });
};

/**
 * Delete a subscription
 */
export const cancelSubscription = (stripeAccount, stripeSubscriptionId) => {
  return appStripe.subscriptions.del(stripeSubscriptionId, { stripe_account: stripeAccount.username });
};

/**
 * Create stripe customer
 * Returns a customerId (string)
 */
export const createCustomer = (stripeAccount, token, options = {}) => {
  const collective = options.collective || {};
  const email = options.email || '';
  debug(">>> stripe: createCustomer using stripeAccount", stripeAccount && { username: stripeAccount.username, CollectiveId: stripeAccount.CollectiveId }, "and token", token);
  return appStripe.customers.create({
    source: token,
    description:  `https://opencollective.com/${collective.slug}`,
    email
  }, { stripe_account: stripeAccount && stripeAccount.username });
};

/**
 * Fetch customer
 */
export const retrieveCustomer = (stripeAccount, customerId) => {
  return appStripe.customers.retrieve(customerId, { stripe_account: stripeAccount.username });
};

/**
 * Create token
 * Doc: https://stripe.com/docs/connect/shared-customers
 */
export const createToken = (stripeAccount, customerId) => {
  debug(">>> stripe: createToken using stripeAccount", { username: stripeAccount.username, CollectiveId: stripeAccount.CollectiveId }, "for customerId:", customerId);
  return appStripe.tokens.create({ customer: customerId }, { stripe_account: stripeAccount.username });
};

/**
 * Create charge
 */
export const createCharge = (stripeAccount, charge) => {
  debug(">>> stripe: createCharge using stripeAccount", { username: stripeAccount.username, CollectiveId: stripeAccount.CollectiveId }, "charge:", charge);
  return appStripe.charges.create(charge, { stripe_account: stripeAccount.username });
};

/**
 * Fetch charge
 */
export const retrieveCharge = (stripeAccount, chargeId) => {
  return client(stripeAccount).charges.retrieve(chargeId);
};

/**
 * Retrieve a balance transaction (for fees)
 */
export const retrieveBalanceTransaction = (stripeAccount, txn) => {
  return appStripe.balance.retrieveTransaction(txn, { stripe_account: stripeAccount.username });
};

export const extractFees = (balance) => {
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
  });
  return fees;
};
