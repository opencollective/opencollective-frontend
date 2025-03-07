import { isEmpty } from 'lodash';
import type { NextPageContext } from 'next';

import { getEnvVar } from './env-utils';

export const AUHTORIZED_DOMAINS: string[] = getEnvVar('WHITELABEL_DOMAINS')?.split(',') || [];

export type WhitelabelProps = {
  isWhitelabel: boolean;
  origin: string;
  isAuthorizedDomain: boolean;
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

  const isWhitelabel = !process.env.WEBSITE_URL.includes(origin);
  const isAuthorizedDomain = isEmpty(AUHTORIZED_DOMAINS) ? false : AUHTORIZED_DOMAINS.includes(origin);
  return { isWhitelabel, origin, isAuthorizedDomain };
};
