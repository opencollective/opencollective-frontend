import getSymbolFromCurrency from 'currency-symbol-map';
import { round } from 'lodash';

import { CurrencyPrecision } from './constants/currency-precision';

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
