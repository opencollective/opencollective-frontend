import { isEmpty } from 'lodash';
import type { NextPageContext } from 'next';

import { getEnvVar } from './env-utils';

export const WHITELABEL_DOMAINS: string[] = getEnvVar('WHITELABEL_DOMAINS')?.split(',') || [];

export type WhitelabelProps = {
  isNonPlatformDomain: boolean;
  origin: string;
  isWhitelabelDomain: boolean;
};

const getOrigin = (ctx: NextPageContext & { req: any }) => {
  return typeof window === 'undefined'
    ? ctx.req
      ? `${ctx.req.protocol}://${ctx.req.get('host')}`
      : undefined
    : window.location.origin;
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
