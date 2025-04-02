import { isEmpty } from 'lodash';

import { WHITELABEL_DOMAINS, WHITELABEL_PROVIDERS } from './constants/whitelabel-providers';
import type { Context } from './apollo-client';

const WEBSITE_URL = process.env.WEBSITE_URL;

const getURL = (base: string, path: string) => new URL(path, base).href;

export type WhitelabelProps = {
  isNonPlatformDomain: boolean;
  origin: string;
  isWhitelabelDomain: boolean;
  provider: (typeof WHITELABEL_PROVIDERS)[number];
  path?: string;
};

const getOriginAndPath = (ctx?: Context) => {
  if (typeof window !== 'undefined') {
    return { origin: window.location.origin, path: window.location.pathname };
  } else {
    let origin, path;
    if (ctx?.req?.headers) {
      const proto = ctx.req.headers['x-forwarded-proto'] || 'https';
      const hostname = ctx.req.headers['original-hostname'] || ctx.req.headers['host'];
      if (hostname) {
        origin = `${proto}://${hostname}`;
      }
    }
    if (ctx?.req?.url && !ctx.req.url.startsWith('/_next')) {
      path = ctx.req.url;
    }
    return { origin, path };
  }
};

/**
 * Provides seemless redirections URLs between whitelabel domains and the platform.
 */
export const getWhitelabelRedirection = (
  ctx: Context,
  account?: { settings?: { whitelabelDomain?: string }; slug: string },
): string | void => {
  if (!account) {
    return;
  }
  const { isWhitelabelDomain, isNonPlatformDomain } = getWhitelabelProps(ctx);

  const accountDomain = account?.settings?.whitelabelDomain;
  if (!isWhitelabelDomain && accountDomain && WHITELABEL_DOMAINS.includes(accountDomain)) {
    return getURL(account.settings.whitelabelDomain, account.slug);
  } else if (isWhitelabelDomain && !accountDomain && isNonPlatformDomain) {
    return getURL(WEBSITE_URL, account.slug);
  }
};

export const getWhitelabelProps = (ctx?: Context): WhitelabelProps => {
  const { origin, path } = getOriginAndPath(ctx);
  if (!origin) {
    return null;
  }

  const isNonPlatformDomain = !WEBSITE_URL.includes(origin);
  const isWhitelabelDomain = isEmpty(WHITELABEL_DOMAINS) ? false : WHITELABEL_DOMAINS.includes(origin);
  const provider = WHITELABEL_PROVIDERS.find(provider => provider.domain === origin);
  return { origin, path, provider, isNonPlatformDomain, isWhitelabelDomain };
};
