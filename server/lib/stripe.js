import Stripe from 'stripe';
import config from 'config';

export default Stripe(config.stripe.secret);

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
