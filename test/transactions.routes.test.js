/**
 * Dependencies.
 */
var _ = require('lodash');
var app = require('../index');
var async = require('async');
var sinon = require('sinon');
var expect = require('chai').expect;
var request = require('supertest');
var utils = require('../test/utils.js')();

/**
 * Variables.
 */
var publicGroupData = utils.data('group1');
var privateGroupData = utils.data('group2');
var models = app.set('models');
var transactionsData = utils.data('transactions1').transactions;
var roles = require('../app/constants/roles');
var paypalMock = require('./mocks/paypal');

/**
 * Tests.
 */
describe('transactions.routes.test.js', function() {

  var privateGroup;
  var publicGroup;
  var group2;
  var user;
  var user2;
  var user3;
  var application;
  var application2;
  var application3;

  beforeEach(function(done) {
    utils.cleanAllDb(function(e, app) {
      application = app;
      done();
    });
  });

  // Create user.
  beforeEach(function(done) {
    models.User.create(utils.data('user1')).done(function(e, u) {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Create user2.
  beforeEach(function(done) {
    models.User.create(utils.data('user2')).done(function(e, u) {
      expect(e).to.not.exist;
      user2 = u;
      done();
    });
  });

  // Create user3.
  beforeEach(function(done) {
    models.User.create(utils.data('user3')).done(function(e, u) {
      expect(e).to.not.exist;
      user3 = u;
      done();
    });
  });

  // Create the group.
  beforeEach(function(done) {
    models.Group.create(privateGroupData).done(function(e, g) {
      expect(e).to.not.exist;
      privateGroup = g;
      done();
    });
  });

  // Create the group2.
  beforeEach(function(done) {
    models.Group.create(utils.data('group2')).done(function(e, g) {
      expect(e).to.not.exist;
      group2 = g;
      done();
    });
  });

  // Create the publicGroup.
  beforeEach(function(done) {
    models.Group.create(publicGroupData).done(function(e, g) {
      expect(e).to.not.exist;
      publicGroup = g;
      done();
    });
  });

  // Add user to the group.
  beforeEach(function(done) {
    privateGroup
      .addUserWithRole(user, roles.HOST)
      .done(done);
  });

  // Add user3 to the group.
  beforeEach(function(done) {
    privateGroup
      .addUserWithRole(user3, roles.MEMBER)
      .done(done);
  });


  // Add user to the group2.
  beforeEach(function(done) {
    group2
      .addUserWithRole(user, roles.HOST)
      .done(done);
  });

  // Add user to the publicGroup.
  beforeEach(function(done) {
    publicGroup
      .addUserWithRole(user, roles.HOST)
      .done(done);
  });

  // Create an application which has only access to `group`
  beforeEach(function(done) {
    models.Application.create(utils.data('application2')).done(function(e, a) {
      expect(e).to.not.exist;
      application2 = a;
      application2.addGroup(privateGroup).done(done);
    });
  });

  // Create an independent application.
  beforeEach(function(done) {
    models.Application.create(utils.data('application3')).done(function(e, a) {
      expect(e).to.not.exist;
      application3 = a;
      done();
    });
  });

  /**
   * Create.
   */
  describe('#create', function() {

    it('fails creating a transaction if no authenticated', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .send({
          transaction: transactionsData[0]
        })
        .expect(401)
        .end(done);
    });

    it('fails creating a transaction if no transaction passed', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .send({
          api_key: application2.api_key
        })
        .expect(400)
        .end(done);
    });

    it('fails creating a transaction if user has no access to the group', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .send({
          transaction: transactionsData[0]
        })
        .expect(403)
        .end(done);
    });

    it('fails creating a transaction if application has no access to the group', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .send({
          api_key: application3.api_key,
          transaction: transactionsData[0]
        })
        .expect(403)
        .end(done);
    });

    it('fails creating a transaction with wrong paymentMethod', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: _.extend({}, transactionsData[0], {paymentMethod:'lalala'})
        })
        .expect(400)
        .end(done);
    });

    it('successfully create a transaction with an application', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .send({
          api_key: application2.api_key,
          transaction: transactionsData[0]
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          var t = res.body;
          expect(t).to.have.property('id');
          expect(t).to.have.property('currency', 'USD');
          expect(t).to.have.property('vendor', transactionsData[0].vendor);
          expect(t).to.have.property('GroupId', privateGroup.id);
          expect(t).to.have.property('UserId', null); // ...
          expect(t).to.have.property('paymentMethod', transactionsData[0].paymentMethod);

          models.Activity.findAndCountAll({}).then(function(res) {
            expect(res.rows[0]).to.have.property('TransactionId', t.id);
            expect(res.count).to.equal(1);
            done();
          });

        });
    });

    it('successfully create a transaction with a user', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: transactionsData[0]
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('vat', transactionsData[0].vat);
          expect(res.body).to.have.property('GroupId', privateGroup.id);
          expect(res.body).to.have.property('UserId', user.id); // ...

          models.Activity.findAndCountAll({}).then(function(res) {
            expect(res.count).to.equal(1);
            done();
          });

        });
    });

  });

  /**
   * Update
   */
  describe('#update', function() {
    var toUpdate;

    beforeEach(function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .send({
          api_key: application2.api_key,
          transaction: transactionsData[0]
        })
        .expect(200)
        .end(function(err, res) {
          expect(err).to.not.exist;
          toUpdate = res.body;
          done();
        });
    });

    it('fails updating a non-existing transaction', function(done) {
      request(app)
        .put('/groups/' + privateGroup.id + '/transactions/' + 987123)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails updating a transaction which does not belong to the group', function(done) {
      request(app)
        .put('/groups/' + group2.id + '/transactions/' + toUpdate.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails updating a transaction if user has no access to the group', function(done) {
      request(app)
      .put('/groups/' + privateGroup.id + '/transactions/' + toUpdate.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails updating a transaction if transaction is not included', function(done) {
      request(app)
        .put('/groups/' + privateGroup.id + '/transactions/' + toUpdate.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({})
        .expect(400, {
          error: {
            code: 400,
            type: 'missing_required',
            message: 'Missing required fields',
            fields: { transaction: 'Required field transaction missing' }
          }
        })
        .end(done);
    });

    it('successfully updates a transaction', function(done) {
      var paymentMethod = 'manual';

      expect(toUpdate.paymentMethod).to.not.be.equal(paymentMethod);
      request(app)
        .put('/groups/' + privateGroup.id + '/transactions/' + toUpdate.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: {
            paymentMethod: paymentMethod
          }
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('paymentMethod', paymentMethod);
          done();
        });
    });
  });

  /**
   * Delete.
   */
  describe('#delete', function() {

    var transactions = [];

    // Create transactions.
    beforeEach(function(done) {
      async.each(transactionsData, function(transaction, cb) {
        request(app)
          .post('/groups/' + privateGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            transactions.push(res.body);
            cb();
          });
      }, done);
    });

    it('fails deleting a non-existing transaction', function(done) {
      request(app)
        .delete('/groups/' + privateGroup.id + '/transactions/' + 987123)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails deleting a transaction which does not belong to the group', function(done) {
      request(app)
        .delete('/groups/' + group2.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails deleting a transaction if user has no access to the group', function(done) {
      request(app)
      .delete('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails deleting a transaction if user is not a host', function(done) {
      request(app)
        .delete('/groups/' + group2.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(403, {
          error: {
            code: 403,
            type: 'forbidden',
            message: 'Unauthorized'
          }
        })
        .end(done);
    });

    it('successfully delete a transaction', function(done) {
      request(app)
        .delete('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          async.parallel([
            function(cb) {
              models.Transaction.find(transactions[0].id).then(function(t) {
                expect(t).to.not.exist;
                cb();
              });
            },
            function(cb) {
              models.Activity.findAndCountAll({where: {type: 'group.transaction.deleted'} }).then(function(res) {
                expect(res.count).to.equal(1);
                cb();
              });
            }

          ], done);

        });
    });

    it('successfully delete a transaction with an application', function(done) {
      request(app)
        .delete('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          done();
        });
    });

  });

  /**
   * Get one.
   */
  describe('#getOne', function() {

    var transactions = [];

    // Create transactions.
    beforeEach(function(done) {
      async.each(transactionsData, function(transaction, cb) {
        request(app)
          .post('/groups/' + privateGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            transactions.push(res.body);
            cb();
          });
      }, done);
    });

    // Create transactions for public group
    beforeEach(function(done) {
      async.each(transactionsData, function(transaction, cb) {
        request(app)
          .post('/groups/' + publicGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            transactions.push(res.body);
            cb();
          });
      }, done);
    });

    it('fails getting a non-existing transaction', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions/' + 987123)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails getting a transaction which does not belong to the group', function(done) {
      request(app)
        .get('/groups/' + group2.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails getting a transaction if user has no access to the group', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully get a transaction', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', transactions[0].id);
          done();
        });
    });

    it('successfully get a transaction with an authorized application', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', transactions[0].id);
          done();
        });
    });

    it('successfully get a transaction if the group is public', function(done) {
      request(app)
        .get('/groups/' + publicGroup.id + '/transactions/' + transactions[0].id)
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', transactions[0].id);
          done();
        });
    });

  });

  /**
   * Get group's transactions.
   */
  describe('#get', function() {

    // Create transactions for group1.
    beforeEach(function(done) {
      async.each(transactionsData, function(transaction, cb) {
        request(app)
          .post('/groups/' + privateGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            cb();
          });
      }, done);
    });

    // Create transactions for publicGroup.
    beforeEach(function(done) {
      async.each(transactionsData, function(transaction, cb) {
        request(app)
          .post('/groups/' + publicGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;

            cb();
          });
      }, done);
    });

    it('fails getting transactions for a not authorized group', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully get a group\'s transactions', function(done) {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;

          var transactions = res.body;
          expect(transactions).to.have.length(transactionsData.length);
          transactions.forEach(function(t) {
            expect(t.GroupId).to.equal(privateGroup.id);
          });

          done();

        });
    });

    it('successfully get a group\'s transactions if it is public', function(done) {
      request(app)
        .get('/groups/' + publicGroup.id + '/transactions')
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;

          var transactions = res.body;
          expect(transactions).to.have.length(transactionsData.length);
          transactions.forEach(function(t) {
            expect(t.GroupId).to.equal(publicGroup.id);
          });

          done();
        });
    });

    describe('Pagination', function() {

      var perPage = 3;

      it('successfully get a group\'s transactions with per_page', function(done) {
        request(app)
          .get('/groups/' + privateGroup.id + '/transactions')
          .send({
            per_page: perPage,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(perPage);
            expect(res.body[0].id).to.equal(1);

            // Check pagination header.
            var headers = res.headers;
            expect(headers).to.have.property('link');
            expect(headers.link).to.contain('next');
            expect(headers.link).to.contain('page=2');
            expect(headers.link).to.contain('current');
            expect(headers.link).to.contain('page=1');
            expect(headers.link).to.contain('per_page=' + perPage);
            expect(headers.link).to.contain('/groups/' + privateGroup.id + '/transactions');
            var tot = transactionsData.length;
            expect(headers.link).to.contain('/groups/' + privateGroup.id + '/transactions?page=' + Math.ceil(tot / perPage) + '&per_page=' + perPage + '>; rel="last"');

            done();
          });
      });

      it('successfully get the second page of a group\'s transactions', function(done) {
        var page = 2;
        request(app)
          .get('/groups/' + privateGroup.id + '/transactions')
          .send({
            per_page: perPage,
            page: page,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(perPage);
            expect(res.body[0].id).to.equal(perPage + 1);

            // Check pagination header.
            var headers = res.headers;
            expect(headers.link).to.contain('page=3');
            expect(headers.link).to.contain('page=2');
            done();
          });
      });

      it('successfully get a group\'s transactions using since_id', function(done) {
        var sinceId = 5;

        request(app)
          .get('/groups/' + privateGroup.id + '/transactions')
          .send({
            since_id: sinceId,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            var transactions = res.body;
            expect(transactions[0].id > sinceId).to.be.true;
            var last = 0;
            _.each(transactions, function(t) {
              expect(t.id >= last).to.be.true;
            });

            // Check pagination header.
            var headers = res.headers;
            expect(headers.link).to.be.empty;
            done();
          });

      });

    });

    describe('Sorting', function() {

      it('successfully get a group\'s transactions with sorting', function(done) {
        request(app)
          .get('/groups/' + privateGroup.id + '/transactions')
          .send({
            sort: 'createdAt',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end(function(e, res) {
            expect(e).to.not.exist;
            var transactions = res.body;
            var last = new Date(transactions[0].createdAt);
            _.each(transactions, function(a) {
              expect((new Date(a.createdAt) >= new Date(last))).to.be.true;
              last = a.createdAt;
            });

            done();
          });
      });

    });

  });

  /**
   * Approve.
   */
  describe('#approve', function() {

    var transaction;
    var transaction2;
    var expensiveTransaction;

    // Create a transaction for group1.
    beforeEach(function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: transactionsData[0]
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          models.Transaction
            .find(parseInt(res.body.id))
            .then(function(t) {
              transaction = t;
              done();
            })
            .catch(done);
        });
    });

    // Create a transaction for group2.
    beforeEach(function(done) {
      request(app)
        .post('/groups/' + group2.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: transactionsData[1]
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          models.Transaction
            .find(parseInt(res.body.id))
            .then(function(t) {
              transaction2 = t;
              done();
            })
            .catch(done);
        });
    });

    // Create a transaction for group1.
    beforeEach((done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: _.extend({}, transactionsData[1], { amount: -9999999 })
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expensiveTransaction = res.body;
          done();
        });
    });

    beforeEach((done) => {
      models.Card.create({
        service: 'paypal',
        UserId: user.id,
        token: 'abc'
      })
      .done(done);
    });

    beforeEach(function() {
      var stub = sinon.stub(app.paypalAdaptive, 'preapprovalDetails');
      stub.yields(null, paypalMock.adaptive.preapprovalDetails.completed);
    });

    afterEach(function() {
      app.paypalAdaptive.preapprovalDetails.restore();
    });


    it('fails approving a non-existing transaction', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + 123 + '/approve')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails approving a transaction that the user does not have access to', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/approve')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails approving a transaction that is not part of the group', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction2.id + '/approve')
        .send({
          approved: true
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails approving a transaction if there are no funds left', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + expensiveTransaction.id + '/approve')
        .send({
          approved: true
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(400, {
          error: {
            code: 400,
            type: 'bad_request',
            message: 'Not enough funds (2000 USD left) to approve transaction.'
          }
        })
        .end(done);
    });

    it('successfully approve a transaction', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/approve')
        .send({
          approved: true
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          models.Transaction
            .find(parseInt(transaction.id))
            .then(function(t) {
              expect(t.approved).to.be.true;
              expect(t.approvedAt).not.to.be.null;
              done();
            })
            .catch(done);
        });
    });

    it('successfully disapprove a transaction', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/approve')
        .send({
          approved: false
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          models.Transaction
            .find(parseInt(transaction.id))
            .then(function(t) {
              expect(t.approved).to.be.false;
              expect(t.approvedAt).not.to.be.null;
              done();
            })
            .catch(done);
        });
    });

    it.skip('successfully approve a transaction with an app', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/approve')
        .send({
          api_key: application2.api_key,
          approved: true
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          models.Transaction
            .find(parseInt(transaction.id))
            .then(function(t) {
              expect(t.approved).to.be.true;
              expect(t.approvedAt).not.to.be.null;
              done();
            })
            .catch(done);
        });
    });

  });

  /**
   * Attribution.
   */
  describe('#attribution', function() {

    var transaction;
    var transaction2;
    var user4; // part of Group1 as a backer

    beforeEach(function(done) {
      async.auto({
        createTransactionA: function(cb) {
          request(app)
            .post('/groups/' + privateGroup.id + '/transactions')
            .set('Authorization', 'Bearer ' + user.jwt(application))
            .send({
              transaction: transactionsData[0]
            })
            .expect(200)
            .end(function(e, res) {
              expect(e).to.not.exist;
              models.Transaction
                .find(parseInt(res.body.id))
                .done(cb);
            });
        },
        createTransactionB: function(cb) {
          request(app)
            .post('/groups/' + group2.id + '/transactions')
            .set('Authorization', 'Bearer ' + user.jwt(application))
            .send({
              transaction: transactionsData[1]
            })
            .expect(200)
            .end(function(e, res) {
              expect(e).to.not.exist;
              models.Transaction
                .find(parseInt(res.body.id))
                .done(cb);
            });
        },
        createUserD: function(cb) {
          models.User.create(utils.data('user4')).done(cb);
        },
        addUserDGroupA: ['createUserD', function(cb, results) {
          privateGroup
            .addUserWithRole(results.createUserD, roles.BACKER)
            .done(cb);
        }]
      }, function(e, results) {
        expect(e).to.not.exist;
        transaction = results.createTransactionA;
        transaction2 = results.createTransactionB;
        user4 = results.createUserD;
        done();
      });
    });

    it('fails attributing a non-existing transaction', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + 123 + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails attributing a transaction that is not part of the group', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction2.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails attributing a transaction that the user does not have access to [backer of the group]', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user4.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails attributing a transaction that the user does not have access to [not part of the group]', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully attribute another user\'s transaction if member', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(200)
        .end(done);
    });

    it('successfully attribute a transaction [host]', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          models.Transaction
            .find(parseInt(transaction.id))
            .then(function(t) {
              expect(t.UserId).to.equal(user4.id);
              done();
            })
            .catch(done);
        });
    });

    it('successfully attribute a transaction with an app', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end(function(e, res) {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          models.Transaction
            .find(parseInt(transaction.id))
            .then(function(t) {
              expect(t.UserId).to.equal(user4.id);
              done();
            })
            .catch(done);
        });
    });

    it('fails attributing a transaction with a non authorized app', function(done) {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .send({
          api_key: application3.api_key
        })
        .expect(403)
        .end(done);
    });

  });

});
