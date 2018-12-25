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
