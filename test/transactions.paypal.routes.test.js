/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var config = require('config');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();
var sinon = require('sinon');
var nock = require('nock');
var roles = require('../app/constants/roles');
var activities = require('../app/constants/activities');

/**
 * Variables.
 */
var models = app.set('models');
var paypalMock = require('./mocks/paypal');

/**
 * Tests.
 */
describe('transactions.paypal.routes.test.js', function() {
  var application;
  var application2;
  var application3;
  var user;
  var user2;
  var group;
  var group2;
  var transaction;
  var transaction2;
  var transactionApproved;
  var transactionPositive;
  var transactionManual;
  var stub;

  beforeEach(function() {
    var stub = sinon.stub(app.paypalAdaptive, 'pay');
    stub.yields(null, paypalMock.adaptive.pay);
  });

  afterEach(function() {
    app.paypalAdaptive.pay.restore();
  });

  beforeEach(function(done) {
    async.auto({

      cleanAndCreateApplication: function(cb) {
        utils.cleanAllDb(cb);
      },
      createApplicationB: ['cleanAndCreateApplication', function(cb) {
        models.Application.create(utils.data('application2')).done(cb);
      }],
      createApplicationC: ['cleanAndCreateApplication', function(cb) {
        models.Application.create(utils.data('application3')).done(cb);
      }],
      createUserA: ['cleanAndCreateApplication', function(cb) {
        models.User.create(utils.data('user1')).done(cb);
      }],
      createUserB: ['cleanAndCreateApplication', function(cb) {
        models.User.create(utils.data('user2')).done(cb);
      }],
      createGroupA: ['cleanAndCreateApplication', function(cb) {
        models.Group.create(utils.data('group1')).done(cb);
      }],
      addUserAGroupA: ['createUserA', 'createGroupA', function(cb, results) {
        results.createGroupA
          .addUserWithRole(results.createUserA, roles.BACKER)
          .done(cb);
      }],
      addUserBGroupA: ['createUserB', 'createGroupA', function(cb, results) {
        results.createGroupA
          .addUserWithRole(results.createUserB, roles.MEMBER)
          .done(cb);
      }],
      addApplicationCGroupA: ['createApplicationC', 'createGroupA', function(cb, results) {
        results.createGroupA
          .addApplication(results.createApplicationC)
          .done(cb);
      }],
      createTransactionA: ['cleanAndCreateApplication', 'createGroupA', 'createUserA', 'addUserAGroupA', function(cb, results) {
        request(app)
          .post('/groups/' + results.createGroupA.id + '/transactions')
          .set('Authorization', 'Bearer ' + results.createUserA.jwt(results.cleanAndCreateApplication))
          .send({
            transaction: utils.data('transactions1').transactions[0]
          })
          .expect(200)
          .end(function(e, res) {
            cb(e, res.body);
          });
      }],
      createTransactionB: ['cleanAndCreateApplication', 'createGroupA', function(cb, results) {
        var t = utils.data('transactions1').transactions[1];
        t.GroupId = results.createGroupA.id;
        models.Transaction.create(t).done(cb);
      }],
      createTransactionC: ['cleanAndCreateApplication', 'createGroupA', 'createUserB', function(cb, results) {
        var t = utils.data('transactions1').transactions[2];
        t.GroupId = results.createGroupA.id;
        t.approvedAt = Date.now();
        t.approved = true;
        t.UserId = results.createUserB.id;
        models.Transaction.create(t).done(cb);
      }],
      createTransactionD: ['cleanAndCreateApplication', 'createGroupA', 'createUserB', function(cb, results) {
        var t = utils.data('transactions1').transactions[3  ];
        t.GroupId = results.createGroupA.id;
        t.approvedAt = Date.now();
        t.approved = true;
        t.UserId = results.createUserB.id;
        t.amount = 10;
        models.Transaction.create(t).done(cb);
      }],
      createTransactionManual: ['cleanAndCreateApplication', 'createGroupA', 'createUserB', function(cb, results) {
        var t = utils.data('transactions1').transactions[2];
        t.GroupId = results.createGroupA.id;
        t.approvedAt = Date.now();
        t.approved = true;
        t.UserId = results.createUserB.id;
        t.payoutMethod = 'manual';
        models.Transaction.create(t).done(cb);
      }],
      createCardUserB: ['cleanAndCreateApplication', 'createUserB', function(cb, results) {
        models.Card.create({
          service: 'paypal',
          UserId: results.createUserB.id,
          confirmedAt: Date.now()
        }).done(cb);
      }]
    }, function(e, results) {
      expect(e).to.not.exist;
      application = results.cleanAndCreateApplication;
      application2 = results.createApplicationB;
      application3 = results.createApplicationC;
      user = results.createUserA;
      user2 = results.createUserB;
      group = results.createGroupA;
      transaction = results.createTransactionA;
      transaction2 = results.createTransactionB;
      transactionApproved = results.createTransactionC;
      transactionPositive = results.createTransactionD;
      transactionManual = results.createTransactionManual;
      done();
    });
  });

  /**
   * Pay a transaction
   */
  describe('#pay', function() {
    it('should pay a transaction', function(done) {
      request(app)
        .post('/groups/' + group.id + '/transactions/' + transactionApproved.id + '/pay/')
        .field('service', 'paypal')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(200)
        .end(function(err, res) {
          var transaction = res.body;
          expect(transaction.status).to.equal('REIMBURSED');
          expect(transaction.amount).to.equal(transactionApproved.amount);
          done();
        });
    });

    it('should pay a transaction manually', function(done) {
      request(app)
        .post('/groups/' + group.id + '/transactions/' + transactionManual.id + '/pay/')
        .field('service', 'paypal')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(200)
        .end(function(err, res) {
          var transaction = res.body;
          expect(transaction.status).to.equal('REIMBURSED');
          expect(transaction.amount).to.equal(transactionManual.amount);
          expect(transaction.payoutMethod).to.equal(transactionManual.payoutMethod);
          expect(transaction.reimbursedAt).to.be.ok;
          expect(transaction.CardId).to.equal(null);
          done();
        });
    });

    it('should fail if the transaction has a positive amount', function(done) {
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
