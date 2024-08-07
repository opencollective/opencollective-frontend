import { isEqual } from 'lodash';

import { loadScriptAsync } from './utils';

let latestPayPalParams = {};

/**
 * Unlike the previous SDK, we need to pass some info about the contribution
 * when we load the script, which implies that we have to reload it when one of the parameters
 * changes.
 */
const mustReloadScript = params => {
  return !isEqual(params, latestPayPalParams);
};

/**
 * New PayPal SDK
 *
 * @param params {object}:
 *    - clientId {string}
 *    - currency {string}
 *    - intent {capture|subscription}
 */
const getPaypal = async params => {
  if (typeof window.paypal === 'undefined' || mustReloadScript(params)) {
    // Remove existing script if there's one
    document.querySelectorAll('script[src^="https://www.paypal.com/sdk/js"]').forEach(node => node.remove());
    window.paypal = null;

    // Load new script
    const url = new URL('https://www.paypal.com/sdk/js');
    url.searchParams.set('client-id', params.clientId);
    url.searchParams.set('currency', params.currency);
    url.searchParams.set('intent', params.intent);
    url.searchParams.set('vault', 'true');
    await loadScriptAsync(url.href, { attrs: { 'data-csp-nonce': window.__NEXT_DATA__.cspNonce } });
    latestPayPalParams = params;
  }

  return window.paypal;
};

export { getPaypal };
