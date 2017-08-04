import {expect} from 'chai';
import sinon from 'sinon';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import models from '../server/models';

const {Transaction} = models;

const userData = utils.data('user1');
const collectiveData = utils.data('collective1');
const transactionsData = utils.data('transactions1').transactions;

describe('transaction model', () => {

  let user, host, collective, defaultTransactionData;

  beforeEach(() => utils.resetTestDB());

  beforeEach('create user', () => models.User.createUserWithCollective(userData).tap(u => user = u));
  beforeEach('create host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => host = u));

  beforeEach('create collective2 and add host', () =>
    models.Collective.create(collectiveData)
      .tap(g => collective = g)
      .tap(() => {
        defaultTransactionData = {
          CreatedByUserId: user.id,
          FromCollectiveId: user.CollectiveId,
          ToCollectiveId: collective.id,
          HostCollectiveId: host.CollectiveId
        };
      })
      .then(() => collective.addUserWithRole(host, roles.HOST)));

  it('automatically generates uuid', done => {
    Transaction.create({
      amount: -1000,
      ...defaultTransactionData
    })
    .then(transaction => {
      expect(transaction.info.uuid).to.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
      done();
    })
    .catch(done);
  });

  it('get the host', (done) => {
    Transaction.create({
      ...defaultTransactionData,
      amount: 10000
    })
    .then(transaction => {
      expect(transaction.HostCollectiveId).to.equal(host.CollectiveId);
      done();
    })
  });

  it('createFromPayload creates a new Transaction', () => {
    return Transaction.createFromPayload({
      transaction: transactionsData[7],
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      ToCollectiveId: collective.id
    })
    .then(() => {
      return Transaction.findAll()
      .then(transactions => {
        expect(transactions.length).to.equal(1);
        expect(transactions[0].description).to.equal(transactionsData[7].description);
      })
    })
  })

  it('createFromPayload() generates a new activity', (done) => {

    const createActivityStub = sinon.stub(Transaction, 'createActivity', (t) => {
      expect(t.amount).to.equal(transactionsData[7].amount);
      createActivityStub.restore();
      done();
    });

    Transaction.createFromPayload({
      transaction: transactionsData[7],
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      ToCollectiveId: collective.id
    })
    .then(transaction => {
      expect(transaction.ToCollectiveId).to.equal(collective.id);
    })
    .catch(done);
  });
});
