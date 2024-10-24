import type Express from 'express';

import { getFromLocalStorage, LOCAL_STORAGE_KEYS, removeFromLocalStorage } from './local-storage';

const env = process.env.OC_ENV;

export function logout() {
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN);
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.LAST_DASHBOARD_SLUG);
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_NAVIGATION_STATE);
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.RECENTLY_VISITED);

  document.cookie = 'accessTokenPayload=;Max-Age=0;secure;path=/';
}

/**
 * Set rest domain authorization cookie with the current access token.
 */
export function setRestAuthorizationCookie() {
  const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  if (typeof document !== 'undefined' && accessToken) {
    const domain = new URL(process.env.REST_URL || 'https://rest.opencollective.com').hostname;
    document.cookie =
      env === 'development' || env === 'e2e'
        ? `authorization="Bearer ${accessToken}";path=/;SameSite=strict;max-age=120`
        : // It is not possible to use HttpOnly when setting from JavaScript.
          // I'm enforcing SameSite and Domain in production to prevent CSRF.
          `authorization="Bearer ${accessToken}";path=/;SameSite=strict;max-age=120;domain=${domain};secure`;
  }
}

export function getTokenFromCookie(req: Express.Request) {
  return req?.cookies?.accessTokenPayload && req?.cookies?.accessTokenSignature
    ? [req.cookies.accessTokenPayload, req.cookies.accessTokenSignature].join('.')
    : null;
}
