import { expect } from 'chai';
import * as currencylib from '../../../server/lib/currency';
import nock from 'nock';
import config from 'config';

describe('server/lib/currency', () => {
  const startDate = '2017-02-01';
  const endDate = '2017-03-01';

  before(() => {
    nock('https://data.fixer.io')
      .get(`/${startDate}`)
      .query({
        access_key: config.fixer.accessKey,
        base: 'EUR',
        symbols: 'USD',
      })
      .reply(200, { base: 'EUR', date: startDate, rates: { USD: 1.079 } });

    nock('https://data.fixer.io')
      .get(`/${endDate}`)
      .query({
        access_key: config.fixer.accessKey,
        base: 'EUR',
        symbols: 'USD',
      })
      .reply(200, { base: 'EUR', date: endDate, rates: { USD: 1.0533 } });

    nock('https://data.fixer.io')
      .get(`/${endDate}`)
      .query({
        access_key: config.fixer.accessKey,
        base: 'INR',
        symbols: 'USD',
      })
      .reply(200, { base: 'INR', date: endDate, rates: { USD: 0.014962 } });
  });

  it('converts EUR to USD', () =>
    currencylib.convertToCurrency(1, 'EUR', 'USD', new Date(startDate)).then(amount => expect(amount).to.equal(1.079)));

  it('converts EUR to USD for another date', () =>
    currencylib.convertToCurrency(1, 'EUR', 'USD', new Date(endDate)).then(amount => expect(amount).to.equal(1.0533)));

  it('converts INR to USD', () =>
    currencylib
      .convertToCurrency(1, 'INR', 'USD', new Date(endDate))
      .then(amount => expect(amount).to.equal(0.014962)));
});
