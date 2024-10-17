import { Currency as CurrencyEnum } from '../graphql/types/v2/graphql';

export const Currency = Object.values(CurrencyEnum);

export const ZERO_DECIMAL_CURRENCIES = [
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
];

/*
 * Supported Currencies by PayPal for use with payments and as currency balances.
 * Reference: https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/
 *
 * TODO: There's few currencies (see above list) which decimal amounts are not supported or for in-country
 *  payouts only. We need to investigate and add support for these if possible.
 *
 */
export const PayPalSupportedCurrencies = [
  'AUD',
  'CAD',
  'CZK',
  'DKK',
  'EUR',
  'HKD',
  'ILS',
  'MXN',
  'NZD',
  'NOK',
  'PHP',
  'PLN',
  'GBP',
  'RUB',
  'SGD',
  'SEK',
  'CHF',
  'THB',
  'USD',
];
