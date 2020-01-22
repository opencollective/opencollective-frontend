import sinon from 'sinon';
import { expect } from 'chai';

import * as libhost from '../../../server/lib/hostlib';
import * as libcurrency from '../../../server/lib/currency';
import { Op } from '../../../server/models';

import * as utils from '../../utils';
import * as store from '../../stores';

async function donation(collective, user, amount, currency, createdAt) {
  return store.stripeOneTimeDonation({
    amount,
    currency,
    remoteUser: user,
    collective,
    createdAt,
  });
}

/**
 * The goal here is to test a host with collectives in multiple currencies
 * We use sanitized data from wwcode for this
 */
describe('server/lib/host', () => {
  const where = {}; // Will be filled in by 'get hosted collectives'
  const startDate = new Date('2017-02-01');
  const endDate = new Date('2017-03-01');
  let sandbox, hostId, collectiveids;

  before(async () => {
    await utils.resetTestDB();
    // Given that we stub the currency conversion machinery
    sandbox = sinon.createSandbox();
    sandbox.stub(libcurrency, 'getFxRate').callsFake(() => Promise.resolve(0.75779));
    sandbox.stub(libcurrency, 'convertToCurrency').callsFake(a => a * 2);

    // Given a host with a collective
    const currency = 'USD';
    const { hostCollective } = await store.newHost('Open Source Collective', currency, 10);

    // Add stripe accounts to the newly created host colective
    await store.stripeConnectedAccount(hostCollective.id);

    // And a few collectives
    const { apex } = await store.newCollectiveInHost('apex', currency, hostCollective);
    const { babel } = await store.newCollectiveInHost('babel', currency, hostCollective);
    const { rollup } = await store.newCollectiveInHost('rollup', currency, hostCollective);
    const { parcel } = await store.newCollectiveInHost('parcel', currency, hostCollective);

    // And a few users
    const { user1 } = await store.newUser('user1');
    const { user2 } = await store.newUser('user2');
    const { user3 } = await store.newUser('user3');
    const { user4 } = await store.newUser('user4');

    // And some donations

    // repeat
    await donation(apex, user1, 50000, 'USD', '2017-01-01 00:00:00');
    await donation(apex, user1, 50000, 'USD', '2017-02-01 00:00:00');
    await donation(apex, user1, 50000, 'USD', '2017-03-01 00:00:00');
    // Inactive
    await donation(babel, user2, 50000, 'USD', '2016-04-01 00:00:00');
    await donation(babel, user2, 50000, 'USD', '2016-05-01 00:00:00');
    // New
    await donation(rollup, user3, 50000, 'USD', '2017-02-20 00:00:00');
    await donation(parcel, user4, 50000, 'USD', '2017-02-20 00:00:00');
    await donation(parcel, user4, 50000, 'CAD', '2017-02-20 00:00:00');

    // And we remember the host's id
    hostId = hostCollective.id;
  });

  after(() => sandbox.restore());

  beforeEach('get hosted collectives', async () => {
    const collectives = await libhost.getHostedCollectives(hostId);
    collectiveids = collectives.map(g => g.id).filter(id => id !== hostId); // We remove the host collective
    where.CollectiveId = { [Op.in]: collectiveids };
    expect(collectives.length).to.equal(4);
  });

  it('get the backers stats', async () => {
    const stats = await libhost.getBackersStats(startDate, endDate, collectiveids);
    expect(stats.total).to.equal(4);
    expect(stats.new).to.equal(2);
    expect(stats.repeat).to.equal(1);
    expect(stats.inactive).to.equal(1);
  });

  it('get the total amount of funds held by the host', async () => {
    const res = await libhost.sumTransactionsByCurrency('netAmountInCollectiveCurrency', { where });
    const usd = res.find(a => a.currency === 'USD');
    expect(usd.amount).to.equal(315000);
    expect(res.length).to.equal(2);
  });

  it('get the total amount of funds held by the host in host currency', async () => {
    const res = await libhost.sumTransactions('netAmountInCollectiveCurrency', {
      where,
    });
    expect(res.byCurrency).to.have.length(2);
    expect(res.totalInHostCurrency).to.equal(720000);
  });

  it('get the total net amount of host fees', async () => {
    const res = await libhost.sumTransactions('hostFeeInHostCurrency', {
      where,
    });
    expect(res.byCurrency).to.have.length(2);
    expect(res.totalInHostCurrency).to.equal(-80000);
    const cad = res.byCurrency.find(a => a.currency === 'CAD');
    expect(cad.amount).to.equal(-5000);
  });
});
