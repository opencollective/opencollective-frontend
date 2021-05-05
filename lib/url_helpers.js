import { isEmpty, pickBy } from 'lodash';

import { CollectiveType } from './constants/collectives';

export const invoiceServiceURL = process.env.PDF_SERVICE_URL;

// ---- Utils ----

/**
 * Transorm an object into a query string. Strips undefined values.
 *
 * ## Example
 *
 *    > objectToQueryString({a: 42, b: "hello", c: undefined})
 *    "?a=42&b=hello"
 */
export const objectToQueryString = options => {
  const definedOptions = pickBy(options, value => value !== undefined);
  if (isEmpty(definedOptions)) {
    return '';
  }

  const encodeValue = value => {
    if (Array.isArray(value)) {
      return value.concat.map(encodeURIComponent).join(',');
    }
    return encodeURIComponent(value);
  };

  return `?${Object.entries(definedOptions)
    .map(([key, value]) => `${key}=${encodeValue(value)}`)
    .join('&')}`;
};

// ---- Routes to other Open Collective services ----

export const collectiveInvoiceURL = (collectiveSlug, hostSlug, startDate, endDate, format) => {
  return `${invoiceServiceURL}/collectives/${collectiveSlug}/${hostSlug}/${startDate}/${endDate}.${format}`;
};

export const transactionInvoiceURL = transactionUUID => {
  return `${invoiceServiceURL}/transactions/${transactionUUID}/invoice.pdf`;
};

export const expenseInvoiceUrl = expenseId => {
  return `${invoiceServiceURL}/expense/${expenseId}/invoice.pdf`;
};

/**
 * `POST` endpoint to generate printable gift cards.
 *
 * @param {string} filename - filename **with** extension
 */
export const giftCardsDownloadUrl = filename => {
  return `${invoiceServiceURL}/giftcards/from-data/${filename}`;
};

// ---- Routes to external services ----

/**
 * @param opts {object} With the following attributes:
 *  - text: Tweet text
 *  - url: A URL to share in the tweet
 *  - via: A Twitter username to associate with the Tweet, such as your site’s Twitter account (default: opencollect)
 */
export const tweetURL = opts => {
  return `https://twitter.com/intent/tweet${objectToQueryString({ via: 'opencollect', ...opts })}`;
};

/**
 * Generate a URL from a twitter handle
 */
export const twitterProfileUrl = twitterHandle => {
  return `https://twitter.com/${twitterHandle}`;
};

/**
 * Generate a URL from a Github handle
 */
export const githubProfileUrl = githubHandle => {
  return `https://github.com/${githubHandle}`;
};

/**
 * @param opts {object} With the following attributes:
 *  - u: A URL to share in the tweet
 */
export const facebookShareURL = opts => {
  return `https://www.facebook.com/sharer/sharer.php${objectToQueryString(opts)}`;
};

/**
 * @param opts {object} With the following attributes:
 *  - url: The URL of the page that you wish to share.
 *  - title: The title value that you wish you use.
 *  - summary: The description that you wish you use.
 *  - source: The source of the content (e.g. your website or application name)
 *  - mini: A required argument whose value must always be true (default: true)
 */
export const linkedInShareURL = opts => {
  return `https://www.linkedin.com/shareArticle${objectToQueryString({ mini: 'true', ...opts })}`;
};

/**
 * @param address {string} the recipien email (default: '')
 * @param opts {object} With the following attributes:
 *  - cc
 *  - subject
 *  - body
 */
export const mailToURL = (address = '', opts) => {
  return `mailto://${address}${objectToQueryString(opts)}`;
};

export const getSettingsRoute = account => {
  if (account.type === CollectiveType.EVENT) {
    const parent = account.parentCollective || account.parent;
    return `/${parent?.slug || 'collective'}/events/${account.slug}/edit`;
  } else {
    return `/${account.slug}/edit`;
  }
};
