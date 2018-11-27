import { expect } from 'chai';
import sinon from 'sinon';
import * as utils from '../test/utils';
import models from '../server/models';

const { Transaction } = models;

const userData = utils.data('user1');
const collectiveData = utils.data('collective1');
const transactionsData = utils.data('transactions1').transactions;

describe('transaction model', () => {
  let user, host, collective, defaultTransactionData;

  beforeEach(() => utils.resetTestDB());

  beforeEach('create user', () => models.User.createUserWithCollective(userData).tap(u => (user = u)));
  beforeEach('create host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => (host = u)));

  beforeEach('create collective2 and add host', () =>
    models.Collective.create(collectiveData)
      .tap(g => (collective = g))
      .tap(() => {
        defaultTransactionData = {
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          CollectiveId: collective.id,
          HostCollectiveId: host.CollectiveId,
        };
      })
      .then(() => collective.addHost(host.collective)),
  );

  it('automatically generates uuid', done => {
    Transaction.create({
      amount: -1000,
      ...defaultTransactionData,
    })
      .then(transaction => {
        expect(transaction.info.uuid).to.match(
          /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
        );
        done();
      })
      .catch(done);
  });

  it('get the host', done => {
    Transaction.create({
      ...defaultTransactionData,
      amount: 10000,
    }).then(transaction => {
      expect(transaction.HostCollectiveId).to.equal(host.CollectiveId);
      done();
    });
  });

  it('createFromPayload creates a double entry transaction', () => {
    return Transaction.createFromPayload({
      transaction: transactionsData[7],
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      CollectiveId: collective.id,
    }).then(() => {
      return Transaction.findAll().then(transactions => {
        expect(transactions.length).to.equal(2);
        expect(transactions[0] instanceof models.Transaction).to.be.true;
        expect(transactions[0].description).to.equal(transactionsData[7].description);
        expect(transactions[0].amount).to.equal(-transactionsData[7].netAmountInCollectiveCurrency);
        expect(transactions[1].amount).to.equal(-transactions[0].netAmountInCollectiveCurrency);
      });
    });
  });

  it('createFromPayload() generates a new activity', done => {
    const createActivityStub = sinon.stub(Transaction, 'createActivity').callsFake(t => {
      expect(Math.abs(t.amount)).to.equal(Math.abs(transactionsData[7].netAmountInCollectiveCurrency));
      createActivityStub.restore();
      done();
    });

    Transaction.createFromPayload({
      transaction: transactionsData[7],
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      CollectiveId: collective.id,
    })
      .then(transaction => {
        expect(transaction.CollectiveId).to.equal(collective.id);
      })
      .catch(done);
  });
});
