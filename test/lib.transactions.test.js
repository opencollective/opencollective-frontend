import { expect } from 'chai';
import models from '../server/models';
import * as utils from '../test/utils';

import * as tlib from '../server/lib/transactions';

describe('lib.transactions.test.js', () => {

  const startDate = new Date("2017-02-01");
  const endDate = new Date("2017-03-01");
  let transactions;

  const where = {
    createdAt: { $gte: startDate, $lt: endDate}
  };

  before(() => utils.loadDB("wwcode_test"));

  beforeEach('get transactions', () => models.Transaction.findAll({ where }).then(ts => {
    transactions = ts;
    expect(transactions.length).to.equal(40);
  }));

  it('exports transactions', (done) => {
    const csv = tlib.exportTransactions(transactions);
    const lines = csv.split('\n');
    expect(lines.length).to.equal(41);
    expect(lines[0].split('","').length).to.equal(12);
    done();
  });

});
