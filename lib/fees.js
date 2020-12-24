import { isMemberOfTheEuropeanUnion } from '@opencollective/taxes';
import { get } from 'lodash';

import { GQLV2_PAYMENT_METHOD_TYPES } from './constants/payment-methods';

const PAYMENT_PROVIDERS_WITHOUT_FEES = new Set([
  GQLV2_PAYMENT_METHOD_TYPES.PREPAID_BUDGET,
  GQLV2_PAYMENT_METHOD_TYPES.ACCOUNT_BALANCE,
]);

/**
 * A helper to return the fee for given payment method.
 *
 * @param {object} - The payment method
 * @param {number} - The amount to pay, in cents
 *
 * @return {object} paymentMethod
 *    - fee: The fee value. Will be 0 if there's no fee or if the payment method type is unknown.
 *    - feePercent: The fee value. Will be 0 if there's no fee or if the payment method type is unknown.
 *    - isExact: Will be true if there's no doubt about the result, false if it's not precise.
 *    - aboutURL: An URL to an help page to get more info about the fees for this payment method.
 */
const getPaymentMethodFees = (paymentMethod, amount, collectiveCurrency) => {
  const defaultFee = { fee: 0, feePercent: 0, isExact: false };
  if (!paymentMethod) {
    return defaultFee;
  }

  const sourcePm = paymentMethod.sourcePaymentMethod || paymentMethod;
  const type = sourcePm.providerType || sourcePm.type;
  const currency = sourcePm.balance?.currency || paymentMethod.balance?.currency;

  if (type === GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD) {
    let stripeFeePercent = 0.029;
    if (currency === 'EUR') {
      stripeFeePercent = 0.014;
    } else if (!currency) {
      const country = get(sourcePm, 'data.country');
      if (country && isMemberOfTheEuropeanUnion(country)) {
        stripeFeePercent = 0.014;
      }
    }

    const fee = amount * stripeFeePercent + 30;
    return {
      name: 'Stripe',
      fee,
      feePercent: (fee / amount) * 100,
      aboutURL: 'https://stripe.com/pricing',
      // Can only be sure of the fee if we have the currency of the card and no currency conversion
      isExact: currency === collectiveCurrency,
    };
  } else if (PAYMENT_PROVIDERS_WITHOUT_FEES.has(type)) {
    return { ...defaultFee, isExact: true };
  } else if (type === GQLV2_PAYMENT_METHOD_TYPES.PAYPAL) {
    // Paypal fee depends on the country of the account, and we can't possibly
    // know this information in advance.
    const fee = amount * 0.039 + 30;
    return {
      name: 'PayPal',
      fee,
      feePercent: (fee / amount) * 100,
      isExact: false,
      aboutURL: 'https://www.paypal.com/webapps/mpp/paypal-fees',
    };
  }

  return defaultFee;
};

export default getPaymentMethodFees;
