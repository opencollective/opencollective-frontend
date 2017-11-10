import fetch from 'isomorphic-fetch';
import debugLib from 'debug';
import Promise from 'bluebird';

const debug = debugLib('currency');
const cache = {};

function getDate(date = 'latest') {
  if (date.getFullYear) {
    date.setTime( date.getTime() + date.getTimezoneOffset()*60*1000 );
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();    
    date = [date.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
  }
  return date;
}

export function getFxRate(fromCurrency, toCurrency, date = 'latest') {
  debug(">>> getFxRate for ", date, fromCurrency, toCurrency);

  if (fromCurrency === toCurrency) return Promise.resolve(1);
  if (!fromCurrency || !toCurrency) return Promise.resolve(1);

  date = getDate(date);

  const key = `${date}-${fromCurrency}-${toCurrency}`;
  if (cache[key]) return Promise.resolve(cache[key]);

  return new Promise((resolve, reject) => {
    fetch(`http://api.fixer.io/${date}?base=${fromCurrency}&symbols=${toCurrency}`)
      .then(res => res.json())
      .then(json => {
        try {
          const fxrate = parseFloat(json.rates[toCurrency]);
          if (date != 'latest') {
            cache[key] = fxrate;
          }
          return resolve(fxrate);
        } catch (e) {
          const msg = `>>> lib/currency: can't fetch fxrate from ${fromCurrency} to ${toCurrency} for date ${date}`;
          console.error(msg, "json:", json, "error:", e);
          return reject(new Error(msg));
        }
      })
      .catch(e => {
        console.error("Unable to fetch fxrate", e.message);
        // for testing in airplane mode
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
          console.log(">>> returning 1.1")
          return resolve(1.1);
        } else {
          throw e;
        }
      })
  });
}

export function convertToCurrency(amount, fromCurrency, toCurrency, date = 'latest') {

  if (amount === 0) return 0;
  if (fromCurrency === toCurrency) return Promise.resolve(amount);
  if (!fromCurrency || !toCurrency) return Promise.resolve(amount);

  return getFxRate(fromCurrency, toCurrency, date).then(fxrate => {
    return fxrate * amount;
  })
}