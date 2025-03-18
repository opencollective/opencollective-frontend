import { isEmpty } from 'lodash';

import { WHITELABEL_DOMAINS, WHITELABEL_PROVIDERS } from './constants/whitelabel-providers';
import type { Context } from './apollo-client';

export type WhitelabelProps = {
  isNonPlatformDomain: boolean;
  origin: string;
  isWhitelabelDomain: boolean;
  provider: (typeof WHITELABEL_PROVIDERS)[number];
  path?: string;
};

const getOrigin = (ctx?: Context) => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  } else if (ctx?.req?.headers) {
    const proto = ctx.req.headers['x-forwarded-proto'] || 'https';
    const hostname = ctx.req.headers['original-hostname'] || ctx.req.headers['host'];
    if (hostname) {
      return `${proto}://${hostname}`;
    }
  }
  return null;
};

const getPath = (ctx?: Context) => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  } else if (ctx?.req?.url) {
    const path = ctx.req.url;
    if (!path?.startsWith('/_next')) {
      return path;
    }
  }
  return null;
};

export const shouldRedirect = (hostSlug?: string, slug?: string) => {
  const provider = hostSlug && WHITELABEL_PROVIDERS.find(provider => provider.slug === hostSlug);
  if (provider) {
    return { domain: provider.domain, slug: slug || provider.slug };
  }
};

export const getWhitelabelProps = (ctx?: Context): WhitelabelProps => {
  const origin = getOrigin(ctx);
  if (!origin) {
    return null;
  }

  const path = getPath(ctx);

  const isNonPlatformDomain = !process.env.WEBSITE_URL.includes(origin);
  const isWhitelabelDomain = isEmpty(WHITELABEL_DOMAINS) ? false : WHITELABEL_DOMAINS.includes(origin);
  const provider = WHITELABEL_PROVIDERS.find(provider => provider.domain === origin);
  return { isNonPlatformDomain, origin, isWhitelabelDomain, path, provider };
};
