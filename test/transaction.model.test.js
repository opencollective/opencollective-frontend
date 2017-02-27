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

  let user, group;

  beforeEach(() => utils.resetTestDB());

  beforeEach('create user', () => models.User.create(userData).tap(u => user = u));

  beforeEach('create group2 and add user as host', () =>
    models.Group.create(groupData)
      .tap(g => group = g)
      .then(() => group.addUserWithRole(user, roles.HOST)));

  it('type is EXPENSE if the amount is negative', done => {
    Transaction.create({
      amount: -1000
    })
    .then(transaction => {
      expect(transaction.info.type).to.equal('EXPENSE');
      done();
    })
    .catch(done);
  });

  it('get the host', (done) => {
    Transaction.create({
      GroupId: group.id,
      amount: 10000
    })
    .then(transaction => transaction.getHost())
    .then(host => {
      expect(host.id).to.equal(user.id);
      done();
    })
  });

  it('type is DONATION when amount is > 0', done => {
    Transaction.create({
      amount: 10
    })
    .then(transaction => {
      expect(transaction.info.type).to.equal('DONATION');
      done();
    })
    .catch(done);
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
        done();
      })
    })
    .catch(done);
  })

  let createActivitySpy;

  before(() => {
    createActivitySpy = sinon.spy(Transaction, 'createActivity');
  });

  beforeEach(() => createActivitySpy.reset());

  after(() => createActivitySpy.restore());

  it('createFromPayload() generates a new activity', (done) => {

    Transaction.createFromPayload({
      transaction: transactionsData[7],
      user,
      group
    })
    .then(transaction => {
      expect(transaction.GroupId).to.equal(group.id);
      expect(createActivitySpy.lastCall.args[0]).to.equal(transaction);
      done();
    })
    .catch(done);
  });
});
