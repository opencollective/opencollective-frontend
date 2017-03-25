import filter from 'lodash/filter';
import values from 'lodash/values';
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  free: { id: 'utils.free', defaultMessage: 'free' }
});

export function truncate(str, length) {
  if (!str || str.length <= length) {
    return str;
  }
  const subString = str.substr(0, length-1);
  return `${subString.substr(0, subString.lastIndexOf(' '))} …`;
}

export function isValidEmail(email) {
  if (!email) return false;
  return Boolean(email.match(/.+@.+\..+/));
}

export function formatCurrency(amount, currency = 'USD', intl) {
  if (!amount) return intl ? intl.formatMessage(messages.free) : messages.free.defaultMessage;
  amount = amount / 100;
  return amount.toLocaleString(currency, {
    style: 'currency',
    currency,
    minimumFractionDigits : 0,
    maximumFractionDigits : 2
  })
};

export function filterCollection(collection, validator) {
  return filter(values(collection), validator);
}

export const pluralize = (str, n) => {
  return (n > 1) ? `${str}s` : str;
}

export const capitalize = (str) => {
  if (!str) return '';
  return `${str[0].toUpperCase()}${str.substr(1)}`;
}