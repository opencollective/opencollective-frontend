/**
 * Dependencies.
 */

const _ = require('lodash');
const app = require('../index');
const config = require('config');
const expect = require('chai').expect;
const utils = require('../test/utils.js')();

/**
 * Models
 */

const models = app.get('models');
const Transaction = models.Transaction;

/**
 * Tests.
 */

describe('transaction model', function() {

  beforeEach(done => {
    utils.cleanAllDb(done);
  });

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

  it('isDonation is true tags contains `Donation`', done => {
    Transaction.create({
      tags: ['Donation']
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
});
