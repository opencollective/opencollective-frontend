import { type ClassValue, clsx } from 'clsx';
import loadScript from 'load-script';
import { isEmpty, isObject, omit } from 'lodash';
import { twMerge } from 'tailwind-merge';

import { WHITELABEL_DOMAINS } from './whitelabel';

/**
 * Helper to make it easier to conditionally add and deduplicate Tailwind CSS classes and deduplicate
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(str, length) {
  if (!str || typeof str !== 'string' || str.length <= length) {
    return str;
  }
  const subString = str.substr(0, length - 1);
  return `${subString.substr(0, subString.lastIndexOf(' '))} …`;
}

export function truncateMiddle(str, length, divider = '…') {
  if (!str || typeof str !== 'string' || str.length <= length) {
    return str;
  }
  const splitLength = Math.floor(length / 2);
  return `${str.slice(0, splitLength - 1)}${divider}${str.slice(-splitLength)}`;
}

export const isValidUrl = url => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validate a relative path.
 * > isValidRelativeUrl('a/b/c/d/e/f/g')
 * true
 * > isValidRelativeUrl('about.html')
 * true
 * > isValidRelativeUrl('//')
 * false
 * > isValidRelativeUrl('//xxx')
 * false
 * > isValidRelativeUrl('https://google.com')
 * false
 */
export const isValidRelativeUrl = url => {
  url = url?.trim();
  if (!url) {
    return false;
  }

  try {
    // If we're able to construct a URL, it means it's an absolute URL.
    new URL(url);
    return false;
  } catch (e) {
    // Prevent URLs like //example.com or /\n/example.com or /\/example.com/
    if (url.match(/^[\s\\/]{2,}.+/)) {
      return false;
    } else {
      return true;
    }
  }
};

export const isTrustedSigninRedirectionUrl = (url: string) => {
  if (!url) {
    return false;
  } else if (url.startsWith('http://') || url.startsWith('https://')) {
    const parsedUrl = new URL(url);
    return WHITELABEL_DOMAINS.includes(parsedUrl.origin);
  }
  return false;
};

export const isValidEmail = email => {
  if (typeof email !== 'string') {
    return false;
  }
  return email.match(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );
};

export function parseToBoolean(value, defaultValue = false) {
  let lowerValue = value;
  // check whether it's string
  if (lowerValue && (typeof lowerValue === 'string' || lowerValue instanceof String)) {
    lowerValue = lowerValue.trim().toLowerCase();
  }
  if (['on', 'enabled', '1', 'true', 'yes', 1].includes(lowerValue)) {
    return true;
  }
  return defaultValue;
}

export function getQueryParams() {
  const urlParams = {};
  let match;
  const pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) {
      return decodeURIComponent(s.replace(pl, ' '));
    },
    query = window.location.search.substring(1);

  // eslint-disable-next-line no-cond-assign
  while ((match = search.exec(query))) {
    urlParams[decode(match[1])] = decode(match[2]);
  }
  return urlParams;
}

export function formatDate(
  date,
  options: Intl.DateTimeFormatOptions & { locale?: Intl.LocalesArgument } = { month: 'long', year: 'numeric' },
) {
  const d = new Date(date);
  const locale = typeof window !== 'undefined' ? window.navigator.language : options.locale || 'en-US';
  try {
    return d.toLocaleDateString(locale, options);
  } catch {
    try {
      return d.toLocaleDateString('en-US', options);
    } catch {
      return d.toString();
    }
  }
}

export const singular = str => {
  if (!str) {
    return '';
  }
  return str.replace(/ies$/, 'y').replace(/s$/, '');
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

const trim = (str, length) => {
  if (!str) {
    return '';
  }

  if (str.length <= length) {
    return str;
  }

  const res = [];
  let resLength = 0;
  const words = str.split(' ');
  let i = 0;
  while (resLength < length && i < words.length) {
    const w = words[i++];
    resLength += w.length + 1;
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

// https://medium.com/@akhilanand.ak01/function-composition-in-javascript-exploring-the-power-of-compose-4114da8b9875
export const compose = (...functions) => {
  return input => {
    return functions.reduceRight((acc, fn) => {
      return fn(acc);
    }, input);
  };
};

/** This function will return true if reportValidity is not supported by the browser, or if it succeed */
export const reportValidityHTML5 = domNodeOrEvent => {
  return !domNodeOrEvent || typeof domNodeOrEvent.reportValidity !== 'function' || domNodeOrEvent.reportValidity();
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

/**
 * Similar to `Promise.allSettled` (which doesn't have a great browser support yet)
 */
export const allSettled = promises => {
  return Promise.all(
    promises.map(promise => {
      return Promise.resolve(promise).then(
        val => ({ status: 'fulfilled', value: val }),
        err => ({ status: 'rejected', reason: err }),
      );
    }),
  );
};

/**
 * Returns flat object containing keys with values that are not empty objects.
 * Ex:
 *    flattenObjectDeep({ b: true, c: { d: {}, e: false }})
 *    // {b: true, e: false}
 *
 *    flattenObjectDeep({ c: { d: {} }})
 *    // {}
 */

export const flattenObjectDeep = obj =>
  Object.keys(obj).reduce(
    (acc, k) => (typeof obj[k] === 'object' ? { ...acc, ...flattenObjectDeep(obj[k]) } : { ...acc, [k]: obj[k] }),
    {},
  );

export const omitDeep = (obj, keys) =>
  Object.keys(omit(obj, keys)).reduce(
    (acc, next) => ({ ...acc, [next]: isObject(obj[next]) ? omitDeep(obj[next], keys) : obj[next] }),
    {},
  );

/** Return all object keys paths */
export function objectKeys(obj: object, filter = Boolean, parentPath = ''): string[] {
  const keys = [];
  Object.entries(obj).forEach(([childKey, child]) => {
    const childPath = `${parentPath}${isEmpty(parentPath) ? '' : '.'}${childKey}`;
    if (typeof child === 'object') {
      keys.push(...objectKeys(child, filter, childPath /* parentPath */));
    } else {
      keys.push(childPath);
    }
  });

  return keys;
}

/**
 * Sort options as: All, then by alphabetical order, then "No payment method" or "Other" at the end
 */
export const sortSelectOptions = (option1, option2) => {
  if (option1.value === 'ALL') {
    return -1;
  }
  if (option2.value === 'ALL') {
    return 1;
  }
  if (option1.value === null) {
    return 1;
  }
  if (option2.value === null) {
    return -1;
  }
  if (option1.value === 'OTHER') {
    return 1;
  }
  if (option2.value === 'OTHER') {
    return -1;
  }
  return option1.label.localeCompare(option2.label);
};
