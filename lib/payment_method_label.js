/**
 * Functions for generating internationalized payment method labels.
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
import { get, padStart } from 'lodash';
import { defineMessages } from 'react-intl';

import { formatCurrency } from './currency-utils';

const messages = defineMessages({
  virtualcard: {
    id: 'paymentMethods.labelVirtualCard',
    defaultMessage: '{name} {expiration} ({balance} left)',
    description: 'Label for gift cards',
  },
  creditcard: {
    id: 'paymentMethods.labelCreditCard',
    defaultMessage: '{name} {expiration}',
    description: 'Label for stripe credit cards',
  },
  prepaid: {
    id: 'paymentMethods.labelPrepaid',
    defaultMessage: '{name} ({balance} left)',
  },
  collective: {
    id: 'paymentMethods.labelCollective',
    defaultMessage: '{balance} available',
  },
  unavailable: {
    id: 'paymentMethods.labelUnavailable',
    defaultMessage: '(payment method info not available)',
  },
});

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
  if (brand === 'AMERICAN EXPRESS') {
    return 'AMEX';
  } else if (brand.length > 10) {
    brand = `${brand.slice(0, 8)}...`;
  }
  return brand;
}

/**
 * Format payment method name
 */
export const getPaymentMethodName = ({ name, data, type }) => {
  if (type === 'virtualcard') {
    return name.replace('card from', 'Gift Card from');
  } else if (type === 'prepaid') {
    return `Prepaid: ${name}`;
  } else if (type === 'creditcard') {
    const brand = data && data.brand && formatCreditCardBrand(data.brand);
    return `${brand || type} **** ${name}`;
  } else if (type === 'PAYPAL') {
    return 'PayPal';
  } else {
    return name;
  }
};

/**
 * Generate a pretty label for given payment method or return its name if type
 * is unknown.
 *
 * @param {react-intl} intl the intl provider as given to your component by injectIntl
 * @param {PaymentMethod} paymentMethod
 * @param {string} collectiveName an optional name to prefix the payment method
 */
export function paymentMethodLabel(intl, paymentMethod, collectiveName = null) {
  const { type, balance, currency } = paymentMethod;
  const name = getPaymentMethodName(paymentMethod);
  let label = null;

  if (type === 'virtualcard') {
    const expiryDate = paymentMethodExpiration(paymentMethod);
    label = intl.formatMessage(messages.virtualcard, {
      name,
      balance: formatCurrency(balance, currency),
      expiration: `- exp ${expiryDate}`,
    });
  } else if (type === 'prepaid') {
    label = intl.formatMessage(messages.prepaid, {
      name,
      balance: formatCurrency(balance, currency),
    });
  } else if (type === 'creditcard') {
    const expiryDate = paymentMethodExpiration(paymentMethod);
    label = intl.formatMessage(messages.creditcard, {
      name,
      expiration: `- exp ${expiryDate}`,
    });
  } else if (type === 'collective') {
    label = intl.formatMessage(messages.collective, {
      name,
      balance: formatCurrency(balance, currency),
    });
  } else if (!name) {
    label = intl.formatMessage(messages.unavailable);
  } else {
    label = name;
  }

  return collectiveName ? `${collectiveName} - ${label}` : label;
}

/**
 * Get the UTF8 icon associated with given payment method
 * @param {PaymentMethod} paymentMethod
 */
function paymentMethodUnicodeIcon(paymentMethod) {
  switch (paymentMethod.type) {
    case 'creditcard':
      return '💳';
    case 'virtualcard':
      return '🎁';
    case 'prepaid':
      return paymentMethod.currency === 'EUR' ? '💶' : '💵';
    case 'collective':
      return '💸';
    default:
      return '💰';
  }
}

/**
 * Generate a label for given payment method as a string.
 *
 * @param {react-intl} intl the intl provider as given to your component by injectIntl
 * @param {PaymentMethod} paymentMethod
 * @param {string} collectiveName an optional name to prefix the payment method
 */
export function paymentMethodLabelWithIcon(intl, paymentMethod, collectiveName = null) {
  const icon = paymentMethodUnicodeIcon(paymentMethod);
  const label = paymentMethodLabel(intl, paymentMethod, collectiveName);
  return `${icon}\xA0\xA0${label}`;
}
