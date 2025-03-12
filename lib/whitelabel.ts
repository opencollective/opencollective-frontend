import { isEmpty } from 'lodash';
import type { NextPageContext } from 'next';

import { getEnvVar } from './env-utils';

export const WHITELABEL_DOMAINS: string[] = getEnvVar('WHITELABEL_DOMAINS')?.split(',') || [];

export type WhitelabelProps = {
  isNonPlatformDomain: boolean;
  origin: string;
  isWhitelabelDomain: boolean;
};

const getOrigin = (ctx: NextPageContext) => {
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

export const getWhitelabelProps = (ctx: NextPageContext & { req: any }): WhitelabelProps => {
  const origin = getOrigin(ctx);
  if (!origin) {
    return null;
  }

  const isNonPlatformDomain = !process.env.WEBSITE_URL.includes(origin);
  const isWhitelabelDomain = isEmpty(WHITELABEL_DOMAINS) ? false : WHITELABEL_DOMAINS.includes(origin);
  return { isNonPlatformDomain, origin, isWhitelabelDomain };
};
