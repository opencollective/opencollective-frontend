/**
 * Helpers for generating payment method labels and expiry info.
 *
 * The fact that we use these labels inside `<select/>` options prevent us
 * from implementing this as a React component as for now React does not
 * support having components inside `<option/>` tags, even if the component
 * returns only strings.
 *
 * [This message](https://github.com/facebook/react/issues/13586#issuecomment-419490956)
 * explains why its not supported (though it has been in the past) and why
 * it may not be in a near future.
 *
 */

import dayjs from 'dayjs';
import { get, padStart } from 'lodash-es';

import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from './constants/payment-methods';

/**
 * Generate a pretty string for payment method expiryDate or return an empty
 * string if payment method has no expiry date.
 * @param {PaymentMethod} pm
 */
export function paymentMethodExpiration(pm) {
  /* The expiryDate field will show up for prepaid cards */
  return pm.expiryDate
    ? dayjs(pm.expiryDate).format('MM/YYYY')
    : get(pm, 'data.expMonth') || get(pm, 'data.expYear')
      ? `${padStart(get(pm, 'data.expMonth'), 2, '0')}/${get(pm, 'data.expYear')}`
      : '';
}

/**
 * Format a credit card brand for label, truncating the name if too long
 * or using abreviations like "AMEX" for American Express.
 * @param {string} brand
 */
function formatCreditCardBrand(brand) {
  brand = brand.toUpperCase();

  if (brand === 'UNKNOWN') {
    return null;
  } else if (brand === 'AMERICAN EXPRESS') {
    return 'AMEX';
  } else if (brand.length > 10) {
    brand = `${brand.slice(0, 8)}...`;
  }
  return brand;
}

/**
 * Format payment method name
 */
export const getPaymentMethodName = ({ name, data, service, type }) => {
  if (type === PAYMENT_METHOD_TYPE.GIFTCARD) {
    return name?.replace('card from', 'Gift Card from') || 'Gift card';
  } else if (type === PAYMENT_METHOD_TYPE.PREPAID) {
    return `Prepaid: ${name}`;
  } else if (type === PAYMENT_METHOD_TYPE.CREDITCARD) {
    const brand = data && data.brand && formatCreditCardBrand(data.brand);
    return `${brand || 'Credit card'} **** ${name || ''}`;
  } else if (service === PAYMENT_METHOD_SERVICE.PAYPAL) {
    return 'PayPal';
  } else if (type === PAYMENT_METHOD_TYPE.MANUAL) {
    return 'Bank transfer';
  } else if (type === PAYMENT_METHOD_TYPE.ALIPAY) {
    return 'Alipay';
  } else if (!type || type === PAYMENT_METHOD_TYPE.PAYMENT_INTENT) {
    return '';
  } else if (type === PAYMENT_METHOD_TYPE.SEPA_DEBIT) {
    return `SEPA ${name}`;
  } else if (type === PAYMENT_METHOD_TYPE.US_BANK_ACCOUNT) {
    return `ACH ${name}`;
  } else if (type === PAYMENT_METHOD_TYPE.BACS_DEBIT) {
    return `Bacs ${name}`;
  } else if (type === PAYMENT_METHOD_TYPE.BANCONTACT) {
    return `Bancontact ${name}`;
  } else {
    return name || `${service} - ${type}`;
  }
};
