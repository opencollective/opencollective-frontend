import filter from 'lodash/filter';
import values from 'lodash/values';
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  free: { id: 'utils.free', defaultMessage: 'free' }
});

export function isValidEmail(email) {
  if (!email) return false;
  return Boolean(email.match(/.+@.+\..+/));
}

export function downloadContent(mimeType, filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:${mimeType},${encodeURIComponent(text)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
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