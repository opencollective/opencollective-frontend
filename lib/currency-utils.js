import getSymbolFromCurrency from 'currency-symbol-map';
import { isNil, round } from 'lodash';

import { CurrencyPrecision, ZeroDecimalCurrencies } from './constants/currency-precision';

function getCurrencySymbolFallback(currency) {
  return Number(0)
    .toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/(^0\s?)|(\s?0$)/, '');
}

export function getCurrencySymbol(currency) {
  return getSymbolFromCurrency(currency) || getCurrencySymbolFallback(currency);
}

export const getPrecisionFromAmount = amount => {
  return amount.toString().slice(-2) === '00' ? 0 : CurrencyPrecision.DEFAULT;
};

export const getPrecisionForCurrency = currency => {
  if (ZeroDecimalCurrencies.includes(currency)) {
    return 0;
  }

  return CurrencyPrecision.DEFAULT;
};

export const getStepForCurrency = currency => {
  const precision = getPrecisionForCurrency(currency);
  return 1 / Math.pow(10, precision);
};

export function formatCurrency(amount, currency = 'USD', options = {}) {
  amount = amount / 100;
  let minimumFractionDigits;
  let maximumFractionDigits;
  if (Object.prototype.hasOwnProperty.call(options, 'minimumFractionDigits')) {
    minimumFractionDigits = options.minimumFractionDigits;
  } else if (Object.prototype.hasOwnProperty.call(options, 'precision')) {
    minimumFractionDigits = options.precision;
    maximumFractionDigits = options.precision;
  }

  if (ZeroDecimalCurrencies.includes(currency) && amount >= 100) {
    minimumFractionDigits = 0;
    maximumFractionDigits = 0;
  }

  const formatAmount = currencyDisplay => {
    return amount.toLocaleString(options.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
      currencyDisplay,
    });
  };

  try {
    // We manually add the exact currency (e.g. "$10 USD") in many places. This is to prevent
    // showing the currency twice is some locales ($US10 USD)
    return formatAmount('narrowSymbol');
  } catch (e) {
    // ... unfortunately, some old versions of Safari doesn't support it, so we need a fallback
    return formatAmount('symbol');
  }
}

export const formatValueAsCurrency = (value, options) =>
  formatCurrency(value.valueInCents || value.value * 100, value.currency, options);

export const floatAmountToCents = floatAmount => {
  if (isNaN(floatAmount) || floatAmount === null) {
    return floatAmount;
  } else {
    return Math.round(floatAmount * 100);
  }
};

export const centsAmountToFloat = amount => {
  if (isNaN(amount) || amount === null) {
    return amount;
  } else {
    return round(amount / 100, 2);
  }
};

/**
 * Small helper to get the value in cents from an amount, works with GQLV1 & GQLV2
 * @param {number|object} amount
 * @returns
 */
export const getAmountInCents = amount => {
  if (amount === null) {
    return amount;
  } else if (typeof amount === 'number') {
    return amount;
  } else if (typeof amount === 'object') {
    if (!isNil(amount.valueInCents)) {
      return amount.valueInCents;
    } else if (!isNil(amount.value)) {
      return Math.round(amount.value * 100);
    }
  }

  return amount;
};
