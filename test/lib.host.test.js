import sinon from 'sinon';
import { expect } from 'chai';
import * as utils from '../test/utils';

import * as hostlib from '../server/lib/hostlib';
import * as currencyLib from '../server/lib/currency';


describe('hostlib', () => {
  
  const hostid = 3; // WWCode host
  const startDate = new Date("2017-02-01");
  const endDate = new Date("2017-03-01");
  let collectiveids;

  const where = {
    CollectiveId: { $in: collectiveids },
    createdAt: { $gte: startDate, $lt: endDate}
  };

  let sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(currencyLib, 'convertToCurrency', (amount, fromCurrency, toCurrency) => {
      if (fromCurrency === toCurrency) return Promise.resolve(amount);
      return Promise.resolve(0.75779 * amount)
    });
  });

  after(() => sandbox.restore());

  before(() => utils.loadDB("wwcode_test"));

  beforeEach('get hosted collectives', () => hostlib.getHostedCollectives(hostid).then(collectives => {
    collectiveids = collectives.map(g => g.id);
    where.CollectiveId = { $in: collectiveids };
    expect(collectives.length).to.equal(73);
    return true;
  }).catch(console.error));

  it('get the backers stats', () => hostlib.getBackersStats(startDate, endDate, collectiveids).then(stats => {
    expect(stats.new).to.equal(4);
    expect(stats.repeat).to.equal(5);
    expect(stats.total).to.equal(44);
    return true;
  }));

  it('get the total amount of funds held by the host', () => hostlib.sumTransactionsByCurrency("netAmountInCollectiveCurrency", where).then(res => {
    const usd = res.find(a => a.currency === 'USD');
    expect(usd.amount).to.equal(439541);
    expect(res.length).to.equal(2);
    return true;
  }));

  it('get the total amount of funds held by the host in host currency', () => hostlib.sumTransactions("netAmountInCollectiveCurrency", where).then(res => {
    expect(res.byCurrency).to.have.length(2);
    expect(res.totalInHostCurrency).to.equal(459472);
    return true;
  }));

  it('get the total net amount of host fees', () => hostlib.sumTransactions("hostFeeInTxnCurrency", where).then(res => {
    expect(res.byCurrency).to.have.length(2);
    expect(res.totalInHostCurrency).to.equal(12083);
    const cad = res.byCurrency.find(a => a.currency === 'CAD');
    expect(cad.amount).to.equal(1120);
    return true;
  }));

});