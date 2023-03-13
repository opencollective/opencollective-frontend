import { isEmpty, pickBy } from 'lodash';

import { CollectiveType } from './constants/collectives';
import { TransactionTypes } from './constants/transactions';
import { getWebsiteUrl } from './utils';

export const invoiceServiceURL = process.env.PDF_SERVICE_URL;

// ---- Utils ----

/**
 * Transform an object into a query string. Strips undefined values.
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
  return `${invoiceServiceURL}/receipts/collectives/${collectiveSlug}/${hostSlug}/${startDate}/${endDate}/receipt.${format}`;
};

export const transactionInvoiceURL = transactionUUID => {
  return `${invoiceServiceURL}/receipts/transactions/${transactionUUID}/receipt.pdf`;
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
 * @param opts {object} With the following attributes:
 *  - text: Toot text
 */
export const mastodonShareURL = opts => {
  return `https://toot.kytta.dev/${objectToQueryString({ ...opts })}`;
};

/**
 * Generate a URL from a twitter handle
 */
export const twitterProfileUrl = twitterHandle => {
  return `https://twitter.com/${twitterHandle}`;
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
 *  - source: The source of the content (e.g., your website or application name)
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

export const getSettingsRoute = (account, section = null) => {
  const parent = account.parentCollective || account.parent;
  const adminPath = section ? `${account.slug}/admin/${section}` : `${account.slug}/admin`;

  if (parent) {
    if (account.type === CollectiveType.EVENT) {
      return `/${parent?.slug || 'collective'}/events/${adminPath}`;
    } else if (account.type === CollectiveType.PROJECT) {
      return `/${parent?.slug || 'collective'}/projects/${adminPath}`;
    }
  }

  return `/${adminPath}`;
};

export const getOauthAppSettingsRoute = (account, app) => {
  return getSettingsRoute(account, `for-developers/oauth/${app.id}`);
};

export const getPersonalTokenSettingsRoute = (account, token) => {
  return getSettingsRoute(account, `for-developers/personal-tokens/${token.id}`);
};

export const getCollectivePageCanonicalURL = account => {
  return getWebsiteUrl() + getCollectivePageRoute(account);
};

export const getCollectivePageRoute = account => {
  if (!account) {
    return '';
  } else if (account.type === CollectiveType.EVENT) {
    const parent = account.parentCollective || account.parent;
    return `/${parent?.slug || 'collective'}/events/${account.slug}`;
  } else if (account.type === CollectiveType.PROJECT) {
    const parent = account.parentCollective || account.parent;
    return `/${parent?.slug || 'collective'}/projects/${account.slug}`;
  } else {
    return `/${account.slug}`;
  }
};

const TRUSTED_DOMAINS = ['octobox.io', 'dotnetfoundation.org', 'hopin.com', 'app.papertree.earth', 'sharedground.co'];
const TRUSTED_ROOT_DOMAINS = ['opencollective.com', 'opencollective.foundation', 'oscollective.org'];

export const isTrustedRedirectHost = host => {
  if (TRUSTED_DOMAINS.includes(host)) {
    return true;
  }

  return TRUSTED_ROOT_DOMAINS.some(domain => {
    return host === domain || host.endsWith(`.${domain}`);
  });
};

export const addParentToURLIfMissing = (router, account, url = '', queryParams = undefined, options = {}) => {
  const query = router.query;
  if (
    [CollectiveType.EVENT, CollectiveType.PROJECT].includes(account?.type) &&
    !query.parentCollectiveSlug &&
    !(router.query.eventSlug && router.query.collectiveSlug)
  ) {
    const urlWithParent = getCollectivePageRoute(account) + url;
    const prefix = options?.prefix || '';
    router.push({ pathname: `${prefix}${urlWithParent}`, query: queryParams }, null, { shallow: true });
  }
};

export const isRelativeHref = href => {
  href = href.trim();
  return !href || href.startsWith('#') || href === '/' || new RegExp('^/[^/\\\\]+').test(href);
};

export async function followOrderRedirectUrl(router, collective, order, redirectUrl, { shouldRedirectParent } = {}) {
  const url = new URL(redirectUrl);
  url.searchParams.set('orderId', order.legacyId);
  url.searchParams.set('orderIdV2', order.id);
  url.searchParams.set('status', order.status);
  const transaction = find(order.transactions, { type: TransactionTypes.CREDIT });
  if (transaction) {
    url.searchParams.set('transactionid', transaction.legacyId);
    url.searchParams.set('transactionIdV2', transaction.id);
  }

  const fallback = `/${collective.slug}/donate/success?OrderId=${order.id}`;
  if (isTrustedRedirectHost(url.host)) {
    if (shouldRedirectParent) {
      window.parent.location.href = url.href;
    } else {
      window.location.href = url.href;
    }
  } else {
    router.push({
      pathname: '/external-redirect',
      query: { url: url.href, fallback, shouldRedirectParent },
    });
  }

  return url;
}
