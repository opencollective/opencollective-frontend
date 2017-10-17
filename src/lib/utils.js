export function truncate(str, length) {
  if (!str || str.length <= length) {
    return str;
  }
  const subString = str.substr(0, length-1);
  return `${subString.substr(0, subString.lastIndexOf(' '))} …`;
}

export function trimObject(obj) {
  const res = {};
  Object.keys(obj).forEach(attr => {
    if (typeof obj[attr] !== 'undefined') {
      res[attr] = obj[attr];
    }
  });
  return res;
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

export const isValidUrl = (url) => {
  if (typeof url !== 'string') return false;
  return Boolean(url.match(/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/));
}

export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  return email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

export function getCurrencySymbol(currency) {
 const r = Number(0).toLocaleString(currency, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0});
 return r.replace(/0$/,'');
}

export function imagePreview(src, defaultImage, options = { width: 640 }) {
  if (src) return `https://res.cloudinary.com/opencollective/image/fetch/w_${options.width},f_jpg/${src}`;
  return defaultImage;
}

export function prettyUrl(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/i,'').replace(/\?.+/, '').replace(/\/$/,'');
}

function getLocaleFromCurrency(currency) {
  let locale;
  switch (currency) {
    case 'USD':
      locale = 'en-US';
      break;
    case 'EUR':
      locale = 'en-EU';
      break;
    default:
      locale = currency;
  }
  return locale;
}

export function formatDate(date, options = { month: 'long', year: 'numeric' }) {
  const d = new Date(date);
  const locale = (typeof window !== 'undefined') ? window.navigator.language : options.locale || 'en-US';
  return d.toLocaleDateString(locale, options);
}

export function formatCurrency(amount, currency = 'USD', options = {}) {
  amount = amount / 100;
  return amount.toLocaleString(getLocaleFromCurrency(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits : options.minimumFractionDigits || options.precision || 0,
    maximumFractionDigits : options.precision || 0
  })
};

export const singular = (str) => {
  if (!str) return '';
  return str.replace(/ies$/,'y').replace(/s$/,'');
}

export const pluralize = (str, n) => {
  return (n > 1) ? `${str}s` : str;
}

export const translateApiUrl = (url) => {
  const withoutParams = process.env.API_URL + (url.replace('/api/', '/'));
  const hasParams = `${url}`.match(/\?/) 
  if (process.env.API_KEY) {
    return `${withoutParams}${hasParams ? '&' : '?'}api_key=${process.env.API_KEY}`;
  } else {
    return withoutParams;
  }
};

export const capitalize = (str) => {
  if (!str) return '';
  str = str.trim();
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