import Router from 'next/router';

import { IgnorableError } from './errors';

/**
 * Paths served by another application on the same domain (routed there by the
 * Cloudflare worker). Client-side navigation would render this app's own page
 * for them, so they always get a full page load.
 */
const FULL_PAGE_LOAD_PATHS = new Set<string>(['/phpfoundation', '/phpfoundation/contributors']);

export const requiresFullPageLoad = (url: string): boolean => {
  const { pathname } = new URL(url, 'https://opencollective.com');
  return FULL_PAGE_LOAD_PATHS.has(pathname.replace(/\/+$/, '').toLowerCase());
};

/** `routeChangeStart` handler: leaves the app for these paths and aborts the client-side navigation */
export const forceFullPageLoad = (url: string) => {
  if (requiresFullPageLoad(url)) {
    window.location.assign(url);
    Router.events.emit('routeChangeError'); // Stops the NProgress indicator if the user cancels the page unload
    throw new IgnorableError(`Full page load for ${url}`);
  }
};
