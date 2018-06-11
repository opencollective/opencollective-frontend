import Url from 'url';
import config from 'config';
import crypto from 'crypto';
import base64url from 'base64url';
import Promise from 'bluebird';
import debugLib from 'debug';
import pdf from 'html-pdf';
import fs from 'fs';
import path from 'path';
import handlebars from './handlebars';
import { get, cloneDeep } from 'lodash';
import sanitizeHtml from 'sanitize-html';

const debug = debugLib('utils');

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
  const splitArr = domain.split('.'),
      arrLen = splitArr.length;

  //extracting the root domain here
  //if there is a subdomain
  if (arrLen > 2) {
      domain = `${splitArr[arrLen - 2]}.${splitArr[arrLen - 1]}`;
      //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
      if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
          //this is using a ccTLD
          domain = `${splitArr[arrLen - 3]}.${domain}`;
      }
  }
  return domain;
}

/**
 * Encrypt with resetPasswordSecret
 */
export const encrypt = (text) => {
  const cipher = crypto.createCipher('aes-256-cbc', config.keys.opencollective.resetPasswordSecret)
  let crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
};

/**
 * Descript wih resetPasswordSecret
 */
export const decrypt = (text) => {
  const decipher = crypto.createDecipher('aes-256-cbc', config.keys.opencollective.resetPasswordSecret)
  let dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
};

export function strip_tags(str, allowedTags) {
  return sanitizeHtml(str, {
    allowedTags: allowedTags || sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'h1',
      'h2'
    ]),
    allowedAttributes: {
      a: [ 'href', 'name', 'target' ],
      img: [ 'src' ]
    }
  });
}

export const sanitizeObject = (obj, attributes, sanitizerFn) => {
  const sanitizer = typeof sanitizerFn === 'function'
    ? sanitizerFn
    : strip_tags;

  attributes.forEach(attr => {
    if (!obj[attr]) return;
    if (typeof obj[attr] === 'object') return sanitizeObject(obj[attr], Object.keys(obj[attr]), sanitizerFn);
    obj[attr] = sanitizer(obj[attr] || "");
  });
  return obj;
}

/**
 * recursively reads all values of an object and hide emails and tokens
 * @param {*} obj
 */
export const sanitizeForLogs = (obj) => {
  const sanitizer = (value) => {
    if (!value) return;
    if (typeof value === 'string') {
      if (value.indexOf('@') !== -1) {
        return "(email obfuscated)";
      }
      if (value.substr(0,4) === 'tok_') {
        return "(token obfuscated)";
      }
    }
    return value;
  }

  return sanitizeObject(cloneDeep(obj), Object.keys(obj), sanitizer);
}

String.prototype.trunc = function(n, useWordBoundary ) {
  if (this.length <= n) return this;
  const subString = this.substr(0, n-1);
  return `${(useWordBoundary
    ? subString.substr(0, subString.lastIndexOf(' '))
    : subString)}&hellip;`;
};

/**
 * Generate a secured token that works inside URLs
 * http://stackoverflow.com/a/25690754
 */
export const generateURLSafeToken = size => base64url(crypto.randomBytes(size));

/**
 * Get current Url.
 */
export const getRequestedUrl = (req) => {
  return `${req.protocol}://${req.get('Host')}${req.url}`;
};

/**
 * Add parameters to an url.
 */
export const addParameterUrl = (url, parameters) => {
  const parsedUrl  = Url.parse(url, true);

  function removeTrailingChar(str, char) {
    if (str.substr(-1) === char) {
      return str.substr(0, str.length - 1);
    }

    return str;
  }

  parsedUrl.pathname = removeTrailingChar(parsedUrl.pathname, '/');

  delete parsedUrl.search; // Otherwise .search is used in place of .query
  delete parsedUrl.query.api_key; // make sure we don't surface the api_key publicly

  for (const p in parameters) {
    const param = parameters[p];
    parsedUrl.query[p] = param;
  }

  return Url.format(parsedUrl);
};

/**
 * Pagination: from (offset, limit) to (page, per_page).
 */
const paginatePage = (offset, limit) => {
  return {
    page: Math.floor(offset / limit + 1),
    perPage: limit
  }
};

/**
 * Get links for pagination.
 */
export const getLinks = (url, options) => {
  const page = options.page || paginatePage(options.offset, options.limit).page;
  const perPage = options.perPage || paginatePage(options.offset, options.limit).perPage;

  if (!page && !perPage)
    return null;

  const links = {
    next: addParameterUrl(url, {page: page + 1, per_page: perPage}),
    current: addParameterUrl(url, {page, per_page: perPage})
  };
  if (page > 1) {
    links.prev = addParameterUrl(url, {page: page - 1, per_page: perPage});
    links.first = addParameterUrl(url, {page: 1, per_page: perPage});
  }

  if (options.total) {
    const lastPage = Math.ceil(options.total / perPage);
    links.last = addParameterUrl(url, {page: lastPage, per_page: perPage});
    if (page >= lastPage)
      delete links.next;
  }

  return links;
};

/**
 * Get headers for pagination.
 */
export const getLinkHeader = (url, options) => {
  const links = getLinks(url, options);
  let header = '';
  let k = 0;
  for (const i in links) {
    header += ((k !== 0) ? ', ' : '') + '<' + links[i] + '>; rel="' + i + '"'; // eslint-disable-line
    k += 1;
  }

  return header;
};

/**
 * We can generate our own plan ids with stripe, we will use a simple one for
 * now until we decide to make more complex plans. We will only take into account
 * the currency, interval and amount. It will have the following format
 *
 * 'USD-MONTH-1000'
 */
export const planId = (plan) =>  {
  return [plan.currency, plan.interval, plan.amount].join('-').toUpperCase();
};

/**
 * Pagination offset: from (page,per_page) to (offset, limit).
 */
export const paginateOffset = (page, perPage) => {
  return {
    offset: (page - 1) * perPage,
    limit: perPage
  }
};

/**
 * Gives the number of days between two dates
 */
export const days = (d1, d2 = new Date) => {
  const oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
}

export const flattenArray = (arr) => {
  return arr.reduce((flat, toFlatten) => {
    return flat.concat(Array.isArray(toFlatten) ? flattenArray(toFlatten) : toFlatten);
  }, []);
}

/**
 * Returns stats for each tier compared to previousMonth
 *
 * @PRE:
 *  - tiers: array of Tier: [ { name, interval, users: [ { id, totalDonations, firstDonation, lastDonation } ] } ]
 *  - startDate, endDate: boundaries for lastMonth
 *
 * @POST: { stats, tiers }
 *  - stats.backers.lastMonth: number of backers who were active by endDate
 *  - stats.backers.previousMonth: number of backers who were active by startDate
 *  - stats.backers.new: the number of backers whose first donation was after startDate
 *  - stats.backers.lost: the number of backers who were active before startDate, but stopped being active
 *  - tiers: tiers with users sorted by totalDonations
 */
export const getTiersStats = (tiers, startDate, endDate) => {

  const backersIds = {};
  const stats = { backers: {} };

  const rank = (user) => {
    if (user.isNew) return 1;
    if (user.isLost) return 2;
    return 3;
  };

  stats.backers.lastMonth = 0;
  stats.backers.previousMonth = 0;
  stats.backers.new = 0;
  stats.backers.lost = 0;

  // We only keep the tiers that have at least one user
  tiers = tiers.filter(tier => {
    if (get(tier, 'dataValues.users') && get(tier, 'dataValues.users').length > 0) {
      return true;
    } else {
      debug("skipping tier", tier.dataValues, "because it has no users");
      return false;
    }
  });

  // We sort tiers by number of users ASC
  tiers.sort((a,b) => b.amount - a.amount);

  return Promise.map(tiers, tier => {

    const backers = get(tier, 'dataValues.users');
    let index = 0
    debug("> processing tier ", tier.name, "total backers: ", backers.length, backers);

    // We sort backers by total donations DESC
    backers.sort((a,b) => b.totalDonations - a.totalDonations );

    return Promise.filter(backers, backer => {
      if (backersIds[backer.id]) {
        debug(">>> backer ", backer.slug, "is a duplicate");
        return false;
      }
      backersIds[backer.id] = true;

      backer.index = index++;
      return Promise.all([tier.isBackerActive(backer, endDate), tier.isBackerActive(backer, startDate)])
        .then(results => {
          backer.activeLastMonth = results[0];
          backer.activePreviousMonth = (backer.firstDonation < startDate) && results[1];
          if (tier.name.match(/sponsor/i))
            backer.isSponsor = true;
          if (backer.firstDonation > startDate) {
            backer.isNew = true;
            stats.backers.new++;
          }
          if (backer.activePreviousMonth && !backer.activeLastMonth) {
            backer.isLost = true;
            stats.backers.lost++;
          }

          debug("----------- ", backer.slug, "----------");
          debug("firstDonation", backer.firstDonation && backer.firstDonation.toISOString().substr(0,10));
          debug("totalDonations", backer.totalDonations/100);
          debug("active last month?", backer.activeLastMonth);
          debug("active previous month?", backer.activePreviousMonth);
          debug("is new?", backer.isNew === true);
          debug("is lost?", backer.isLost === true);
          if (backer.activePreviousMonth)
            stats.backers.previousMonth++;
          if (backer.activeLastMonth) {
            stats.backers.lastMonth++;
            return true;
          } else if (backer.isLost) {
            return true;
          }
        });
    })
    .then(backers => {
      backers.sort((a, b) => {
        if (rank(a) > rank(b)) return 1;
        if (rank(a) < rank(b)) return -1;
        return a.index - b.index; // make sure we keep the original order within a tier (typically totalDonations DESC)
      });

      tier.users = backers;

      return tier;
    });
  })
  .then(tiers => {
    return { stats, tiers};
  });
}

/**
 * export data to CSV
 * @param {*} data
 * @param {*} attributes
 * @param {*} getColumnName
 * @param {*} processValue
 */
export function exportToCSV(data, attributes, getColumnName = (attr) => attr, processValue = (attr, val) => val) {
  const lines = [];

  lines.push(`"${attributes.map(getColumnName).join('","')}"`); // Header

  const getLine = (row) => {
    const cols = [];
    attributes.map(attr => {
      cols.push(`${processValue(attr, get(row,attr) || '')}`.replace(/\"/g,"\""));
    });
    return `"${cols.join('","')}"`;
  }

  data.map(row => {
    lines.push(getLine(row));
  });
  return lines.join('\n');
}

/**
 * export transactions to PDF
 */
export function exportToPDF(template, data, options) {

  options = options || {};
  options.paper = options.paper || 'Letter' // Letter for US or A4 for Europe

  let paperSize;

  switch (options.paper) {
    case 'A4':
      paperSize = {
        width: '210mm',
        height: '297mm',
        margin: {
          top: '10mm',
          left: '10mm'
        }
      }
      break;
    case 'Letter':
    default:
      paperSize = {
        width: '8.5in',
        height: '11in',
        margin: {
          top: '0.4in',
          left: '0.4in'
        }
      }
      break;
  }

  data.paperSize = paperSize;
  options.paperSize = paperSize;

  const templateFilepath = path.resolve(__dirname, `../../templates/pdf/${template}.hbs`);
  const source = fs.readFileSync(templateFilepath, 'utf8');
  const render = handlebars.compile(source);

  const html = render(data);

  if (options.format === 'html') return Promise.resolve(html);
  options.format = options.paper;

  options.timeout = 60000;

  return new Promise((resolve, reject) => {
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) return reject(err);
      return resolve(buffer);
    });
  });
}

/**
 * Default host id, set this for new collectives created through our flow
 */
export const defaultHostCollective = (tag) => {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV  === 'staging') {
    if (tag === 'opensource') {
      return { id: 772, CollectiveId: 11004, ParentCollectiveId: 83 }; // Open Source Host Collective
    } else {
      return { id: 7944, CollectiveId: 8674, ParentCollectiveId: 83 }; // Non-open source Host Collective ('host-other')
    }
  }
  return { id: 1, CollectiveId: 1 };
};

/**
 * Demo host id, set this for new collectives created through the flow
 */
export const demoHostId = () => {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV  === 'staging') {
    return 254;
  }
  return 1;
};

export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  return email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

/**
 * Check if this is an internal email address.
 * Useful for testing emails in localhost or staging
 */
export const isEmailInternal = (email) => {
  if (!email) return false;
  if (email.match(/(opencollective\.(com|org))$/i) !== -1 ) {
    return true;
  }
  if (email.match(/^xdamman.*@gmail\.com$/)) {
    return true;
  }
  return false;
};

export function capitalize(str) {
  if (!str) return '';
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

export function uncapitalize(str) {
  if (!str) return '';
  return str[0].toLowerCase() + str.slice(1);
}

export function pluralize(str, count) {
  if (count <= 1) return str;
  return `${str}s`.replace(/s+$/,'s');
}

export function resizeImage(imageUrl, { width, height, query, defaultImage }) {
  if (!imageUrl) {
    if (defaultImage) {
      imageUrl = (defaultImage.substr(0,1) === '/') ? `${config.host.website}${defaultImage}` : defaultImage;
    } else {
      return null;
    }
  }

  if (imageUrl[0] === '/') imageUrl = `https://opencollective.com${imageUrl}`;

  let queryurl = '';
  if (query) {
    queryurl = `&query=${encodeURIComponent(query)}`;
  } else {
    if (width) queryurl += `&width=${width}`;
    if (height) queryurl += `&height=${height}`;
  }
  return `${config.host.website}/proxy/images/?src=${encodeURIComponent(imageUrl)}${queryurl}`;
}

export function formatArrayToString(arr, conjonction = 'and') {
  if (arr.length === 1) return arr[0];
  return `${arr.slice(0, arr.length -1).join(', ')} ${conjonction} ${arr.slice(-1)}`;
}

export function formatCurrency(amount, currency, precision = 0) {
  amount = amount/100; // converting cents
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
  return amount.toLocaleString(locale, {
    style: 'currency',
    currencyDisplay: 'symbol',
    currency,
    minimumFractionDigits : precision,
    maximumFractionDigits : precision
  });
}

/**
 * @PRE: { USD: 1000, EUR: 6000 }
 * @POST: "€60 and $10"
 */
export function formatCurrencyObject(currencyObj, options = { precision: 0, conjonction: 'and' }) {
  const array = [];
  for (const currency in currencyObj) {
    if (currencyObj[currency] > 0) {
      array.push({ value: currencyObj[currency], str: formatCurrency(currencyObj[currency], currency, options.precision) });
    }
  }
  if (array.length === 1) return array[0].str;
  array.sort((a, b) => b.value - a.value)
  return formatArrayToString(array.map(r => r.str), options.conjonction);
}

export function isUUID(str) {
  return (str.length === 36 && str.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
}

export function hashCode(str) {
  let hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/** Sleeps for MS milliseconds */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export function chunkArray( startArray, chunkSize ) {
    let j = -1;
    return startArray.reduce(( arr, item, ix ) => {
      j += (ix % chunkSize) === 0 ? 1 : 0;
      arr[ j ] = [...( arr[ j ] || []), item ];
      return arr;
    }, []);
  }

// This generates promises of n-length at a time
// Useful so we don't go over api quota limit on Stripe
export function promiseSeq(arr, predicate, consecutive =100) {
  return chunkArray(arr, consecutive).reduce(( prom, items, ix ) => {
    // wait for the previous Promise.all() to resolve
    return prom.then(() => {
      return Promise.all(
        // then we build up the next set of simultaneous promises
        items.map((item) => predicate(item, ix))
      )
    });
  }, Promise.resolve([]));

}
