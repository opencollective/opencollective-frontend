import { isEqual } from 'lodash';

import { loadScriptAsync } from './utils';

let latestPayPalParams = {};

/**
 * Unlike the previous SDK, we need to pass some info about the contribution
 * when we load the script, which implies that we have to reload it when one of the parameters
 * changes.
 */
const mustReloadScript = params => {
  return isEqual(params, latestPayPalParams);
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
    const url = new URL('https://www.paypal.com/sdk/js');
    url.searchParams.set('client-id', params.clientId);
    url.searchParams.set('currency', params.currency);
    url.searchParams.set('intent', params.intent);
    url.searchParams.set('disable-funding', 'credit,card');
    url.searchParams.set('vault', 'true');
    await loadScriptAsync(url.href);
    latestPayPalParams = params;
  }

  return window.paypal;
};

export { getPaypal };
