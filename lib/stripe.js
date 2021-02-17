import Payment from 'payment';

import { getEnvVar } from './env-utils';
import { loadScriptAsync } from './utils';

const stripeInstances = {};

const getStripe = async (token, stripeAccount) => {
  const instanceId = stripeAccount || 'default';
  if (!stripeInstances[instanceId]) {
    const stripeKey = token || getEnvVar('STRIPE_KEY');
    if (stripeKey) {
      if (typeof window.Stripe === 'undefined') {
        await loadScriptAsync('https://js.stripe.com/v3/');
      }
      stripeInstances[instanceId] = window.Stripe(stripeKey, stripeAccount ? { stripeAccount } : {});
    } else {
      throw new Error("'STRIPE_KEY' is undefined.");
    }
  }
  return stripeInstances[instanceId];
};

const getStripeToken = (type = 'cc', data) => {
  // for testing only
  const TEST_ENVIRONMENT =
    typeof window !== 'undefined' &&
    window.location.search.match(/test=e2e/) &&
    (window.location.hostname === 'staging.opencollective.com' || window.location.hostname === 'localhost');
  if (TEST_ENVIRONMENT) {
    return Promise.resolve({
      token: 'tok_bypassPending',
      /* eslint-disable camelcase */
      card: {
        last4: 4242,
        exp_month: 11,
        exp_year: 23,
        brand: 'visa',
        country: 'us',
        funding: 'credit',
        address_zip: 10014,
      },
      /* eslint-enable camelcase */
    });
  }

  switch (type) {
    case 'cc': // credit card
      return getStripe()
        .then(stripe => stripe.createToken(data))
        .then(res => {
          if (res.error) {
            throw new Error(res.error.message);
          }
          return { token: res.token.id, card: res.token.card };
        });
  }
};

/**
 * Convert a stripe token as returned by `createToken` into a PaymentMethod object.
 */
export const stripeTokenToPaymentMethod = ({ id, card }) => {
  return {
    name: card.last4,
    token: id,
    service: 'stripe',
    type: 'creditcard',
    data: {
      fullName: card.full_name,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      brand: card.brand,
      country: card.country,
      funding: card.funding,
      zip: card.address_zip,
    },
  };
};

const isValidCard = card => {
  if (typeof card.cvc !== 'string') {
    card.cvc = `${card.cvc}`;
  }
  return (
    card &&
    card.cvc &&
    card.cvc.length >= 3 &&
    card.exp_month &&
    card.exp_year &&
    Payment.fns.validateCardNumber(card.number)
  );
};

export { getStripe, getStripeToken, isValidCard };
