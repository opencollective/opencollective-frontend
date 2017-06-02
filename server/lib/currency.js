import fetch from 'isomorphic-fetch';
import debugLib from 'debug';

const debug = debugLib('currency');
const cache = {};

export function convertToCurrency(amount, fromCurrency, toCurrency, date = 'latest') {

  if (fromCurrency === toCurrency) return amount;

  if (date.getFullYear) {
    const mm = date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate();    
    date = [date.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('-');
  }

  debug("convertToCurrency for ", date, amount, fromCurrency, toCurrency);
  const key = `${date}-${fromCurrency}-${toCurrency}`;
  if (cache[key]) return cache[key] * amount;

  return fetch(`http://api.fixer.io/${date}?base=${fromCurrency}&symbols=${toCurrency}`)
    .then(res => res.json())
    .then(json => {
      const fxrate = parseFloat(json.rates[toCurrency]);
      if (date != 'latest') {
        cache[key] = fxrate;
      }
      return fxrate * amount;
    })
}