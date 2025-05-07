import { find, isEmpty, isUndefined, omit, pickBy } from 'lodash';

import type { TaxFormType } from '../components/dashboard/sections/tax-information/common';

import { CollectiveType } from './constants/collectives';
import { TransactionTypes } from './constants/transactions';
import type { Comment, Conversation, Expense, HostApplication, Order, Update } from './graphql/types/v2/schema';
import type LoggedInUser from './LoggedInUser';
import { getWebsiteUrl } from './utils';
import { getWindowLocation } from './window';

export const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL;
export const PDF_SERVICE_V2_URL = process.env.PDF_SERVICE_V2_URL;

// ---- Utils ----

/**
 * Transform an object into a query string. Strips undefined values.
 *
 * ## Example
 *
 *    > objectToQueryString({a: 42, b: "hello", c: undefined})
 *    "?a=42&b=hello"
 *
 * @deprecated Use `new URLSearchParams(options).toString()` instead
 */
const objectToQueryString = options => {
  const definedOptions = pickBy(options, value => value !== undefined);
  if (isEmpty(definedOptions)) {
    return '';
  }

  const encodeValue = value => {
    if (Array.isArray(value)) {
      return value.map(encodeURIComponent).join(',');
    }
    return encodeURIComponent(value);
  };

  return `?${Object.entries(definedOptions)
    .map(([key, value]) => `${key}=${encodeValue(value)}`)
    .join('&')}`;
};

// ---- Routes to other Open Collective services ----

export const collectiveInvoiceURL = (collectiveSlug, hostSlug, startDate, endDate, format) => {
  if (PDF_SERVICE_V2_URL) {
    return `${PDF_SERVICE_V2_URL}/receipts/period/${collectiveSlug}/${hostSlug}/${startDate}/${endDate}/receipt.${format}`;
  } else {
    return `${PDF_SERVICE_URL}/receipts/period/${collectiveSlug}/${hostSlug}/${startDate}/${endDate}/receipt.${format}`;
  }
};

export const transactionInvoiceURL = transactionUUID => {
  if (PDF_SERVICE_V2_URL) {
    return `${PDF_SERVICE_V2_URL}/receipts/transaction/${transactionUUID}/receipt.pdf`;
  } else {
    return `${PDF_SERVICE_URL}/receipts/transactions/${transactionUUID}/receipt.pdf`;
  }
};

export const expenseInvoiceUrl = expenseId => {
  if (PDF_SERVICE_V2_URL) {
    return `${PDF_SERVICE_V2_URL}/expenses/${expenseId}/invoice.pdf`;
  } else {
    return `${PDF_SERVICE_URL}/expense/${expenseId}/invoice.pdf`;
  }
};

/**
 * `POST` endpoint to generate printable gift cards.
 *
 * @param {string} filename - filename **with** extension
 */
export const giftCardsDownloadUrl = filename => {
  if (PDF_SERVICE_V2_URL) {
    return `${PDF_SERVICE_V2_URL}/gift-cards/${filename}`;
  } else {
    return `${PDF_SERVICE_URL}/giftcards/from-data/${filename}`;
  }
};

// ---- Routes to external services ----

/**
 * @param opts {object} With the following attributes:
 *  - text: Tweet text
 *  - url: A URL to share in the tweet
 *  - via: A Twitter username to associate with the Tweet, such as your site’s Twitter account (default: opencollect)
 */
export const tweetURL = opts => {
  return `https://x.com/intent/tweet${objectToQueryString({ via: 'opencollect', ...opts })}`;
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
  return `https://x.com/${twitterHandle}`;
};

/**
 * @param opts {object} With the following attributes:
 *  - text: The message to share
 */
export const blueSkyShareURL = opts => {
  return `https://bsky.app/intent/compose${objectToQueryString(opts)}`;
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
 * @param opts {object} With the following attributes:
 *  - text: The text to share
 */
export const threadsShareURL = opts => {
  return `https://threads.net/intent/post${objectToQueryString(opts)}`;
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

export const getDashboardRoute = (account, section = null) => {
  if (!account) {
    return '';
  }
  return `/dashboard/${account.slug}${section ? `/${section}` : ''}`;
};

export const getOauthAppSettingsRoute = (account, app) => {
  return getDashboardRoute(account, `for-developers/oauth/${app.id}`);
};

export const getPersonalTokenSettingsRoute = (account, token) => {
  return getDashboardRoute(account, `for-developers/personal-tokens/${token.id}`);
};

export const getOffPlatformTransactionsRoute = (hostSlug, importId = null) => {
  const base = `/dashboard/${hostSlug}/off-platform-transactions`;
  if (importId) {
    const params = new URLSearchParams();
    params.set('importIds', importId);
    return `${base}?${params.toString()}`;
  } else {
    return base;
  }
};

export const getCSVTransactionsImportRoute = (hostSlug, importId = null) => {
  const base = `/dashboard/${hostSlug}/ledger-csv-imports`;
  if (importId) {
    return `${base}/${importId}`;
  } else {
    return base;
  }
};

export const getCollectivePageCanonicalURL = account => {
  return getWebsiteUrl() + getCollectivePageRoute(account);
};

export const getCollectivePageRoute = (account: {
  slug: string;
  type?: string;
  parentCollective?: { slug?: string };
  parent?: { slug?: string };
}) => {
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

const TRUSTED_DOMAINS = [
  'octobox.io',
  'dotnetfoundation.org',
  'hopin.com',
  'app.papertree.earth',
  'sharedground.co',
  'gatherfor.org',
  'funds.ecosyste.ms',
];
const TRUSTED_ROOT_DOMAINS = ['opencollective.com', 'opencollective.foundation', 'oscollective.org'];

export const isTrustedRedirectURL = (url: URL) => {
  if (url.protocol !== 'https:') {
    return false;
  } else if (url.port && url.port !== '443') {
    return false;
  }

  const host = url.host;
  if (TRUSTED_DOMAINS.includes(host)) {
    return true;
  }

  return TRUSTED_ROOT_DOMAINS.some(domain => {
    return host === domain || host.endsWith(`.${domain}`);
  });
};

export const addParentToURLIfMissing = (router, account, url = '', queryParams = undefined, options = {}) => {
  if (
    [CollectiveType.EVENT, CollectiveType.PROJECT].includes(account?.type) &&
    !router.query.parentCollectiveSlug &&
    !(router.query.eventSlug && router.query.collectiveSlug)
  ) {
    const cleanUrl = url.split('?')[0];
    const urlWithParent = getCollectivePageRoute(account) + cleanUrl;
    const prefix = options?.['prefix'] || '';
    if (isUndefined(queryParams)) {
      queryParams = omit(router.query, ['parentCollectiveSlug', 'collectiveSlug', 'eventSlug']);
    }

    router.push({ pathname: `${prefix}${urlWithParent}`, query: queryParams }, null, { shallow: true });
  }
};

export const isRelativeHref = href => {
  if (!href) {
    return true;
  }

  // We force all relative URLs to start with `/`
  href = href.trim();
  if (!href.startsWith('/')) {
    return false;
  }

  // If we're in the browser, there's a safe way to check this
  const windowLocation = getWindowLocation();
  if (windowLocation) {
    try {
      const parsedUrl = new URL(href, windowLocation.origin);
      return parsedUrl.origin === windowLocation.origin;
    } catch {
      return false; // Invalid URL
    }
  }

  // Otherwise, we fallback on a regex that will protect against `javascript:`, `//evil.com`, etc.
  href = href.trim();
  return href.startsWith('#') || href === '/' || new RegExp('^/[^/\\\\]+').test(href);
};

export async function followOrderRedirectUrl(
  router,
  collective,
  order,
  redirectUrl,
  { shouldRedirectParent = false } = {},
) {
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
  if (isTrustedRedirectURL(url)) {
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

export const getFileExtensionFromUrl = url => {
  if (!url) {
    return null;
  }

  try {
    const urlObject = new URL(url);
    const pathParts = urlObject.pathname.split('.');
    return pathParts[pathParts.length - 1].toLowerCase();
  } catch {
    return null;
  }
};

export const getTaxFormPDFServiceUrl = (type: TaxFormType, values, { isFinal = false } = {}): string => {
  let url: URL;
  if (PDF_SERVICE_V2_URL) {
    url = new URL(`${PDF_SERVICE_V2_URL}/tax-forms/${type}.pdf`);
  } else {
    url = new URL(`${PDF_SERVICE_URL}/tax-form/${type}.pdf`);
  }

  const base64Values = Buffer.from(JSON.stringify(values)).toString('base64');
  url.searchParams.set('formType', type);
  url.searchParams.set('values', base64Values);
  url.searchParams.set('isFinal', isFinal.toString());
  return url.toString();
};

export const getExpensePageUrl = (expense: {
  account: Parameters<typeof getCollectivePageRoute>[0];
  legacyId: Expense['legacyId'];
}) => {
  return `${getCollectivePageRoute(expense.account)}/expenses/${expense.legacyId}`;
};

const getUpdatePageUrl = (update: Update) => {
  return `${getCollectivePageRoute(update.account)}/updates/${update.slug}`;
};

export const getUpdateUrl = (update: Update, loggedInUser: LoggedInUser) => {
  if (loggedInUser && loggedInUser.isAdminOfCollective(update.account)) {
    return `${getDashboardRoute(update.account, 'updates')}/${update.id}`;
  } else {
    return getUpdatePageUrl(update);
  }
};

const getOrderPageUrl = (order: Order) => {
  return `${getCollectivePageRoute(order.toAccount)}/contributions/${order.legacyId}`;
};

export const getOrderUrl = (order: Order, loggedInUser: LoggedInUser) => {
  if (loggedInUser) {
    if (loggedInUser.isAdminOfCollective(order.fromAccount)) {
      return `${getDashboardRoute(order.fromAccount, 'contributions')}?orderId=${order.id}`;
    } else if (loggedInUser.isAdminOfCollective(order.toAccount)) {
      return `${getDashboardRoute(order.toAccount, 'incoming-contributions')}?orderId=${order.id}`;
    }
  }

  return getOrderPageUrl(order);
};

const getConversationPageUrl = (conversation: Conversation) => {
  return `${getCollectivePageRoute(conversation.account)}/conversations/${conversation.slug}-${conversation.id}`;
};

const getHostApplicationDashboardUrl = (application: HostApplication, loggedInUser: LoggedInUser) => {
  if (loggedInUser.isAdminOfCollective(application.host) || loggedInUser.isHostAdmin(application.account)) {
    return `${getDashboardRoute(application.account, 'host-applications')}?hostApplicationId=${application.id}`;
  } else {
    return `${getDashboardRoute(application.account, 'host')}`;
  }
};

export const getCommentUrl = (comment: Comment, loggedInUser: LoggedInUser) => {
  const commentAnchor = `#comment-${new Date(comment.createdAt).getTime()}`;
  if (comment.update) {
    return `${getUpdatePageUrl(comment.update)}${commentAnchor}`;
  } else if (comment.conversation) {
    return `${getConversationPageUrl(comment.conversation)}${commentAnchor}`;
  } else if (comment.expense) {
    return `${getExpensePageUrl(comment.expense)}${commentAnchor}`;
  } else if (comment.order) {
    return `${getOrderPageUrl(comment.order)}${commentAnchor}`;
  } else if (comment.hostApplication) {
    return getHostApplicationDashboardUrl(comment.hostApplication, loggedInUser);
  } else {
    return getCollectivePageRoute(comment.account);
  }
};
