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

export const shouldRedirect = (account: { settings?: { whitelabelDomain?: string }; slug: string }) => {
  if (account?.settings?.whitelabelDomain && WHITELABEL_DOMAINS.includes(account.settings.whitelabelDomain)) {
    return `${account.settings.whitelabelDomain}/${account.slug}`;
  }
};

export const getWhitelabelProps = (ctx?: Context): WhitelabelProps => {
  const { origin, path } = getOriginAndPath(ctx);
  if (!origin) {
    return null;
  }

  const isNonPlatformDomain = !process.env.WEBSITE_URL.includes(origin);
  const isWhitelabelDomain = isEmpty(WHITELABEL_DOMAINS) ? false : WHITELABEL_DOMAINS.includes(origin);
  const provider = WHITELABEL_PROVIDERS.find(provider => provider.domain === origin);
  return { origin, path, provider, isNonPlatformDomain, isWhitelabelDomain };
};
