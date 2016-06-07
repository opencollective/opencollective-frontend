/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();
var sinon = require('sinon');
var roles = require('../server/constants/roles');

/**
 * Variables.
 */
var models = app.set('models');
var paypalMock = require('./mocks/paypal');

/**
 * Tests.
 */
describe('transactions.paypal.routes.test.js', () => {
  var application;
  var user2;
  var group;
  var transactionApproved;
  var transactionPositive;
  var transactionManual;
  var stub;

  before(() => {
    stub = sinon.stub(app.paypalAdaptive, 'pay', (data, cb) => {
      return cb(null, paypalMock.adaptive.payCompleted);
    });
  });

  after(() => app.paypalAdaptive.pay.restore());

  beforeEach((done) => {
    async.auto({

      cleanAndCreateApplication: (cb) => {
        utils.cleanAllDb().asCallback(cb);
      },
      createUserB: ['cleanAndCreateApplication', (cb) => {
        models.User.create(utils.data('user2'))
          .then(user => cb(null, user))
          .catch(cb);
      }],
      createGroupA: ['cleanAndCreateApplication', (cb) => {
        models.Group.create(utils.data('group1'))
          .then(user => cb(null, user))
          .catch(cb);
      }],
      addUserBGroupA: ['createUserB', 'createGroupA', (cb, results) => {
        results.createGroupA
          .addUserWithRole(results.createUserB, roles.MEMBER)
          .then(() => cb())
          .catch(cb);
      }],
      createTransactionC: ['cleanAndCreateApplication', 'createGroupA', 'createUserB', (cb, results) => {
        var t = utils.data('transactions1').transactions[2];
        t.GroupId = results.createGroupA.id;
        t.approvedAt = Date.now();
        t.approved = true;
        t.payoutMethod = 'paypal';
        t.UserId = results.createUserB.id;
        models.Transaction.create(t)
          .then(t => cb(null, t))
          .catch(cb);
      }],
      createTransactionD: ['cleanAndCreateApplication', 'createGroupA', 'createUserB', (cb, results) => {
        var t = utils.data('transactions1').transactions[3  ];
        t.GroupId = results.createGroupA.id;
        t.approvedAt = Date.now();
        t.approved = true;
        t.UserId = results.createUserB.id;
        t.amount = 10;
        models.Transaction.create(t)
          .then(t => cb(null, t))
          .catch(cb);
      }],
      createTransactionManual: ['cleanAndCreateApplication', 'createGroupA', 'createUserB', (cb, results) => {
        var t = utils.data('transactions1').transactions[2];
        t.GroupId = results.createGroupA.id;
        t.approvedAt = Date.now();
        t.approved = true;
        t.UserId = results.createUserB.id;
        t.payoutMethod = 'manual';
        models.Transaction.create(t)
          .then(t => cb(null, t))
          .catch(cb);
      }],
      createPaymentMethodUserB: ['cleanAndCreateApplication', 'createUserB', (cb, results) => {
        models.PaymentMethod.create({
          service: 'paypal',
          UserId: results.createUserB.id,
          confirmedAt: Date.now()
        })
        .then(pm => cb(null, pm))
        .catch(cb);
      }]
    }, (e, results) => {
      expect(e).to.not.exist;
      application = results.cleanAndCreateApplication;
      user2 = results.createUserB;
      group = results.createGroupA;
      transactionApproved = results.createTransactionC;
      transactionPositive = results.createTransactionD;
      transactionManual = results.createTransactionManual;
      done();
    });
  });

  /**
   * Pay a transaction
   */
  describe('#pay', () => {
    it('should pay a transaction', (done) => {
      request(app)
        .post('/groups/' + group.id + '/transactions/' + transactionApproved.id + '/pay/')
        .field('service', 'paypal')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(200)
        .end((err, res) => {
          var transaction = res.body;
          expect(stub.called).to.be.true;
          expect(transaction.status).to.equal('REIMBURSED');
          expect(transaction.amount).to.equal(transactionApproved.amount);
          done();
        });
    });

    it('should pay a transaction manually', (done) => {
      request(app)
        .post('/groups/' + group.id + '/transactions/' + transactionManual.id + '/pay/')
        .field('service', 'paypal')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(200)
        .end((err, res) => {
          var transaction = res.body;
          expect(transaction.status).to.equal('REIMBURSED');
          expect(transaction.amount).to.equal(transactionManual.amount);
          expect(transaction.payoutMethod).to.equal(transactionManual.payoutMethod);
          expect(transaction.reimbursedAt).to.be.ok;
          expect(transaction.PaymentMethodId).to.equal(null);
          done();
        });
    });

    it('should fail if the transaction has a positive amount', (done) => {
      expect(transactionPositive.amount).to.be.greaterThan(0);

      request(app)
        .post('/groups/' + group.id + '/transactions/' + transactionPositive.id + '/pay/')
        .field('service', 'paypal')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(400)
        .end(done);
    });

  });



});
