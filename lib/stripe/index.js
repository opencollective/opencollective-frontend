import { getEnvVar } from '../env-utils';
import { loadScriptAsync } from '../utils';

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

/**
 * Convert a stripe token as returned by `createToken` into a PaymentMethod object.
 */
export const stripeTokenToPaymentMethod = ({ id, card }) => {
  return {
    name: card.last4,
    token: id,
    service: 'STRIPE',
    type: 'CREDITCARD',
    data: {
      fullName: card.full_name,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      brand: card.brand,
      country: card.country,
      funding: card.funding,
      zip: card.address_zip,
      fingerprint: card.fingerprint,
    },
  };
};

export { getStripe };
