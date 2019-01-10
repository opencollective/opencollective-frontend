import Payment from 'payment';

import { getEnvVar, loadScriptAsync } from './utils';

let stripe;

const getStripe = async token => {
  if (!stripe) {
    const stripeKey = token || getEnvVar('STRIPE_KEY');
    if (stripeKey) {
      if (typeof window.Stripe === 'undefined') {
        await loadScriptAsync('https://js.stripe.com/v3/');
      }
      stripe = window.Stripe(stripeKey);
    } else {
      throw new Error("'STRIPE_KEY' is undefined.");
    }
  }
  return stripe;
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
      card: {
        last4: 4242,
        exp_month: 11,
        exp_year: 23,
        brand: 'visa',
        country: 'us',
        funding: 'credit',
        address_zip: 10014,
      },
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
export const stripeTokenToPaymentMethod = stripeToken => {
  return {
    name: stripeToken.card.last4,
    token: stripeToken.id,
    service: 'stripe',
    type: 'creditcard',
    data: {
      fullName: stripeToken.card.full_name,
      expMonth: stripeToken.card.exp_month,
      expYear: stripeToken.card.exp_year,
      brand: stripeToken.card.brand,
      country: stripeToken.card.country,
      funding: stripeToken.card.funding,
      zip: stripeToken.card.address_zip,
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
