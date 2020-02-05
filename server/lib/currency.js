import fetch from 'isomorphic-fetch';
import config from 'config';
import debugLib from 'debug';
import { get } from 'lodash';
import Promise from 'bluebird';

import logger from './logger';
import { currencyFormats } from '../constants/currency_format';

const debug = debugLib('currency');
const cache = {};

function getDate(date = 'latest') {
  if (date.getFullYear) {
    date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();
    date = [date.getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('-');
  }
  return date;
}

export function formatCurrency(currency, value) {
  const _currency = currency.toUpperCase();
  const currencyStr = currencyFormats[_currency];

  if (!currencyStr) {
    return `${value} ${_currency}`;
  }
  return currencyStr.concat(value);
}

if (!get(config, 'fixer.accessKey') && !['staging', 'production'].includes(config.env)) {
  logger.info('Fixer API is not configured, lib/currency will always return 1.1');
}

export function getFxRate(fromCurrency, toCurrency, date = 'latest') {
  debug(`getFxRate for ${date} ${fromCurrency} -> ${toCurrency}`);

  if (fromCurrency === toCurrency) {
    return Promise.resolve(1);
  } else if (!fromCurrency || !toCurrency) {
    return Promise.resolve(1);
  } else if (!get(config, 'fixer.accessKey')) {
    if (['staging', 'production'].includes(config.env)) {
      throw new Error('Unable to fetch fxRate, Fixer API is not configured.');
    } else {
      return Promise.resolve(1.1);
    }
  }

  date = getDate(date);

  let dateKey = date;
  if (dateKey === 'latest') {
    dateKey = getDate(new Date());
  }
  const key = `${dateKey}-${fromCurrency}-${toCurrency}`;
  if (cache[key]) {
    return Promise.resolve(cache[key]);
  }

  return new Promise((resolve, reject) => {
    const params = {
      access_key: config.fixer.accessKey,
      base: fromCurrency,
      symbols: toCurrency,
    };

    const searchParams = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');

    fetch(`https://data.fixer.io/${date}?${searchParams}`)
      .then(res => res.json())
      .then(json => {
        const fxrate = parseFloat(json.rates[toCurrency]);
        cache[key] = fxrate;
        return resolve(fxrate);
      })
      .catch(error => {
        if (!config.env || !['staging', 'production'].includes(config.env)) {
          logger.info(`Unable to fetch fxRate with Fixer API: ${error.message}. Returning 1.1`);
          return resolve(1.1);
        } else {
          logger.error(`Unable to fetch fxRate with Fixer API: ${error.message}`);
          reject(error);
        }
      });
  });
}

export function convertToCurrency(amount, fromCurrency, toCurrency, date = 'latest') {
  if (amount === 0) {
    return 0;
  }
  if (fromCurrency === toCurrency) {
    return Promise.resolve(amount);
  }
  if (!fromCurrency || !toCurrency) {
    return Promise.resolve(amount);
  }

  return getFxRate(fromCurrency, toCurrency, date).then(fxrate => {
    return fxrate * amount;
  });
}

/**
 * The goal of this function is to return the sum of an array of { currency, amount, date }
 * to one total amount in the given currency
 * @param {*} array [ { currency, amount[, date] }]
 */
export function reduceArrayToCurrency(array, currency) {
  return Promise.map(array, entry => convertToCurrency(entry.amount, entry.currency, currency, entry.date)).then(
    arrayInBaseCurrency => {
      return arrayInBaseCurrency.reduce((accumulator, amount) => accumulator + amount, 0);
    },
  );
}
