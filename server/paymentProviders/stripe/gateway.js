/*
 * All calls to stripe are meant to go through this gateway
 */

import { get } from 'lodash';
import Stripe from 'stripe';
import config from 'config';
import debugLib from 'debug';

const debug = debugLib('stripe');

export const appStripe = Stripe(config.stripe.secret);

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

  return appStripe.tokens.create({ customer: customerId }, { stripe_account: stripeAccount.username });
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
  return appStripe.balanceTransactions.retrieve(txn, {
    stripe_account: stripeAccount.username,
  });
};

/**
 * Given a charge id, retrieves its correspind charge and refund data.
 */
export const retrieveChargeWithRefund = async (stripeAccount, chargeId) => {
  const charge = await retrieveCharge(stripeAccount, chargeId);
  if (!charge) {
    throw Error(`charge id ${chargeId} not found`);
  }
  const refundId = get(charge, 'refunds.data[0].id');
  const refund = await appStripe.refunds.retrieve(refundId, {
    stripe_account: stripeAccount.username,
  });
  return { charge, refund };
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

/**
 * List all charges
 * @param {number} limit A limit on the number of objects to be returned. Limit can range between 1 and 100, and the default is 10.
 * @param {string} starting_after A cursor for use in pagination. starting_after is an object ID that defines your place in the list. For instance, if you make a list request and receive 100 objects, ending with obj_foo, your subsequent call can include starting_after=obj_foo in order to fetch the next page of the list.
 */
export const listCharges = (stripe_account, params) => {
  return appStripe.charges.list(params, { stripe_account });
};

/**
 * Returns true if token is a valid stripe test token.
 * See https://stripe.com/docs/testing#cards
 */
export const isTestToken = token => {
  return [
    'tok_bypassPending',
    'tok_chargeDeclined',
    'tok_chargeDeclinedExpiredCard',
    'tok_chargeDeclinedProcessingError',
  ].includes(token);
};
