import { loadScriptAsync } from './utils';

const getPaypal = async () => {
  if (typeof window.paypal === 'undefined') {
    await loadScriptAsync('https://www.paypalobjects.com/api/checkout.js');
  }
  return window.paypal;
};

export { getPaypal };
