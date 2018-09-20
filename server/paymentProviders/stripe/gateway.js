/*
 * All calls to stripe are meant to go through this gateway
 */

import _ from 'lodash';
import Stripe from 'stripe';
import config from 'config';
import debugLib from 'debug';

import { planId } from '../../lib/utils';
const debug = debugLib('stripe');
export const appStripe = Stripe(config.stripe.secret);

/**
 * Create a plan if it doesn not find it
 */
export const getOrCreatePlan = (stripeAccount, plan) => {
  debug(
    '>>> stripe: createCharge using stripeAccount',
    {
      username: stripeAccount.username,
      CollectiveId: stripeAccount.CollectiveId,
    },
    'plan:',
    plan,
  );
  const id = planId(plan);

  plan.id = id;
  plan.name = id;

  return appStripe.plans
    .retrieve(plan.id, { stripe_account: stripeAccount.username })
    .catch(err => {
      if (
        err.type === 'StripeInvalidRequestError' &&
        _.contains(err.message.toLowerCase(), 'no such plan')
      ) {
        return appStripe.plans.create(plan, {
          stripe_account: stripeAccount.username,
        });
      }

      console.error(err);
      return Promise.reject(err);
    });
};

/**
 * Create stripe subscription with plan
 */
export const createSubscription = (stripeAccount, customerId, subscription) => {
  debug('createSubscription');
  return appStripe.customers.createSubscription(customerId, subscription, {
    stripe_account: stripeAccount.username,
  });
};

/**
 * Retrieve stripe subscription
 */
export const retrieveSubscription = (stripeAccount, stripeSubsriptionId) => {
  debug(
    'retrieveSubscription',
    'account',
    stripeAccount.username,
    'stripeSubsriptionId',
    stripeSubsriptionId,
  );
  return appStripe.subscriptions.retrieve(stripeSubsriptionId, {
    stripe_account: stripeAccount.username,
  });
};

/**
 * Get all subscriptions
 */
export const getSubscriptionsList = (stripeAccount, options = {}) => {
  const params = {
    limit: options.limit || 10,
  };

  if (options.startingAfter) {
    params.starting_after = options.startingAfter;
  }

  if (options.endingBefore) {
    params.ending_before = options.endingBefore;
  }

  if (options.plan) {
    params.plan = options.plan;
  }

  debug('getSubscriptionsList');
  return appStripe.subscriptions.list(params, {
    stripe_account: stripeAccount.username,
  });
};

/**
 * Delete a subscription
 */
export const cancelSubscription = (stripeAccount, stripeSubscriptionId) => {
  debug('cancelSubscription');
  return appStripe.subscriptions.del(stripeSubscriptionId, {
    stripe_account: stripeAccount.username,
  });
};

/**
 * Create stripe customer
 * Returns a customerId (string)
 */
export const createCustomer = (stripeAccount, token, options = {}) => {
  const collective = options.collective || {};

  const payload = {
    source: token,
    description: `https://opencollective.com/${collective.slug}`,
    email: options.email || '',
  };

  return appStripe.customers.create(payload, {
    stripe_account: stripeAccount && stripeAccount.username,
  });
};

/**
 * Fetch customer
 */
export const retrieveCustomer = (stripeAccount, customerId) => {
  debug('retrieveCustomer');
  return appStripe.customers.retrieve(customerId, {
    stripe_account: stripeAccount.username,
  });
};

/**
 * Create token
 * Doc: https://stripe.com/docs/connect/shared-customers
 */
export const createToken = (stripeAccount, customerId) => {
  debug(
    '>>> stripe: createToken using stripeAccount',
    {
      username: stripeAccount.username,
      CollectiveId: stripeAccount.CollectiveId,
    },
    'for customerId:',
    customerId,
  );
  return appStripe.tokens.create(
    { customer: customerId },
    { stripe_account: stripeAccount.username },
  );
};

/**
 * Create charge
 */
export const createCharge = (stripeAccount, charge) => {
  debug(
    '>>> stripe: createCharge using stripeAccount',
    {
      username: stripeAccount.username,
      CollectiveId: stripeAccount.CollectiveId,
    },
    'charge:',
    charge,
  );
  return appStripe.charges.create(charge, {
    stripe_account: stripeAccount.username,
  });
};

/**
 * Fetch charge
 */
export const retrieveCharge = (stripeAccount, chargeId) => {
  return appStripe.charges.retrieve(chargeId, {
    stripe_account: stripeAccount.username,
  });
};

/** Refund a charge & the application fee */
export const refundCharge = (stripeAccount, chargeId) => {
  return appStripe.refunds.create(
    { charge: chargeId, refund_application_fee: true },
    { stripe_account: stripeAccount.username },
  );
};

/**
 * Retrieve a balance transaction (for fees)
 */
export const retrieveBalanceTransaction = (stripeAccount, txn) => {
  debug(
    'retrieveBalanceTransaction',
    {
      username: stripeAccount.username,
      CollectiveId: stripeAccount.CollectiveId,
    },
    txn,
  );
  return appStripe.balance.retrieveTransaction(txn, {
    stripe_account: stripeAccount.username,
  });
};

/**
 * Retreive an event (for webhook)
 */
export const retrieveEvent = (stripeAccount, eventId) => {
  return appStripe.events.retrieve(eventId, {
    stripe_account: stripeAccount.username,
  });
};

export const extractFees = balance => {
  const fees = {
    total: balance.fee,
    stripeFee: 0,
    applicationFee: 0,
    other: 0,
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
