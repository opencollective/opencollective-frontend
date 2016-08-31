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

  beforeEach(() => utils.cleanAllDb());

  beforeEach(() => models.User.create(userData).tap(u => user = u));

  // Create group2.
  beforeEach(() =>
    models.Group.create(groupData)
      .tap(g => group = g)
      .then(() => group.addUserWithRole(user, roles.HOST)));

  it('isExpense is true if the amount is negative', done => {
    Transaction.create({
      amount: -10
    })
    .then(transaction => {
      expect(transaction.info.isExpense).to.be.true;
      expect(transaction.info.isRejected).to.be.false;
      expect(transaction.info.isManual).to.be.false;
      expect(transaction.info.isDonation).to.be.false;
      expect(transaction.info.isReimbursed).to.be.false;
      done();
    })
    .catch(done);
  });

  it('isRejected is true if approvedAt is not null and approved is false', done => {
    Transaction.create({
      approvedAt: new Date(),
      approved: false
    })
    .then(transaction => {
      expect(transaction.info.isRejected).to.be.true;
      expect(transaction.info.isExpense).to.be.false;
      expect(transaction.info.isManual).to.be.false;
      expect(transaction.info.isDonation).to.be.false;
      expect(transaction.info.isReimbursed).to.be.false;
      done();
    })
    .catch(done);
  });

  it('isDonation is true when amount is > 0', done => {
    Transaction.create({
      amount: 0.1
    })
    .then(transaction => {
      expect(transaction.info.isDonation).to.be.true;
      expect(transaction.info.isRejected).to.be.false;
      expect(transaction.info.isExpense).to.be.false;
      expect(transaction.info.isManual).to.be.false;
      expect(transaction.info.isReimbursed).to.be.false;
      done();
    })
    .catch(done);
  });

  it('isManual if payoutMethod is manual', done => {
    Transaction.create({
      payoutMethod: 'manual'
    })
    .then(transaction => {
      expect(transaction.info.isManual).to.be.true;
      expect(transaction.info.isDonation).to.be.false;
      expect(transaction.info.isRejected).to.be.false;
      expect(transaction.info.isExpense).to.be.false;
      expect(transaction.info.isReimbursed).to.be.false;
      done();
    })
    .catch(done);
  });

  it('isReimbursed if reimbursedAt is set', done => {
    Transaction.create({
      reimbursedAt: new Date()
    })
    .then(transaction => {
      expect(transaction.info.isReimbursed).to.be.true;
      expect(transaction.info.isManual).to.be.false;
      expect(transaction.info.isDonation).to.be.false;
      expect(transaction.info.isRejected).to.be.false;
      expect(transaction.info.isExpense).to.be.false;
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
