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

export const CurrencyToCountry = [
  {
    countryISO: 'AD',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'AE',
    currencyISO: 'AED',
  },
  {
    countryISO: 'AF',
    currencyISO: 'AFN',
  },
  {
    countryISO: 'AG',
    currencyISO: 'XCD',
  },
  {
    countryISO: 'AI',
    currencyISO: 'XCD',
  },
  {
    countryISO: 'AL',
    currencyISO: 'ALL',
  },
  {
    countryISO: 'AM',
    currencyISO: 'AMD',
  },
  {
    countryISO: 'AO',
    currencyISO: 'AOA',
  },
  {
    countryISO: 'AQ',
    currencyISO: null,
  },
  {
    countryISO: 'AR',
    currencyISO: 'ARS',
  },
  {
    countryISO: 'AS',
    currencyISO: 'USD',
  },
  {
    countryISO: 'AT',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'AU',
    currencyISO: 'AUD',
  },
  {
    countryISO: 'AW',
    currencyISO: 'AWG',
  },
  {
    countryISO: 'AX',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'AZ',
    currencyISO: 'AZN',
  },
  {
    countryISO: 'BA',
    currencyISO: 'BAM',
  },
  {
    countryISO: 'BB',
    currencyISO: 'BBD',
  },
  {
    countryISO: 'BD',
    currencyISO: 'BDT',
  },
  {
    countryISO: 'BE',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'BF',
    currencyISO: 'XOF',
  },
  {
    countryISO: 'BG',
    currencyISO: 'BGN',
  },
  {
    countryISO: 'BH',
    currencyISO: 'BHD',
  },
  {
    countryISO: 'BI',
    currencyISO: 'BIF',
  },
  {
    countryISO: 'BJ',
    currencyISO: 'XOF',
  },
  {
    countryISO: 'BL',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'BM',
    currencyISO: 'BMD',
  },
  {
    countryISO: 'BN',
    currencyISO: 'BND',
  },
  {
    countryISO: 'BO',
    currencyISO: 'BOB',
  },
  {
    countryISO: 'BQ',
    currencyISO: 'USD',
  },
  {
    countryISO: 'BR',
    currencyISO: 'BRL',
  },
  {
    countryISO: 'BS',
    currencyISO: 'BSD',
  },
  {
    countryISO: 'BT',
    currencyISO: 'BTN',
  },
  {
    countryISO: 'BV',
    currencyISO: 'NOK',
  },
  {
    countryISO: 'BW',
    currencyISO: 'BWP',
  },
  {
    countryISO: 'BY',
    currencyISO: 'BYN',
  },
  {
    countryISO: 'BZ',
    currencyISO: 'BZD',
  },
  {
    countryISO: 'CA',
    currencyISO: 'CAD',
  },
  {
    countryISO: 'CC',
    currencyISO: 'AUD',
  },
  {
    countryISO: 'CD',
    currencyISO: 'CDF',
  },
  {
    countryISO: 'CF',
    currencyISO: 'XAF',
  },
  {
    countryISO: 'CG',
    currencyISO: 'XAF',
  },
  {
    countryISO: 'CH',
    currencyISO: 'CHF',
  },
  {
    countryISO: 'CI',
    currencyISO: 'XOF',
  },
  {
    countryISO: 'CK',
    currencyISO: 'NZD',
  },
  {
    countryISO: 'CL',
    currencyISO: 'CLP',
  },
  {
    countryISO: 'CM',
    currencyISO: 'XAF',
  },
  {
    countryISO: 'CN',
    currencyISO: 'CNY',
  },
  {
    countryISO: 'CO',
    currencyISO: 'COP',
  },
  {
    countryISO: 'CR',
    currencyISO: 'CRC',
  },
  {
    countryISO: 'CU',
    currencyISO: 'CUP',
  },
  {
    countryISO: 'CV',
    currencyISO: 'CVE',
  },
  {
    countryISO: 'CW',
    currencyISO: 'ANG',
  },
  {
    countryISO: 'CX',
    currencyISO: 'AUD',
  },
  {
    countryISO: 'CY',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'CZ',
    currencyISO: 'CZK',
  },
  {
    countryISO: 'DE',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'DJ',
    currencyISO: 'DJF',
  },
  {
    countryISO: 'DK',
    currencyISO: 'DKK',
  },
  {
    countryISO: 'DM',
    currencyISO: 'XCD',
  },
  {
    countryISO: 'DO',
    currencyISO: 'DOP',
  },
  {
    countryISO: 'DZ',
    currencyISO: 'DZD',
  },
  {
    countryISO: 'EC',
    currencyISO: 'USD',
  },
  {
    countryISO: 'EE',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'EG',
    currencyISO: 'EGP',
  },
  {
    countryISO: 'EH',
    currencyISO: 'MAD',
  },
  {
    countryISO: 'ER',
    currencyISO: 'ERN',
  },
  {
    countryISO: 'ES',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'ET',
    currencyISO: 'ETB',
  },
  {
    countryISO: 'FI',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'FJ',
    currencyISO: 'FJD',
  },
  {
    countryISO: 'FK',
    currencyISO: 'FKP',
  },
  {
    countryISO: 'FM',
    currencyISO: 'USD',
  },
  {
    countryISO: 'FO',
    currencyISO: 'DKK',
  },
  {
    countryISO: 'FR',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'GA',
    currencyISO: 'XAF',
  },
  {
    countryISO: 'GB',
    currencyISO: 'GBP',
  },
  {
    countryISO: 'GD',
    currencyISO: 'XCD',
  },
  {
    countryISO: 'GE',
    currencyISO: 'GEL',
  },
  {
    countryISO: 'GF',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'GG',
    currencyISO: 'GBP',
  },
  {
    countryISO: 'GH',
    currencyISO: 'GHS',
  },
  {
    countryISO: 'GI',
    currencyISO: 'GIP',
  },
  {
    countryISO: 'GL',
    currencyISO: 'DKK',
  },
  {
    countryISO: 'GM',
    currencyISO: 'GMD',
  },
  {
    countryISO: 'GN',
    currencyISO: 'GNF',
  },
  {
    countryISO: 'GP',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'GQ',
    currencyISO: 'XAF',
  },
  {
    countryISO: 'GR',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'GS',
    currencyISO: 'GBP',
  },
  {
    countryISO: 'GT',
    currencyISO: 'GTQ',
  },
  {
    countryISO: 'GU',
    currencyISO: 'USD',
  },
  {
    countryISO: 'GW',
    currencyISO: 'XOF',
  },
  {
    countryISO: 'GY',
    currencyISO: 'GYD',
  },
  {
    countryISO: 'HK',
    currencyISO: 'HKD',
  },
  {
    countryISO: 'HM',
    currencyISO: 'AUD',
  },
  {
    countryISO: 'HN',
    currencyISO: 'HNL',
  },
  {
    countryISO: 'HR',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'HT',
    currencyISO: 'HTG',
  },
  {
    countryISO: 'HU',
    currencyISO: 'HUF',
  },
  {
    countryISO: 'ID',
    currencyISO: 'IDR',
  },
  {
    countryISO: 'IE',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'IL',
    currencyISO: 'ILS',
  },
  {
    countryISO: 'IM',
    currencyISO: 'GBP',
  },
  {
    countryISO: 'IN',
    currencyISO: 'INR',
  },
  {
    countryISO: 'IO',
    currencyISO: 'USD',
  },
  {
    countryISO: 'IQ',
    currencyISO: 'IQD',
  },
  {
    countryISO: 'IR',
    currencyISO: 'IRR',
  },
  {
    countryISO: 'IS',
    currencyISO: 'ISK',
  },
  {
    countryISO: 'IT',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'JE',
    currencyISO: 'GBP',
  },
  {
    countryISO: 'JM',
    currencyISO: 'JMD',
  },
  {
    countryISO: 'JO',
    currencyISO: 'JOD',
  },
  {
    countryISO: 'JP',
    currencyISO: 'JPY',
  },
  {
    countryISO: 'KE',
    currencyISO: 'KES',
  },
  {
    countryISO: 'KG',
    currencyISO: 'KGS',
  },
  {
    countryISO: 'KH',
    currencyISO: 'KHR',
  },
  {
    countryISO: 'KI',
    currencyISO: 'AUD',
  },
  {
    countryISO: 'KM',
    currencyISO: 'KMF',
  },
  {
    countryISO: 'KN',
    currencyISO: 'XCD',
  },
  {
    countryISO: 'KP',
    currencyISO: 'KPW',
  },
  {
    countryISO: 'KR',
    currencyISO: 'KRW',
  },
  {
    countryISO: 'KW',
    currencyISO: 'KWD',
  },
  {
    countryISO: 'KY',
    currencyISO: 'KYD',
  },
  {
    countryISO: 'KZ',
    currencyISO: 'KZT',
  },
  {
    countryISO: 'LA',
    currencyISO: 'LAK',
  },
  {
    countryISO: 'LB',
    currencyISO: 'LBP',
  },
  {
    countryISO: 'LC',
    currencyISO: 'XCD',
  },
  {
    countryISO: 'LI',
    currencyISO: 'CHF',
  },
  {
    countryISO: 'LK',
    currencyISO: 'LKR',
  },
  {
    countryISO: 'LR',
    currencyISO: 'LRD',
  },
  {
    countryISO: 'LS',
    currencyISO: 'LSL',
  },
  {
    countryISO: 'LT',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'LU',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'LV',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'LY',
    currencyISO: 'LYD',
  },
  {
    countryISO: 'MA',
    currencyISO: 'MAD',
  },
  {
    countryISO: 'MC',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'MD',
    currencyISO: 'MDL',
  },
  {
    countryISO: 'ME',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'MF',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'MG',
    currencyISO: 'MGA',
  },
  {
    countryISO: 'MH',
    currencyISO: 'USD',
  },
  {
    countryISO: 'MK',
    currencyISO: 'MKD',
  },
  {
    countryISO: 'ML',
    currencyISO: 'XOF',
  },
  {
    countryISO: 'MM',
    currencyISO: 'MMK',
  },
  {
    countryISO: 'MN',
    currencyISO: 'MNT',
  },
  {
    countryISO: 'MO',
    currencyISO: 'MOP',
  },
  {
    countryISO: 'MP',
    currencyISO: 'USD',
  },
  {
    countryISO: 'MQ',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'MR',
    currencyISO: 'MRU',
  },
  {
    countryISO: 'MS',
    currencyISO: 'XCD',
  },
  {
    countryISO: 'MT',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'MU',
    currencyISO: 'MUR',
  },
  {
    countryISO: 'MV',
    currencyISO: 'MVR',
  },
  {
    countryISO: 'MW',
    currencyISO: 'MWK',
  },
  {
    countryISO: 'MX',
    currencyISO: 'MXN',
  },
  {
    countryISO: 'MY',
    currencyISO: 'MYR',
  },
  {
    countryISO: 'MZ',
    currencyISO: 'MZN',
  },
  {
    countryISO: 'NA',
    currencyISO: 'NAD',
  },
  {
    countryISO: 'NC',
    currencyISO: 'XPF',
  },
  {
    countryISO: 'NE',
    currencyISO: 'XOF',
  },
  {
    countryISO: 'NF',
    currencyISO: 'AUD',
  },
  {
    countryISO: 'NG',
    currencyISO: 'NGN',
  },
  {
    countryISO: 'NI',
    currencyISO: 'NIO',
  },
  {
    countryISO: 'NL',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'NO',
    currencyISO: 'NOK',
  },
  {
    countryISO: 'NP',
    currencyISO: 'NPR',
  },
  {
    countryISO: 'NR',
    currencyISO: 'AUD',
  },
  {
    countryISO: 'NU',
    currencyISO: 'NZD',
  },
  {
    countryISO: 'NZ',
    currencyISO: 'NZD',
  },
  {
    countryISO: 'OM',
    currencyISO: 'OMR',
  },
  {
    countryISO: 'PA',
    currencyISO: 'PAB',
  },
  {
    countryISO: 'PE',
    currencyISO: 'PEN',
  },
  {
    countryISO: 'PF',
    currencyISO: 'XPF',
  },
  {
    countryISO: 'PG',
    currencyISO: 'PGK',
  },
  {
    countryISO: 'PH',
    currencyISO: 'PHP',
  },
  {
    countryISO: 'PK',
    currencyISO: 'PKR',
  },
  {
    countryISO: 'PL',
    currencyISO: 'PLN',
  },
  {
    countryISO: 'PM',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'PN',
    currencyISO: 'NZD',
  },
  {
    countryISO: 'PR',
    currencyISO: 'USD',
  },
  {
    countryISO: 'PS',
    currencyISO: 'ILS',
  },
  {
    countryISO: 'PT',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'PW',
    currencyISO: 'USD',
  },
  {
    countryISO: 'PY',
    currencyISO: 'PYG',
  },
  {
    countryISO: 'QA',
    currencyISO: 'QAR',
  },
  {
    countryISO: 'RE',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'RO',
    currencyISO: 'RON',
  },
  {
    countryISO: 'RS',
    currencyISO: 'RSD',
  },
  {
    countryISO: 'RU',
    currencyISO: 'RUB',
  },
  {
    countryISO: 'RW',
    currencyISO: 'RWF',
  },
  {
    countryISO: 'SA',
    currencyISO: 'SAR',
  },
  {
    countryISO: 'SB',
    currencyISO: 'SBD',
  },
  {
    countryISO: 'SC',
    currencyISO: 'SCR',
  },
  {
    countryISO: 'SD',
    currencyISO: 'SDG',
  },
  {
    countryISO: 'SE',
    currencyISO: 'SEK',
  },
  {
    countryISO: 'SG',
    currencyISO: 'SGD',
  },
  {
    countryISO: 'SH',
    currencyISO: 'SHP',
  },
  {
    countryISO: 'SI',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'SJ',
    currencyISO: 'NOK',
  },
  {
    countryISO: 'SK',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'SL',
    currencyISO: 'SLE',
  },
  {
    countryISO: 'SM',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'SN',
    currencyISO: 'XOF',
  },
  {
    countryISO: 'SO',
    currencyISO: 'SOS',
  },
  {
    countryISO: 'SR',
    currencyISO: 'SRD',
  },
  {
    countryISO: 'SS',
    currencyISO: 'SSP',
  },
  {
    countryISO: 'ST',
    currencyISO: 'STN',
  },
  {
    countryISO: 'SV',
    currencyISO: 'USD',
  },
  {
    countryISO: 'SX',
    currencyISO: 'ANG',
  },
  {
    countryISO: 'SY',
    currencyISO: 'SYP',
  },
  {
    countryISO: 'SZ',
    currencyISO: 'SZL',
  },
  {
    countryISO: 'TC',
    currencyISO: 'USD',
  },
  {
    countryISO: 'TD',
    currencyISO: 'XAF',
  },
  {
    countryISO: 'TF',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'TG',
    currencyISO: 'XOF',
  },
  {
    countryISO: 'TH',
    currencyISO: 'THB',
  },
  {
    countryISO: 'TJ',
    currencyISO: 'TJS',
  },
  {
    countryISO: 'TK',
    currencyISO: 'NZD',
  },
  {
    countryISO: 'TL',
    currencyISO: 'USD',
  },
  {
    countryISO: 'TM',
    currencyISO: 'TMT',
  },
  {
    countryISO: 'TN',
    currencyISO: 'TND',
  },
  {
    countryISO: 'TO',
    currencyISO: 'TOP',
  },
  {
    countryISO: 'TR',
    currencyISO: 'TRY',
  },
  {
    countryISO: 'TT',
    currencyISO: 'TTD',
  },
  {
    countryISO: 'TV',
    currencyISO: 'AUD',
  },
  {
    countryISO: 'TW',
    currencyISO: 'TWD',
  },
  {
    countryISO: 'TZ',
    currencyISO: 'TZS',
  },
  {
    countryISO: 'UA',
    currencyISO: 'UAH',
  },
  {
    countryISO: 'UG',
    currencyISO: 'UGX',
  },
  {
    countryISO: 'UM',
    currencyISO: 'USD',
  },
  {
    countryISO: 'US',
    currencyISO: 'USD',
  },
  {
    countryISO: 'UY',
    currencyISO: 'UYU',
  },
  {
    countryISO: 'UZ',
    currencyISO: 'UZS',
  },
  {
    countryISO: 'VA',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'VC',
    currencyISO: 'XCD',
  },
  {
    countryISO: 'VE',
    currencyISO: 'VES',
  },
  {
    countryISO: 'VG',
    currencyISO: 'USD',
  },
  {
    countryISO: 'VI',
    currencyISO: 'USD',
  },
  {
    countryISO: 'VN',
    currencyISO: 'VND',
  },
  {
    countryISO: 'VU',
    currencyISO: 'VUV',
  },
  {
    countryISO: 'WF',
    currencyISO: 'XPF',
  },
  {
    countryISO: 'WS',
    currencyISO: 'WST',
  },
  {
    countryISO: 'YE',
    currencyISO: 'YER',
  },
  {
    countryISO: 'YT',
    currencyISO: 'EUR',
  },
  {
    countryISO: 'ZA',
    currencyISO: 'ZAR',
  },
  {
    countryISO: 'ZM',
    currencyISO: 'ZMW',
  },
  {
    countryISO: 'ZW',
    currencyISO: 'ZWL',
  },
];
