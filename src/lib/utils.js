import { get } from 'lodash';

export function truncate(str, length) {
  if (!str || typeof str !== 'string' || str.length <= length) {
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

/**
 * Gives the number of days between two dates
 */
export const days = (d1, d2 = new Date) => {
  const oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((new Date(d1).getTime() - new Date(d2).getTime())/(oneDay)));
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
  return email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

export function getCurrencySymbol(currency) {
 const r = Number(0).toLocaleString(currency, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0});
 return r.replace(/0$/,'');
}

/** Retrieve variables set in the environment */
export const getEnvVar = (v) => (process.browser)
  ? get(window, ['__NEXT_DATA__', 'env', v])
  : get(process, ['env', v]);

export const getBaseImagesUrl = () => getEnvVar('IMAGES_URL');

export function resizeImage(imageUrl, { width, height, query, baseUrl }) {
  if (!imageUrl) return null;
  if (imageUrl.substr(0, 1) === '/') return imageUrl; // if image is a local image, we don't resize it with the proxy.
  if (imageUrl.substr(0,4).toLowerCase() !== 'http') return null; // Invalid imageUrl;
  if (!query && imageUrl.match(/\.svg$/)) return imageUrl; // if we don't need to transform the image, no need to proxy it.
  let queryurl = '';
  if (query) {
    queryurl = encodeURIComponent(query);
  } else {
    if (width) queryurl += `&width=${width}`;
    if (height) queryurl += `&height=${height}`;
  }

  return `${getBaseImagesUrl() || baseUrl || ''}/proxy/images/?src=${encodeURIComponent(imageUrl)}${queryurl}`;
}

export function isValidImageUrl(src) {
  return src && (src.substr(0,1) === '/' || src.substr(0,4).toLowerCase() === 'http');
}

export function imagePreview(src, defaultImage, options = { width: 640 }) {

  if (typeof options.width === 'string') {
    options.width = Number(options.width.replace(/rem/,'')) * 10;
  }
  if (typeof options.height === 'string') {
    options.height = Number(options.height.replace(/rem/,'')) * 10;
  }

  if (src) return resizeImage(src, options);
  if (isValidImageUrl(defaultImage)) return defaultImage;
  return null;
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

export function getQueryParams() {
  const urlParams = {};
  let match;
  const pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) {
 return decodeURIComponent(s.replace(pl, " "));
},
        query  = window.location.search.substring(1);

  // eslint-disable-next-line no-cond-assign
  while (match = search.exec(query)) {
    urlParams[decode(match[1])] = decode(match[2]);
  }
  return urlParams;
}


// source: https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
function extractHostname(url) {
  let hostname;
  //find & remove protocol (http, ftp, etc.) and get hostname

  if (url.indexOf("://") > -1) {
      hostname = url.split('/')[2];
  } else {
      hostname = url.split('/')[0];
  }

  //find & remove port number
  hostname = hostname.split(':')[0];
  //find & remove "?"
  hostname = hostname.split('?')[0];

  return hostname;
}

export function getDomain(url = '') {
  let domain = extractHostname(url);
  const splitArr = domain.split('.'), arrLen = splitArr.length;

  //extracting the root domain here
  //if there is a subdomain
  if (arrLen > 2) {
      domain = `${splitArr[arrLen - 2]  }.${  splitArr[arrLen - 1]}`;
      //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
      if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
          //this is using a ccTLD
          domain = `${splitArr[arrLen - 3]  }.${  domain}`;
      }
  }
  return domain;
}

export function formatDate(date, options = { month: 'long', year: 'numeric' }) {
  const d = new Date(date);
  const locale = (typeof window !== 'undefined') ? window.navigator.language : options.locale || 'en-US';
  return d.toLocaleDateString(locale, options);
}

export function formatCurrency(amount, currency = 'USD', options = {}) {
  amount = amount / 100;

  let minimumFractionDigits = 2;
  let maximumFractionDigits = 2;

  if (options.hasOwnProperty('minimumFractionDigits')) {
    minimumFractionDigits = options.minimumFractionDigits
  } else if (options.hasOwnProperty('precision')) {
    minimumFractionDigits = options.precision;
    maximumFractionDigits = options.precision;
  }

  return amount.toLocaleString(getLocaleFromCurrency(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits : minimumFractionDigits,
    maximumFractionDigits : maximumFractionDigits
  })
}

export const singular = (str) => {
  if (!str) return '';
  return str.replace(/ies$/,'y').replace(/s$/,'');
}

export const pluralize = (str, n) => {
  return (n > 1) ? `${str}s` : str;
}

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

export const translateApiUrl = (url) => {
  const withoutParams = getBaseApiUrl({ internal : true }) + (url.replace('/api/', '/'));
  const hasParams = `${url}`.match(/\?/)
  if (process.env.API_KEY) {
    return `${withoutParams}${hasParams ? '&' : '?'}api_key=${process.env.API_KEY}`;
  } else {
    return withoutParams;
  }
};

export const capitalize = (str) => {
  if (typeof str !== 'string') return '';
  str = str.trim();
  if (str.length === 0) return '';
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
  const tokens = str.match(/\.|\?|!/);
  if (tokens) {
    str = str.substr(0, tokens.index + 1);
  }
  str = trim(str, length);
  return str;
}

/*
* Shortens a number to the abbreviated thousands, millions, billions, etc
* https://stackoverflow.com/a/40724354

* @param {number} number: value to shorten
* @returns {string|number}

* @example
* // return '12.3k'
* abbreviateNumber(12345)
*/

const SI_PREFIXES = ["", "k", "M", "G", "T", "P", "E"];

export const abbreviateNumber = (number) => {

    // what tier? (determines SI prefix)
    const tier = Math.log10(number) / 3 | 0;

    // if zero, we don't need a prefix
    if (tier == 0) return number;

    // get prefix and determine scale
    const scale = Math.pow(10, tier * 3);

    // scale the number
    const scaled = number / scale;

    // format number and add prefix as suffix
    return scaled.toFixed(1) + SI_PREFIXES[tier];
};
