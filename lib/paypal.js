import { loadScriptAsync } from './utils';

/**
 * Legacy PayPal SDK
 */
const getLegacyPaypal = async () => {
  if (typeof window.paypal === 'undefined') {
    await loadScriptAsync('https://www.paypalobjects.com/api/checkout.js');
  }
  return window.paypal;
};

export { getLegacyPaypal };
