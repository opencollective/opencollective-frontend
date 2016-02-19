/**
 * Dependencies
 */
const Url = require('url');
const config = require('config');
const crypto = require('crypto');
const base64url = require('base64url');

/**
 * Private methods.
 */

/**
 * Encrypt with resetPasswordSecret
 */
const encrypt = (text) => {
  var cipher = crypto.createCipher('aes-256-cbc', config.keys.opencollective.resetPasswordSecret)
  var crypted = cipher.update(text, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}

/**
 * Descript wih resetPasswordSecret
 */
const decrypt = (text) => {
  var decipher = crypto.createDecipher('aes-256-cbc', config.keys.opencollective.resetPasswordSecret)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

/**
 * Generate a secured token that works inside URLs
 * http://stackoverflow.com/a/25690754
 */
const generateURLSafeToken = size => base64url(crypto.randomBytes(size));

/**
 * Get current Url.
 */
const getRequestedUrl = (req) => {
  return req.protocol + '://' + req.get('Host') + req.url;
};

/**
 * Add parameters to an url.
 */
const addParameterUrl = (url, parameters) => {
  var parsedUrl  = Url.parse(url, true);

  function removeTrailingChar(str, char) {
    if (str.substr(-1) === char) {
      return str.substr(0, str.length - 1);
    }

    return str;
  }

  parsedUrl.pathname = removeTrailingChar(parsedUrl.pathname, '/');

  delete parsedUrl.search; // Otherwise .search in used in place of .query
  for (var p in parameters) {
    var param = parameters[p];
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
const getLinks = (url, options) => {
  var page = options.page || paginatePage(options.offset, options.limit).page;
  var perPage = options.perPage || paginatePage(options.offset, options.limit).perPage;

  if (!page && !perPage)
    return null;

  var links = {
    next: addParameterUrl(url, {page: page + 1, per_page: perPage}),
    current: addParameterUrl(url, {page: page, per_page: perPage})
  };
  if (page > 1) {
    links.prev = addParameterUrl(url, {page: page - 1, per_page: perPage});
    links.first = addParameterUrl(url, {page: 1, per_page: perPage});
  }

  if (options.total) {
    var lastPage = Math.ceil(options.total / perPage);
    links.last = addParameterUrl(url, {page: lastPage, per_page: perPage});
    if (page >= lastPage)
      delete links.next;
  }

  return links;
};

/**
 * Get headers for pagination.
 */
const getLinkHeader = (url, options) => {
  var links = getLinks(url, options);
  var header = '';
  var k = 0;
  for (var i in links) {
    header += ((k !== 0) ? ', ' : '') + '<' + links[i] + '>; rel="' + i + '"';
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
const planId = (plan) =>  {
  return [plan.currency, plan.interval, plan.amount].join('-').toUpperCase();
};

/**
 * Pagination offset: from (page,per_page) to (offset, limit).
 */
const paginateOffset = (page, perPage) => {
  return {
    offset: (page - 1) * perPage,
    limit: perPage
  }
};

/**
 * Try to find in which tier a backer falls into based on the tiers definition
 */
const getTier = (backer, tiers) => {

  if(!backer.totalDonations) return null;
  if(!tiers) return null;

  // We order the tiers by start range DESC
  tiers.sort((a,b) => { return a.range[0] < b.range[0]; });

  for (var i=0;i<tiers.length;i++) {
    if(backer.totalDonations >= tiers[i].range[0]) return tiers[i].name;
  }

  return null;

};

/**
 * Export public methods.
 */
module.exports = {
  paginateOffset,
  getRequestedUrl,
  addParameterUrl,
  getLinks,
  generateURLSafeToken,
  getLinkHeader,
  planId,
  encrypt,
  getTier,
  decrypt
}
