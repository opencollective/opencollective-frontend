import { get } from 'lodash';
import europeanCountries from '../constants/europeanCountries';

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
const getPaymentMethodFees = (paymentMethod, amount) => {
  const defaultFee = { fee: 0, feePercent: 0, isExact: true };
  if (!paymentMethod) {
    return defaultFee;
  }

  const { type, service, currency } = paymentMethod;
  if (service === 'stripe') {
    if (type === 'creditcard') {
      let stripeFeePercent = 0.029;
      if (currency === 'EUR') {
        stripeFeePercent = 0.014;
      } else if (!currency) {
        const country = get(paymentMethod, 'data.country');
        if (country && europeanCountries.includes(country)) {
          stripeFeePercent = 0.014;
        }
      }

      const fee = amount * stripeFeePercent + 30;
      return {
        fee,
        feePercent: (fee / amount) * 100,
        isExact: true,
        aboutURL: 'https://stripe.com/pricing',
      };
    }
  } else if (service === 'paypal') {
    // Paypal fee depends on the country of the account, and we can't possibly
    // know this information in advance.
    const fee = amount * 0.039 + 30;
    return {
      fee,
      feePercent: (fee / amount) * 100,
      isExact: false,
      aboutURL: 'https://www.paypal.com/webapps/mpp/paypal-fees',
    };
  }
  return defaultFee;
};

export default getPaymentMethodFees;
