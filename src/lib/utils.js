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

export function filterCollection(array, cond, inverse) {
  if (!array || !cond) return array;

  const test = (obj, cond, depth = 0) => {
    if (depth > 5) return false;
    if (!obj) return false;
    if (cond instanceof RegExp)
      return Boolean(obj.match(cond));
    if (typeof cond === 'string')
      return obj === cond;
    
    const nextKey = Object.keys(cond)[0];
    return test(obj[nextKey], cond[nextKey], ++depth);
  }

  return array.filter((r) => inverse ? !test(r, cond) : test(r, cond))
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

export const pluralize = (str, n) => {
  return (n > 1) ? `${str}s` : str;
}

export const capitalize = (str) => {
  if (!str) return '';
  return `${str[0].toUpperCase()}${str.substr(1)}`;
}

export const trim = (str, length) => {
  if (!str) return '';

  if (str.length <= length) return str;

  const res = [];
  let res_length = 0;
  const words = str.split(' ');
  let i=0;
  while (res_length < length && i < words.length) {
    const w = words[i++];
    res_length += w.length + 1;
    res.push(w);
  }
  return `${res.join(' ')} …`;
}

export const firstSentence = (str, length) => {
  if (!str) return '';

  str = str.replace(/&amp;/g, '&');

  if (str.length <= length) return str;
  const tokens = str.match(/\.|\?|\!/);
  if (tokens) {
    str = str.substr(0, tokens.index + 1);
  }
  str = trim(str, length);
  return str;
}