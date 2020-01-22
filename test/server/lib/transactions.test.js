/* Test utilities */
import { expect } from 'chai';

/* Support code */
import models from '../../../server/models';

/* Code being tested */
import * as libtransactions from '../../../server/lib/transactions';

import * as utils from '../../utils';
import * as store from '../../stores';

describe('server/lib/transactions', () => {
  beforeEach(utils.resetTestDB);

  it('exports transactions', async () => {
    // Given a host with a collective
    const currency = 'USD';
    const { collective } = await store.newCollectiveWithHost('apex', currency, currency, 10);
    const { user } = await store.newUser('a new user');
    // And given some transactions
    await store.stripeConnectedAccount(collective.HostCollectiveId);
    await store.stripeOneTimeDonation({
      remoteUser: user,
      collective,
      currency,
      amount: 100,
    });
    await store.stripeOneTimeDonation({
      remoteUser: user,
      collective,
      currency,
      amount: 200,
    });
    await store.stripeOneTimeDonation({
      remoteUser: user,
      collective,
      currency,
      amount: 300,
    });
    await store.stripeOneTimeDonation({
      remoteUser: user,
      collective,
      currency,
      amount: 400,
    });
    await store.stripeOneTimeDonation({
      remoteUser: user,
      collective,
      currency,
      amount: 500,
    });
    const transactions = await models.Transaction.findAll({
      where: { CollectiveId: collective.id },
    });
    expect(transactions.length).to.equal(5);
    // When the newly created transactions are exported
    const csv = libtransactions.exportTransactions(transactions);
    const lines = csv.split('\n');
    expect(lines.length).to.equal(6);
    expect(lines[0].split('","').length).to.equal(12);
  }); /* End of "exports transactions" */
}); /* End of "lib.transactions.test.js" */
