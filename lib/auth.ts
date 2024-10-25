import type Express from 'express';

import { LOCAL_STORAGE_KEYS, removeFromLocalStorage } from './local-storage';

export function logout() {
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.TWO_FACTOR_AUTH_TOKEN);
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.LAST_DASHBOARD_SLUG);
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.DASHBOARD_NAVIGATION_STATE);
  removeFromLocalStorage(LOCAL_STORAGE_KEYS.RECENTLY_VISITED);

  document.cookie = 'accessTokenPayload=;Max-Age=0;secure;path=/';
}

export function getTokenFromCookie(req: Express.Request) {
  return req?.cookies?.accessTokenPayload && req?.cookies?.accessTokenSignature
    ? [req.cookies.accessTokenPayload, req.cookies.accessTokenSignature].join('.')
    : null;
}
