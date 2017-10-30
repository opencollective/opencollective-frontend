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

const debug = debugLib('utils');

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

  const userids = {};
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
  tiers = tiers.filter(tier => tier.users.length > 0 && tier.name != 'host' && tier.name != 'core contributor');

  // We sort tiers by number of users ASC
  tiers.sort((a,b) => b.range[0] - a.range[0]);

  tiers = tiers.map(tier => {

    let index = 0
    debug("> processing tier ", tier.name);

    // We sort users by total donations DESC
    tier.users.sort((a,b) => b.totalDonations - a.totalDonations );

    tier.users = Promise.filter(tier.users, u => {
      if (userids[u.id]) {
        debug(">>> user ", u.username, "is a duplicate");
        return false;
      }
      userids[u.id] = true;

      u.index = index++;

      return Promise.all([tier.isActive(u, endDate), tier.isActive(u, startDate)])
        .then(results => {
          u.activeLastMonth = results[0];
          u.activePreviousMonth = (u.firstDonation < startDate) && results[1];

          if (tier.name.match(/sponsor/i))
            u.isSponsor = true;
          if (u.firstDonation > startDate) {
            u.isNew = true;
            stats.backers.new++;
          }
          if (u.activePreviousMonth && !u.activeLastMonth) {
            u.isLost = true;
            stats.backers.lost++;
          }

          debug("----------- ", u.username, "----------");
          debug("firstDonation", u.firstDonation && u.firstDonation.toISOString().substr(0,10));
          debug("totalDonations", u.totalDonations/100);
          debug("active last month?", u.activeLastMonth);
          debug("active previous month?", u.activePreviousMonth);
          debug("is new?", u.isNew === true);
          debug("is lost?", u.isLost === true);
          if (u.activePreviousMonth)
            stats.backers.previousMonth++;
          if (u.activeLastMonth) {
            stats.backers.lastMonth++;
            return true;
          } else if (u.isLost) {
            return true;
          }
        });
    });

    tier.users.sort((a, b) => {
      if (rank(a) > rank(b)) return 1;
      if (rank(a) < rank(b)) return -1;
      return a.index - b.index; // make sure we keep the original order within a tier (typically totalDonations DESC)
    });

    return tier;
  });
  return { stats, tiers};
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
      cols.push(`${processValue(attr, row[attr])}`.replace(/\"/g,"\""));
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

  return new Promise((resolve, reject) => {
    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) return reject(err);
      return resolve(buffer);
    });
  });
}

/**
 * Default host id, set this for new collectives created through Github
 */
export const defaultHostUser = (tag) => {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV  === 'staging') {
    if (tag === 'opensource') {
      return { id: 772, CollectiveId: 9805 }; // Open Source Host Collective
    } else {
      return { id: 7944, CollectiveId: 8674 }; // Open Collective Host Collective
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
  return false;
};

export function capitalize(str) {
  if (!str) return '';
  return str[0].toUpperCase() + str.slice(1);
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

export function formatArrayToString(arr) {
  return arr.join(', ').replace(/, ([^,]*)$/,' and $1');
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
 * @POST: "$10 and €60"
 */
export function formatCurrencyObject(currencyObj, options = { precision: 0 }) {
  const array = [];
  for (const currency in currencyObj) {
    array.push(formatCurrency(currencyObj[currency], currency, options.precision));
  }
  return formatArrayToString(array);
}

export function isUUID(str) {
  return (str.length === 36 && str.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
}