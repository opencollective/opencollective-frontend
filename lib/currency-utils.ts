import getSymbolFromCurrency from 'currency-symbol-map';
import { isNil, round } from 'lodash';

import { CurrencyPrecision } from './constants/currency-precision';
import { Amount, Currency } from './graphql/types/v2/graphql';

export type Options = {
  locale?: string;
  minimumFractionDigits?: number;
  precision?: number;
};

function getCurrencySymbolFallback(currency: Currency): string {
  return Number(0)
    .toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/(^0\s?)|(\s?0$)/, '');
}

export function getCurrencySymbol(currency: Currency): string {
  return getSymbolFromCurrency(currency) || getCurrencySymbolFallback(currency);
}

export const getPrecisionFromAmount = (amount: number): number => {
  return amount.toString().slice(-2) === '00' ? 0 : CurrencyPrecision.DEFAULT;
};

export function graphqlAmountValueInCents(amount: Amount | number | null): number | null {
  if (isNil(amount)) {
    return amount;
  }

  // GQLV2 is an object
  if (typeof amount === 'object') {
    return amount?.valueInCents;
  }
  // GQLV2 is already a value in cents
  return amount;
}

export function formatCurrency(
  amount: Amount | number | null,
  currency: Currency = Currency.USD,
  options: Options = {},
): string {
  if (isNil(amount)) {
    return '--';
  }

  // Compatibility with amounts from GQLV2
  if (typeof amount === 'object') {
    currency = amount.currency || currency;
    if (!isNil(amount.valueInCents)) {
      amount = amount.valueInCents;
    } else if (!isNil(amount.value)) {
      amount = Math.round(amount.value * 100);
    } else {
      return '--';
    }
  }

  amount = amount / 100;
  let minimumFractionDigits = 2;
  let maximumFractionDigits = 2;
  if (Object.prototype.hasOwnProperty.call(options, 'minimumFractionDigits')) {
    minimumFractionDigits = options.minimumFractionDigits;
  } else if (Object.prototype.hasOwnProperty.call(options, 'precision')) {
    minimumFractionDigits = options.precision;
    maximumFractionDigits = options.precision;
  }

  const formatAmount = (currencyDisplay: string): string => {
    return amount.toLocaleString(options.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: maximumFractionDigits,
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

export const formatValueAsCurrency = (value: Amount, options: Options): string =>
  formatCurrency(value.valueInCents || value.value * 100, value.currency, options);

export const floatAmountToCents = (floatAmount: number | null): number | null => {
  if (isNaN(floatAmount) || floatAmount === null) {
    return floatAmount;
  } else {
    return Math.round(floatAmount * 100);
  }
};

export const centsAmountToFloat = (amount: number | null): number | null => {
  if (isNaN(amount) || isNil(amount)) {
    return null;
  } else {
    return round(amount / 100, 2);
  }
};

/**
 * Small helper to get the value in cents from an amount, works with GQLV1 & GQLV2
 */
export const getAmountInCents = (amount: Amount | number | null): number | null => {
  if (amount === null) {
    return null;
  } else if (typeof amount === 'number') {
    return amount;
  } else if (typeof amount === 'object') {
    if (!isNil(amount.valueInCents)) {
      return amount.valueInCents;
    } else if (!isNil(amount.value)) {
      return Math.round(amount.value * 100);
    }
  }

  return null;
};
