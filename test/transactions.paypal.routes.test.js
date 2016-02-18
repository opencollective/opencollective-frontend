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
        t.paymentMethod = 'manual';
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
   * Get the Paypal Pay Key for a transaction.
   */
  describe('#getPayKey', function() {

    it('should fail if the user is a viewer', function(done) {
      request(app)
        .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('should fail if the application does not have access to the group', function(done) {
      request(app)
        .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
        .send({
          api_key: application2.api_key
        })
        .expect(403)
        .end(done);
    });

    it('should fail if the transaction does not have a user linked', function(done) {
      request(app)
        .get('/groups/' + group.id + '/transactions/' + transaction2.id + '/paykey')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(400)
        .end(function(err, res) {
          var err = JSON.parse(res.error.text).error.message;
          expect(err).to.contain('A user has to be attached to the transaction to be reimburse.');
          done();
        });
    });

    it('should get a transaction\'s pay key', function(done) {
      request(app)
        .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(200)
        .end(function(e, res) {
          var body = res.body;
          expect(e).to.not.exist;
          expect(body).to.have.property('payKey', paypalMock.adaptive.pay.payKey);
          expect(body).to.have.property('transactionId', transaction.id);

          models.Paykey
            .findAndCountAll({})
            .then(function(res) {
              expect(res.count).to.equal(1);
              var paykey = res.rows[0];
              expect(paykey).to.have.property('id');
              expect(paykey).to.have.property('trackingId');
              expect(paykey).to.have.property('paykey', paypalMock.adaptive.pay.payKey);
              expect(paykey).to.have.property('status', paypalMock.adaptive.pay.paymentExecStatus);
              expect(paykey).to.have.property('payload');
              expect(paykey.payload.trackingId).to.equal(paykey.trackingId);
              expect(paykey).to.have.property('error');
              expect(paykey).to.have.property('TransactionId', transaction.id);
              expect(paykey.data.payload).to.deep.equal(body.payload);
              expect(paykey.data.totalAmountExceeded).to.deep.equal(body.totalAmountExceeded);
              done();
            })
            .catch(done);
        });
    });

    it('should get a transaction\'s pay key with a api_key that has access to the group', function(done) {
      request(app)
        .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
        .send({
          api_key: application3.api_key
        })
        .expect(200)
        .end(done);
    });

    it('should get a transaction\'s pay key and use the paypal email instead of the email', function(done) {
      request(app)
      .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
      .send({
        api_key: application3.api_key
      })
      .expect(200)
      .end(function(err, res) {
        models.Paykey
          .findAndCountAll({})
          .then(function(res) {
            expect(res.count).to.equal(1);
            var paykey = res.rows[0];
            expect(paykey).to.have.property('payload');

            var receiver = paykey.payload.receiverList.receiver;
            expect(receiver[0]).have.property('email', utils.data('user1').paypalEmail);
            done();
          })
          .catch(done);
      });
    });

    describe('Check existing paykey', function() {

      describe('no existing paykeys', function() {

        beforeEach(function() {
          var stub = sinon.stub(app.paypalAdaptive, 'paymentDetails');
          stub.withArgs({paykey: paypalMock.adaptive.paymentDetails.created.payKey});
          stub.yields(null, paypalMock.adaptive.paymentDetails.created);
        });

        afterEach(function() {
          app.paypalAdaptive.paymentDetails.restore();
        });

        it('should returns a new paykey if none are completed', function(done) {
          request(app)
            .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
            .set('Authorization', 'Bearer ' + user2.jwt(application))
            .expect(200)
            .end(function(e, res) {
              expect(e).to.not.exist;
              expect(res.body).to.have.property('payKey', paypalMock.adaptive.pay.payKey);
              done();
            });
        });

      });

      describe('existing CREATED paykeys in the database', function() {

        var pks = ['pk1', 'pk2'];
        var stub;

        beforeEach(function() {
          stub = sinon.stub(app.paypalAdaptive, 'paymentDetails');
        });

        beforeEach(function(done) {
          async.eachSeries(pks, function(pk, cb) {

            // Create stub for that paykey.
            stub.withArgs({paykey: pk});
            stub.yields(null, paypalMock.adaptive.paymentDetails.created);

            // Create the paykey in the database.
            models.Paykey.create({
              paykey: pk,
              status: 'CREATED',
              TransactionId: transaction.id
            }).done(cb);
          }, done);
        });

        afterEach(function() {
          app.paypalAdaptive.paymentDetails.restore();
        });

        it('should delete the old paykeys not completed and returns a new one', function(done) {
          request(app)
            .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
            .set('Authorization', 'Bearer ' + user2.jwt(application))
            .expect(200)
            .end(function(e, res) {
              expect(e).to.not.exist;
              expect(res.body).to.have.property('payKey', paypalMock.adaptive.pay.payKey);

              models.Paykey
                .findAndCountAll({})
                .then(function(res) {
                  expect(res.count).to.equal(1);
                  done();
                })
                .catch(done);
            });
        });

      });

      describe('existing COMPLETED paykeys in the database', function() {

        var pk = 'pk1';
        var stub;

        beforeEach(function() {
          stub = sinon.stub(app.paypalAdaptive, 'paymentDetails');
        });

        beforeEach(function(done) {
          stub.withArgs({paykey: pk})
          stub.yields(null, paypalMock.adaptive.paymentDetails.completed);

          models.Paykey.create({
            paykey: pk,
            status: 'COMPLETED',
            TransactionId: transaction.id
          }).done(done);
        });

        afterEach(function() {
          app.paypalAdaptive.paymentDetails.restore();
        });

        it('should returns an error if one paykey has been completed', function(done) {
          request(app)
            .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
            .set('Authorization', 'Bearer ' + user2.jwt(application))
            .expect(400)
            .end(function(e, res) {
              expect(e).to.not.exist;
              expect(res.text).to.contain('This transaction has been paid already.');

              async.auto({
                checkPaykey: function(cb) {
                  models.Paykey.findAndCountAll({where: {paykey: pk} }).then(function(res) {
                    expect(res.count).to.equal(1);
                    expect(res.rows[0].status).to.equal('COMPLETED');
                    cb();
                  });
                },
                checkTransaction: function(cb) {
                  models.Transaction.findAndCountAll({where: {id: transaction.id} }).then(function(res) {
                    expect(res.count).to.equal(1);
                    expect(res.rows[0].status).to.equal('COMPLETED');
                    expect(res.rows[0].reimbursedAt).not.to.be.null;
                    cb();
                  });
                },
                checkActivity: function(cb) {
                  models.Activity.findAndCountAll({where: {type: activities.GROUP_TRANSANCTION_PAID} }).then(function(res) {
                    expect(res.count).to.equal(1);
                    cb();
                  });
                }
              }, done);
            });
        });

      });

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
          expect(transaction.paymentMethod).to.equal(transactionManual.paymentMethod);
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

  /**
   * Confirm a paypal transaction.
   */
  describe('#confirmPayment', function() {

    var paykey = paypalMock.adaptive.pay.payKey;

    beforeEach(function(done) {
      request(app)
        .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(200)
        .end(done);
    });

    describe('Details from Paypal COMPLETED', function() {

      beforeEach(function() {
        var stub = sinon.stub(app.paypalAdaptive, 'paymentDetails');
        stub.yields(null, paypalMock.adaptive.paymentDetails.completed);
      });

      afterEach(function() {
        app.paypalAdaptive.paymentDetails.restore();
      });

      it('should fail if the user is a viewer', function(done) {
        request(app)
          .post('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey/' + paykey)
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(403)
          .end(done);
      });

      it('should fail if the application does not have access to the group', function(done) {
        request(app)
          .post('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey/' + paykey)
          .send({
            api_key: application2.api_key
          })
          .expect(403)
          .end(done);
      });

      it('should fail with an unknown paykey', function(done) {
        request(app)
          .post('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey/' + 'abc')
          .set('Authorization', 'Bearer ' + user2.jwt(application))
          .expect(404)
          .end(done);
      });

      it('should confirm the payment of a transaction', function(done) {
        request(app)
          .post('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey/' + paykey)
          .set('Authorization', 'Bearer ' + user2.jwt(application))
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            expect(res.body.id).to.equal(transaction.id);
            expect(res.body.status).to.equal('COMPLETED');

            async.auto({
              checkPaykey: function(cb) {
                models.Paykey.findAndCountAll({where: {paykey: paykey} }).then(function(res) {
                  expect(res.count).to.equal(1);
                  expect(res.rows[0].status).to.equal('COMPLETED');
                  cb();
                });
              },
              checkTransaction: function(cb) {
                models.Transaction.findAndCountAll({where: {id: transaction.id} }).then(function(res) {
                  expect(res.count).to.equal(1);
                  expect(res.rows[0].status).to.equal('COMPLETED');
                  expect(res.rows[0].reimbursedAt).not.to.be.null;
                  cb();
                });
              },
              checkActivity: function(cb) {
                models.Activity.findAndCountAll({where: {type: activities.GROUP_TRANSANCTION_PAID} }).then(function(res) {
                  expect(res.count).to.equal(1);
                  cb();
                });
              }
            }, done);

          });
      });

      it('should confirm the payment with a api_key that has access to the group', function(done) {
        request(app)
          .post('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey/' + paykey)
          .send({
            api_key: application3.api_key
          })
          .expect(200)
          .end(done);
      });

    });

    describe('Details from Paypal CREATED', function() {

      beforeEach(function() {
        var stub = sinon.stub(app.paypalAdaptive, 'paymentDetails');
        stub.yields(null, paypalMock.adaptive.paymentDetails.created);
      });

      afterEach(function() {
        app.paypalAdaptive.paymentDetails.restore();
      });

      it('should return an error if the payment is not completed', function(done) {
        request(app)
          .post('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey/' + paykey)
          .set('Authorization', 'Bearer ' + user2.jwt(application))
          .expect(400)
          .end(done);
      });

    });

    describe('Details from Paypal ERROR', function() {

      beforeEach(function() {
        var stub = sinon.stub(app.paypalAdaptive, 'paymentDetails');
        stub.yields(null, paypalMock.adaptive.paymentDetails.error);
      });

      afterEach(function() {
        app.paypalAdaptive.paymentDetails.restore();
      });

      it('should return an error if paypal returns one', function(done) {
        request(app)
          .post('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey/' + paykey)
          .set('Authorization', 'Bearer ' + user2.jwt(application))
          .expect(400)
          .end(done);
      });

    });

    describe('Paykeys clean up', function() {
      this.timeout(10000);

      beforeEach(function(done) {
        async.eachSeries(['AP-791807008W699005B', 'AP-791807008W699005C'], function(pk, cb) {
          var response = _.clone(paypalMock.adaptive.pay);
          response.payKey = pk;

          app.paypalAdaptive.pay.restore();
          var stub = sinon.stub(app.paypalAdaptive, 'pay');
          stub.yields(null, response);

          request(app)
            .get('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey')
            .set('Authorization', 'Bearer ' + user2.jwt(application))
            .expect(200)
            .end(function(e) {
              expect(e).to.not.exist;
              cb();
            });
        }, done);
      });

      beforeEach(function() {
        var stub = sinon.stub(app.paypalAdaptive, 'paymentDetails');
        stub.yields(null, paypalMock.adaptive.paymentDetails.completed);
      });

      afterEach(function() {
        app.paypalAdaptive.paymentDetails.restore();
      });

      it('should delete all other paykey entries in the database to clean up', function(done) {
        request(app)
          .post('/groups/' + group.id + '/transactions/' + transaction.id + '/paykey/' + paykey)
          .set('Authorization', 'Bearer ' + user2.jwt(application))
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            models.Paykey.findAndCountAll({where: {TransactionId: transaction.id} }).then(function(res) {
              expect(res.count).to.equal(1);
              expect(res.rows[0].status).to.equal('COMPLETED');
              done();
            });
          });
      });

    });

  });

});
