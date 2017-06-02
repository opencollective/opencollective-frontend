import { expect } from 'chai';
import * as utils from '../test/utils';
import models from '../server/models';

import * as currencylib from '../server/lib/currency';

describe('currencylib', () => {
  
  const startDate = new Date("2017-02-01");
  const endDate = new Date("2017-03-01");

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