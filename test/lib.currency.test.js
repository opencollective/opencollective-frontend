import { expect } from 'chai';
import * as currencylib from '../server/lib/currency';
import nock from 'nock';

describe('currencylib', () => {
  
  const startDate = new Date("2017-02-01");
  const endDate = new Date("2017-03-01");

  before(() => {

    nock('http://api.fixer.io:80')
      .get(/.*/)
      .query({"base":"EUR","symbols":"USD"})
      .reply(200, {"base":"EUR","date":"2017-02-01","rates":{"USD":1.079}});
    
    nock('http://api.fixer.io:80')
      .get(/.*/)
      .query({"base":"EUR","symbols":"USD"})
      .reply(200, {"base":"EUR","date":"2017-03-01","rates":{"USD":1.0533}});
    
    nock('http://api.fixer.io:80')
      .get(/.*/)
      .query({"base":"INR","symbols":"USD"})
      .reply(200, {"base":"INR","date":"2017-03-01","rates":{"USD":0.014962}});
      
  })

  it('converts EUR to USD', () => currencylib.convertToCurrency(1, 'EUR', 'USD', startDate).then(amount => {
    expect(amount).to.equal(1.079);
  }));

  it('converts EUR to USD for another date', () => currencylib.convertToCurrency(1, 'EUR', 'USD', endDate).then(amount => {
    expect(amount).to.equal(1.0533);
  }));

  it('converts INR to USD', () => currencylib.convertToCurrency(1, 'INR', 'USD', endDate).then(amount => {
    expect(amount).to.equal(0.014962);
  }));

});