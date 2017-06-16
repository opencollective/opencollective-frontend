import {expect} from 'chai';
import sinon from 'sinon';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import models from '../server/models';

const {Transaction} = models;

const userData = utils.data('user1');
const groupData = utils.data('group1');
const transactionsData = utils.data('transactions1').transactions;

describe('transaction model', () => {

  let user, host, group, defaultTransactionData;

  beforeEach(() => utils.resetTestDB());

  beforeEach('create user', () => models.User.create(userData).tap(u => user = u));
  beforeEach('create host', () => models.User.create(utils.data('host1')).tap(u => host = u));

  beforeEach('create group2 and add host', () =>
    models.Group.create(groupData)
      .tap(g => group = g)
      .tap(() => {
        defaultTransactionData = {
          UserId: user.id,
          HostId: host.id,
          GroupId: group.id
        };
      })
      .then(() => group.addUserWithRole(host, roles.HOST)));

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
    .then(transaction => transaction.getHost())
    .then(h => {
      expect(h.id).to.equal(host.id);
      done();
    })
  });

  it('createFromPayload creates a new Transaction', done => {
    Transaction.createFromPayload({
      transaction: transactionsData[7],
      user,
      group
    })
    .then(() => {
      Transaction.findAll()
      .then(transactions => {
        expect(transactions.length).to.equal(1);
        expect(transactions[0].description).to.equal(transactionsData[7].description);
        done();
      })
    })
    .catch(done);
  })

  it('createFromPayload() generates a new activity', (done) => {

    const createActivityStub = sinon.stub(Transaction, 'createActivity', (t) => {
      expect(t.amount).to.equal(transactionsData[7].amount);
      createActivityStub.restore();
      done();
    });

    Transaction.createFromPayload({
      transaction: transactionsData[7],
      user,
      group
    })
    .then(transaction => {
      expect(transaction.GroupId).to.equal(group.id);
    })
    .catch(done);
  });
});
