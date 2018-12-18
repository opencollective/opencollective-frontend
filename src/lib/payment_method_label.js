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

import { defineMessages } from 'react-intl';
import moment from 'moment';
import { get, padStart } from 'lodash';
import { formatCurrency } from './utils';

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
    defaultMessage: 'Prepaid: {name} ({balance} left)',
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
function paymentMethodExpiration(pm) {
  /* The expiryDate field will show up for prepaid cards */
  return pm.expiryDate
    ? `- exp ${moment(pm.expiryDate).format('MM/Y')}`
    : get(pm, 'data.expMonth') || get(pm, 'data.expYear')
    ? `- exp ${padStart(get(pm, 'data.expMonth'), 2, '0')}/${get(pm, 'data.expYear')}`
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
 * Generate a pretty label for given payment method or return its name if type
 * is unknown.
 *
 * @param {react-intl} intl the intl provider as given to your component by injectIntl
 * @param {PaymentMethod} paymentMethod
 * @param {string} collectiveName an optional name to prefix the payment method
 */
export function paymentMethodLabel(intl, paymentMethod, collectiveName = null) {
  const { type, balance, currency, name, data } = paymentMethod;
  const brand = data && data.brand && formatCreditCardBrand(data.brand);
  let label = null;

  if (type === 'virtualcard') {
    label = intl.formatMessage(messages.virtualcard, {
      name: name.replace('card from', 'Gift Card from'),
      balance: formatCurrency(balance, currency),
      expiration: paymentMethodExpiration(paymentMethod),
    });
  } else if (type === 'prepaid') {
    label = intl.formatMessage(messages.prepaid, {
      name,
      balance: formatCurrency(balance, currency),
    });
  } else if (type === 'creditcard') {
    label = intl.formatMessage(messages.creditcard, {
      name: `${brand || type} **** ${name}`,
      expiration: paymentMethodExpiration(paymentMethod),
    });
  } else if (type === 'collective') {
    label = intl.formatMessage(messages.collective, {
      name: `Collective ${name}`,
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
export function paymentMethodUnicodeIcon(paymentMethod) {
  switch (paymentMethod.type) {
    case 'creditcard':
      return '💳';
    case 'virtualcard':
      return '🎁';
    case 'prepaid':
      return '🎟️';
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
