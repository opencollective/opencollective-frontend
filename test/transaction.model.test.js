import {expect} from 'chai';
import sinon from 'sinon';
import * as utils from '../test/utils';
import roles from '../server/constants/roles';
import { type } from '../server/constants/transactions';
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

  it('type and uuid automatically generated', done => {
    Transaction.create({
      amount: -1000
    })
    .then(transaction => {
      expect(transaction.info.type).to.equal(type.EXPENSE);
      expect(transaction.info.uuid).to.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
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
