import { loadScriptAsync } from './utils';

export const getBraintree = async () => {
  if (typeof window.braintree === 'undefined') {
    // No need to await for data-collector
    loadScriptAsync('https://js.braintreegateway.com/web/3.71.0/js/data-collector.min.js');
    await loadScriptAsync('https://js.braintreegateway.com/web/dropin/1.26.0/js/dropin.min.js');
  }

  return window.braintree;
};
