import getSymbolFromCurrency from 'currency-symbol-map';

import loadScript from 'load-script';

import { CurrencyPrecision } from './constants/currency-precision';

export function truncate(str, length) {
  if (!str || typeof str !== 'string' || str.length <= length) {
    return str;
  }
  const subString = str.substr(0, length - 1);
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

/**
 * Gives the number of days between two dates
 */
export const days = (d1, d2 = new Date()) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((new Date(d1).getTime() - new Date(d2).getTime()) / oneDay));
};

export function filterCollection(array, cond, inverse) {
  if (!array || !cond) {
    return array;
  }

  const test = (obj, cond, depth = 0) => {
    if (depth > 5) {
      return false;
    }
    if (!obj) {
      return false;
    }
    if (cond instanceof RegExp) {
      return Boolean(obj.match(cond));
    }
    if (typeof cond === 'string') {
      return obj === cond;
    }

    const nextKey = Object.keys(cond)[0];
    return test(obj[nextKey], cond[nextKey], ++depth);
  };

  return array.filter(r => (inverse ? !test(r, cond) : test(r, cond)));
}

/**
 * Validate a relative path.
 * > isValidRelativeUrl('a/b/c/d/e/f/g')
 * true
 * > isValidRelativeUrl('about.html')
 * true
 * > isValidRelativeUrl('//')
 * false
 * > isValidRelativeUrl('https://google.com')
 * false
 */
export const isValidRelativeUrl = url => {
  return Boolean(url.match(/^[^/]*\/[^/].*$|^\/[^/].*$/));
};

export const isValidEmail = email => {
  if (typeof email !== 'string') {
    return false;
  }
  return email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );
};

function getCurrencySymbolFallback(currency) {
  return Number(0)
    .toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/(^0\s?)|(\s?0$)/, '');
}

export function getCurrencySymbol(currency) {
  return getSymbolFromCurrency(currency) || getCurrencySymbolFallback(currency);
}

export const getPrecisionFromAmount = amount => {
  return amount.toString().slice(-2) === '00' ? 0 : CurrencyPrecision.DEFAULT;
};

export function parseToBoolean(value) {
  let lowerValue = value;
  // check whether it's string
  if (lowerValue && (typeof lowerValue === 'string' || lowerValue instanceof String)) {
    lowerValue = lowerValue.trim().toLowerCase();
  }
  if (['on', 'enabled', '1', 'true', 'yes', 1].includes(lowerValue)) {
    return true;
  }
  return false;
}

export function prettyUrl(url) {
  if (!url) {
    return '';
  }
  return url
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\?.+/, '')
    .replace(/\/$/, '');
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

export function getQueryParams() {
  const urlParams = {};
  let match;
  const pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function(s) {
      return decodeURIComponent(s.replace(pl, ' '));
    },
    query = window.location.search.substring(1);

  // eslint-disable-next-line no-cond-assign
  while ((match = search.exec(query))) {
    urlParams[decode(match[1])] = decode(match[2]);
  }
  return urlParams;
}

export function formatDate(date, options = { month: 'long', year: 'numeric' }) {
  const d = new Date(date);
  const locale = typeof window !== 'undefined' ? window.navigator.language : options.locale || 'en-US';
  return d.toLocaleDateString(locale, options);
}

export function formatCurrency(amount, currency = 'USD', options = {}) {
  amount = amount / 100;

  let minimumFractionDigits = 2;
  let maximumFractionDigits = 2;

  if (Object.prototype.hasOwnProperty.call(options, 'minimumFractionDigits')) {
    minimumFractionDigits = options.minimumFractionDigits;
  } else if (Object.prototype.hasOwnProperty.call(options, 'precision')) {
    minimumFractionDigits = options.precision;
    maximumFractionDigits = options.precision;
  }

  return amount.toLocaleString(getLocaleFromCurrency(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: maximumFractionDigits,
  });
}

export const singular = str => {
  if (!str) {
    return '';
  }
  return str.replace(/ies$/, 'y').replace(/s$/, '');
};

export const pluralize = (str, n) => {
  return n > 1 ? `${str}s` : str;
};

export const getBaseApiUrl = ({ internal } = {}) => {
  if (process.browser) {
    return '/api';
  } else if (internal && process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  } else {
    return process.env.API_URL || 'https://api.opencollective.com';
  }
};

/**
 * Returns the GraphQL api url for the appropriate api version and environment.
 * @param {string} version - api version. Defaults to v1.
 * @returns {string} GraphQL api url.
 */
export const getGraphqlUrl = apiVersion => {
  const apiKey = !process.browser ? process.env.API_KEY : null;
  return `${getBaseApiUrl()}/graphql${apiVersion ? `/${apiVersion}` : ''}${apiKey ? `?api_key=${apiKey}` : ''}`;
};

export const translateApiUrl = url => {
  const withoutParams = getBaseApiUrl({ internal: true }) + url.replace('/api/', '/');
  const hasParams = `${url}`.match(/\?/);
  if (process.env.API_KEY) {
    return `${withoutParams}${hasParams ? '&' : '?'}api_key=${process.env.API_KEY}`;
  } else {
    return withoutParams;
  }
};

export const capitalize = str => {
  if (typeof str !== 'string') {
    return '';
  }
  str = str.trim();
  if (str.length === 0) {
    return '';
  }
  return `${str[0].toUpperCase()}${str.substr(1)}`;
};

export const trim = (str, length) => {
  if (!str) {
    return '';
  }

  if (str.length <= length) {
    return str;
  }

  const res = [];
  let res_length = 0;
  const words = str.split(' ');
  let i = 0;
  while (res_length < length && i < words.length) {
    const w = words[i++];
    res_length += w.length + 1;
    res.push(w);
  }
  return `${res.join(' ')} …`;
};

export const firstSentence = (str, length) => {
  if (!str) {
    return '';
  }

  str = str.replace(/&amp;/g, '&');

  if (str.length <= length) {
    return str;
  }
  const tokens = str.match(/\.|\?|!/);
  if (tokens) {
    str = str.substr(0, tokens.index + 1);
  }
  str = trim(str, length);
  return str;
};

/*
* Shortens a number to the abbreviated thousands, millions, billions, etc
* https://stackoverflow.com/a/40724354

* @param {number} number: value to shorten
* @returns {string|number}

* @example
* // return '12.3k'
* abbreviateNumber(12345, 1)
*/

const SI_PREFIXES = ['', 'k', 'M', 'G', 'T', 'P', 'E'];

export const abbreviateNumber = (number, precision = 0) => {
  // what tier? (determines SI prefix)
  const tier = (Math.log10(number) / 3) | 0;

  const round = value => {
    return precision === 0 ? Math.round(value) : value.toFixed(precision);
  };

  // if zero, we don't need a prefix
  if (tier == 0) {
    return round(number);
  }

  // get prefix and determine scale
  const scale = Math.pow(10, tier * 3);

  // scale the number
  const scaled = number / scale;

  return round(scaled) + SI_PREFIXES[tier];
};

export const loadScriptAsync = (url, opts = {}) =>
  new Promise((resolve, reject) => {
    loadScript(url, opts, (err, script) => {
      if (err) {
        reject(err);
      } else {
        resolve(script);
      }
    });
  });

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_special_characters
// From section about escapting user input
export const escapeInput = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getWebsiteUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.host}`;
  } else {
    return process.env.WEBSITE_URL;
  }
};

export function compose(...funcs) {
  const functions = funcs.reverse();
  return function(...args) {
    const [firstFunction, ...restFunctions] = functions;
    let result = firstFunction.apply(null, args);
    restFunctions.forEach(fnc => {
      result = fnc.call(null, result);
    });
    return result;
  };
}

/** This function will return true if reportValidity is not supported by the browser, or if it succeed */
export const reportValidityHTML5 = domNodeOrEvent => {
  return !domNodeOrEvent || !domNodeOrEvent.reportValidity || domNodeOrEvent.reportValidity();
};

/**
 * Repeat `func` for `nbTimes`, calling it every `interval` ms.
 * Passes one parameter: the number of iterations left.
 */
export const repeatWithInterval = (nbTimes, interval, func) => {
  func(nbTimes);
  if (nbTimes - 1 > 0) {
    setTimeout(() => repeatWithInterval(nbTimes - 1, interval, func), interval);
  }
};
