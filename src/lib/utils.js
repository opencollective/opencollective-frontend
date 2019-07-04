import { get } from 'lodash';
import getSymbolFromCurrency from 'currency-symbol-map';

import loadScript from 'load-script';

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
  if (!array || !cond) return array;

  const test = (obj, cond, depth = 0) => {
    if (depth > 5) return false;
    if (!obj) return false;
    if (cond instanceof RegExp) return Boolean(obj.match(cond));
    if (typeof cond === 'string') return obj === cond;

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
  if (typeof email !== 'string') return false;
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

/** Retrieve variables set in the environment */
export const getEnvVar = v => (process.browser ? get(window, ['__NEXT_DATA__', 'env', v]) : get(process, ['env', v]));

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

export const getBaseImagesUrl = () => getEnvVar('IMAGES_URL');

export function resizeImage(imageUrl, { width, height, query, baseUrl }) {
  if (!imageUrl) return null;
  if (imageUrl.substr(0, 1) === '/') return imageUrl; // if image is a local image, we don't resize it with the proxy.
  if (imageUrl.substr(0, 4).toLowerCase() !== 'http') return null; // Invalid imageUrl;
  if (!query && imageUrl.match(/\.svg$/)) return imageUrl; // if we don't need to transform the image, no need to proxy it.
  let queryurl = '';
  if (query) {
    queryurl = encodeURIComponent(query);
  } else {
    if (width) queryurl += `&width=${width}`;
    if (height) queryurl += `&height=${height}`;
  }

  return `${getBaseImagesUrl() || baseUrl || ''}/proxy/images?src=${encodeURIComponent(imageUrl)}${queryurl}`;
}

export function isValidImageUrl(src) {
  return src && (src.substr(0, 1) === '/' || src.substr(0, 4).toLowerCase() === 'http');
}

export function imagePreview(src, defaultImage, options = { width: 640 }) {
  if (typeof options.width === 'string') {
    options.width = Number(options.width.replace(/rem/, '')) * 10;
  }
  if (typeof options.height === 'string') {
    options.height = Number(options.height.replace(/rem/, '')) * 10;
  }

  if (src) return resizeImage(src, options);
  if (isValidImageUrl(defaultImage)) return defaultImage;
  return null;
}

export function getCollectiveImage(collective, params = {}) {
  const sections = [getBaseImagesUrl(), collective.slug];

  sections.push(params.name || 'avatar');

  for (const key of ['style', 'height', 'width']) {
    if (params[key]) {
      sections.push(params[key]);
    }
  }

  return `${sections.join('/')}.${params.format || 'png'}`;
}

export function getCollectiveBackgroundImage(collective, params = {}) {
  return getCollectiveImage(collective, { ...params, name: 'background' });
}

export function prettyUrl(url) {
  if (!url) return '';
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
  if (!str) return '';
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

export const getGraphqlUrl = () => {
  const apiKey = !process.browser ? process.env.API_KEY : null;
  return `${getBaseApiUrl()}/graphql${apiKey ? `?api_key=${apiKey}` : ''}`;
};

/**
 * From a GraphQL error exception, returns an object like:
 *
 * @returns {
 *   id: 'Unique id of the error, can be null if not provided by the API',
 *   message: 'A user-friendly error message',
 * }
 */
export const getErrorFromGraphqlException = exception => {
  const firstError = get(exception, 'graphQLErrors.0') || get(exception, 'networkError.result.errors.0');

  if (!firstError) {
    return {
      id: 'unknown',
      message: 'An unknown error occured',
    };
  }

  return {
    id: get(firstError, 'data.errorId'),
    message: firstError.message,
  };
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
  if (typeof str !== 'string') return '';
  str = str.trim();
  if (str.length === 0) return '';
  return `${str[0].toUpperCase()}${str.substr(1)}`;
};

export const trim = (str, length) => {
  if (!str) return '';

  if (str.length <= length) return str;

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
  if (!str) return '';

  str = str.replace(/&amp;/g, '&');

  if (str.length <= length) return str;
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
  if (tier == 0) return round(number);

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
