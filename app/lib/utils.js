/**
 * Dependencies
 */
var Url = require('url');
var _ = require('lodash');


/**
 * Private methods.
 */

/**
 * Get current Url.
 */
var getRequestedUrl = function(req) {
  return req.protocol + '://' + req.get('Host') + req.url;
};

/**
 * Add parameters to an url.
 */
var addParameterUrl = function(url, parameters) {
  var parsedUrl  = Url.parse(url, true);

  function removeTrailingChar(str, char) {
    if(str.substr(-1) === char) {
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
 * Get links for pagination.
 */
var getLinks = function(url, options) {
  var page = options.page || paginatePage(options.offset, options.limit).page;
  var per_page = options.per_page || paginatePage(options.offset, options.limit).per_page;

  if (!page && !per_page)
    return null;

  var links = {
      next: addParameterUrl(url, {page: page+1, per_page: per_page})
    , current: addParameterUrl(url, {page: page, per_page: per_page})
  };
  if (page > 1) {
    links.prev = addParameterUrl(url, {page: page-1, per_page: per_page});
    links.first = addParameterUrl(url, {page: 1, per_page: per_page});
  }
  if (options.total) {
    var lastPage = Math.ceil(options.total / per_page);
    links.last = addParameterUrl(url, {page: lastPage, per_page: per_page});
    if (page >=lastPage)
      delete links.next;
  }
  return links;
};

/**
 * Pagination: from (offset, limit) to (page, per_page).
 */
var paginatePage = function(offset, limit) {
  return {
      page: Math.floor(offset/limit + 1)
    , per_page: limit
  }
};

/**
 * Public methods.
 */
module.exports = {

  /**
   * Pagination offset: from (page,per_page) to (offset, limit).
   */
  paginateOffset: function(page, per_page) {
    return {
        offset: (page - 1) * per_page
      , limit: per_page
    }
  },

  getRequestedUrl: getRequestedUrl,

  addParameterUrl: addParameterUrl,

  getLinks: getLinks,

  /**
   * Get headers for pagination.
   */
  getLinkHeader: function(url, options) {
    var links = getLinks(url, options)
      , header = ''
      , k = 0;
    for (var i in links) {
      header += ( (k!==0) ? ', ' : '' ) + '<' + links[i] + '>; rel="' + i + '"';
      k += 1;
    }
    return header;
  },

}
