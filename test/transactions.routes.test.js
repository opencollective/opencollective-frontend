/**
 * Dependencies.
 */
const _ = require('lodash');
const app = require('../index');
const async = require('async');
const sinon = require('sinon');
const expect = require('chai').expect;
const request = require('supertest');
const config = require('config');
const utils = require('../test/utils.js')();

/**
 * Variables.
 */
var publicGroupData = utils.data('group1');
var privateGroupData = utils.data('group2');
var models = app.set('models');
var transactionsData = utils.data('transactions1').transactions;
var roles = require('../server/constants/roles');
var paypalMock = require('./mocks/paypal');

/**
 * Tests.
 */
describe('transactions.routes.test.js', () => {

  var privateGroup;
  var publicGroup;
  var group2;
  var user;
  var user2;
  var user3;
  var application;
  var application2;
  var application3;
  var sandbox = sinon.sandbox.create();

  beforeEach((done) => {
    utils.cleanAllDb((e, app) => {
      application = app;
      done();
    });
  });

  // Create a stub for clearbit
  beforeEach((done) => {
    utils.clearbitStubBeforeEach(sandbox);
    done();
  });

  // Create user.
  beforeEach((done) => {
    models.User.create(utils.data('user1')).done((e, u) => {
      expect(e).to.not.exist;
      user = u;
      done();
    });
  });

  // Create user2.
  beforeEach((done) => {
    models.User.create(utils.data('user2')).done((e, u) => {
      expect(e).to.not.exist;
      user2 = u;
      done();
    });
  });

  // Create user3.
  beforeEach((done) => {
    models.User.create(utils.data('user3')).done((e, u) => {
      expect(e).to.not.exist;
      user3 = u;
      done();
    });
  });

  // Create the group.
  beforeEach((done) => {
    models.Group.create(privateGroupData).done((e, g) => {
      expect(e).to.not.exist;
      privateGroup = g;
      done();
    });
  });

  // Create the group2.
  beforeEach((done) => {
    models.Group.create(utils.data('group2')).done((e, g) => {
      expect(e).to.not.exist;
      group2 = g;
      done();
    });
  });

  // Create the publicGroup.
  beforeEach((done) => {
    models.Group.create(publicGroupData).done((e, g) => {
      expect(e).to.not.exist;
      publicGroup = g;
      done();
    });
  });

  // Add user to the group.
  beforeEach((done) => {
    privateGroup
      .addUserWithRole(user, roles.HOST)
      .done(done);
  });

  // Add user3 to the group.
  beforeEach((done) => {
    privateGroup
      .addUserWithRole(user3, roles.MEMBER)
      .done(done);
  });


  // Add user to the group2.
  beforeEach((done) => {
    group2
      .addUserWithRole(user, roles.HOST)
      .done(done);
  });

  // Add user to the publicGroup.
  beforeEach((done) => {
    publicGroup
      .addUserWithRole(user, roles.HOST)
      .done(done);
  });

  // Create an application which has only access to `group`
  beforeEach((done) => {
    models.Application.create(utils.data('application2')).done((e, a) => {
      expect(e).to.not.exist;
      application2 = a;
      application2.addGroup(privateGroup).done(done);
    });
  });

  // Create an independent application.
  beforeEach((done) => {
    models.Application.create(utils.data('application3')).done((e, a) => {
      expect(e).to.not.exist;
      application3 = a;
      done();
    });
  });

  afterEach(() => {
    utils.clearbitStubAfterEach(sandbox);
  });

  /**
   * Create.
   */
  // TODO remove #postmigration, replaced by expenses.routes.test.js
  describe('#create', () => {

    it('fails creating a transaction if no authenticated', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .send({
          transaction: transactionsData[0]
        })
        .expect(401)
        .end(done);
    });

    it('fails creating a transaction if no transaction passed', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .send({
          api_key: application2.api_key
        })
        .expect(400)
        .end((e,res) => {
          expect(res.body.error.type).to.equal('missing_required');
          expect(res.body.error.fields).to.have.property('transaction');
          done();
        });
    });

    it('fails creating a transaction if user has no access to the group', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .send({
          transaction: transactionsData[0]
        })
        .expect(403)
        .end(done);
    });

    it('fails creating a transaction if application has no access to the group', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .send({
          api_key: application3.api_key,
          transaction: transactionsData[0]
        })
        .expect(403)
        .end(done);
    });

    it('fails creating a transaction with wrong payoutMethod', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: _.extend({}, transactionsData[0], {payoutMethod:'lalala'})
        })
        .expect(400)
        .end(done);
    });

    it('successfully create a transaction with an application', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application2))
        .send({
          api_key: application2.api_key,
          transaction: transactionsData[0]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          var t = res.body;
          expect(t).to.have.property('id');
          expect(t).to.have.property('currency', 'USD');
          expect(t).to.have.property('vendor', transactionsData[0].vendor);
          expect(t).to.have.property('GroupId', privateGroup.id);
          expect(t).to.have.property('UserId', user.id); // ...
          expect(t).to.have.property('payoutMethod', transactionsData[0].payoutMethod);

          models.Activity.findAndCountAll({}).then(res => {
            expect(res.count).to.equal(1);
            const activity = res.rows[0].get();
            expect(activity).to.have.property('type', 'group.transaction.created');
            expect(activity).to.have.property('GroupId', privateGroup.id);
            expect(activity).to.have.property('UserId', user.id);
            expect(activity).to.have.property('TransactionId', t.id);
            expect(activity.data.transaction).to.have.property('id', t.id);
            expect(activity.data.group).to.have.property('id', privateGroup.id);
            expect(activity.data.user).to.have.property('id', user.id);
            done();
          });

        });
    });

    it('successfully create a transaction with a user', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: transactionsData[0]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('vat', transactionsData[0].vat);
          expect(res.body).to.have.property('GroupId', privateGroup.id);
          expect(res.body).to.have.property('UserId', user.id); // ...

          models.Activity.findAndCountAll({}).then((res) => {
            expect(res.count).to.equal(1);
            done();
          });

        });
    });

    it('successfully creates a transaction without a user', (done) => {
      request(app)
        .post('/groups/' + publicGroup.id + '/transactions')
        .send({
          api_key: application.api_key,
          transaction: transactionsData[7]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.UserId > 0).to.be.true;
          expect(res.body).to.have.property('GroupId', publicGroup.id);

          models.Activity.findAndCountAll({}).then((res) => {
            // 2 activities: `user.created` and `group.transaction.created`
            expect(res.count).to.equal(2);
            done();
          });
        });
    });

    it('successfully creates a transaction with a logged out user', (done) => {
      const transaction = _.merge({}, transactionsData[7]);
      transaction.email = user.email;
      transaction.paypalEmail = null;

      request(app)
        .post('/groups/' + publicGroup.id + '/transactions')
        .send({
          api_key: application.api_key,
          transaction: transaction
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.UserId).to.equal(user.id);
          expect(res.body).to.have.property('GroupId', publicGroup.id);

          models.Activity.findAndCountAll({}).then((res) => {
            // 1 activity: `group.transaction.created`
            expect(res.count).to.equal(1);
            done();
          });
        });
    });

    it('successfully creates a transaction with a logged out user with its paypalEmail', (done) => {
      const transaction = _.merge({}, transactionsData[7]);
      transaction.email = null;
      transaction.paypalEmail = user.paypalEmail;

      request(app)
        .post('/groups/' + publicGroup.id + '/transactions')
        .send({
          api_key: application.api_key,
          transaction: transaction
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.UserId).to.equal(user.id);
          expect(res.body).to.have.property('GroupId', publicGroup.id);

          models.Activity.findAndCountAll({}).then((res) => {
            // 1 activity: `group.transaction.created`
            expect(res.count).to.equal(1);
            done();
          });
        });
    });

    it('fails to create a transaction without a user if group is private', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .send({
          api_key: application.api_key,
          transaction: transactionsData[7]
        })
        .expect(403)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.error.type).to.equal('forbidden');
          console.log("res: ", res.body);
          done();
        });
    });
  });

  /**
   * Update
   */
  describe('#update', () => {
    var toUpdate;

    beforeEach((done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application2))
        .send({
          api_key: application2.api_key,
          transaction: transactionsData[0]
        })
        .expect(200)
        .end((err, res) => {
          expect(err).to.not.exist;
          toUpdate = res.body;
          done();
        });
    });

    it('fails updating a non-existing transaction', (done) => {
      request(app)
        .put('/groups/' + privateGroup.id + '/transactions/' + 987123)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails updating a transaction which does not belong to the group', (done) => {
      request(app)
        .put('/groups/' + group2.id + '/transactions/' + toUpdate.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails updating a transaction if user has no access to the group', (done) => {
      request(app)
      .put('/groups/' + privateGroup.id + '/transactions/' + toUpdate.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails updating a transaction if transaction is not included', (done) => {
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

    it('successfully updates a transaction', (done) => {
      var payoutMethod = 'manual';

      expect(toUpdate.payoutMethod).to.not.be.equal(payoutMethod);
      request(app)
        .put('/groups/' + privateGroup.id + '/transactions/' + toUpdate.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: {
            payoutMethod: payoutMethod
          }
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('payoutMethod', payoutMethod);
          done();
        });
    });
  });

  /**
   * Delete.
   */
  describe('#delete', () => {

    var transactions = [];

    // Create transactions.
    beforeEach((done) => {
      async.each(transactionsData, (transaction, cb) => {
        request(app)
          .post('/groups/' + privateGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            transactions.push(res.body);
            cb();
          });
      }, done);
    });

    it('fails deleting a non-existing transaction', (done) => {
      request(app)
        .delete('/groups/' + privateGroup.id + '/transactions/' + 987123)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails deleting a transaction which does not belong to the group', (done) => {
      request(app)
        .delete('/groups/' + group2.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails deleting a transaction if user has no access to the group', (done) => {
      request(app)
      .delete('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails deleting a transaction if user is not a host', (done) => {
      request(app)
        .delete('/groups/' + group2.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(403, {
          error: {
            code: 403,
            type: 'forbidden',
            message: 'Forbidden'
          }
        })
        .end(done);
    });

    it('successfully delete a transaction', (done) => {
      request(app)
        .delete('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          async.parallel([
            (cb) => {
              models.Transaction.find(transactions[0].id).then((t) => {
                expect(t).to.not.exist;
                cb();
              });
            },
            (cb) => {
              models.Activity.findAndCountAll({where: {type: 'group.transaction.deleted'} }).then((res) => {
                expect(res.count).to.equal(1);
                cb();
              });
            }

          ], done);

        });
    });

    it('successfully delete a transaction with an application', (done) => {
      request(app)
        .delete('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          done();
        });
    });

  });

  /**
   * Get one.
   */
  describe('#getOne', () => {

    var transactions = [];

    // Create transactions.
    beforeEach((done) => {
      async.each(transactionsData, (transaction, cb) => {
        request(app)
          .post('/groups/' + privateGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            transactions.push(res.body);
            cb();
          });
      }, done);
    });

    // Create transactions for public group
    beforeEach((done) => {
      async.each(transactionsData, (transaction, cb) => {
        request(app)
          .post('/groups/' + publicGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            transactions.push(res.body);
            cb();
          });
      }, done);
    });

    it('fails getting a non-existing transaction', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions/' + 987123)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails getting a transaction which does not belong to the group', (done) => {
      request(app)
        .get('/groups/' + group2.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails getting a transaction if user has no access to the group', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully get a transaction', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', transactions[0].id);
          done();
        });
    });

    it('successfully get a transaction with an authorized application', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions/' + transactions[0].id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', transactions[0].id);
          done();
        });
    });

    it('successfully get a transaction if the group is public', (done) => {
      request(app)
        .get('/groups/' + publicGroup.id + '/transactions/' + transactions[0].id)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', transactions[0].id);
          done();
        });
    });

  });

  /**
   * Get group's transactions.
   */
  describe('#get', () => {

    // Create transactions for group1.
    beforeEach((done) => {
      async.each(transactionsData, (transaction, cb) => {
        request(app)
          .post('/groups/' + privateGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            cb();
          });
      }, done);
    });

    // Create transactions for publicGroup.
    beforeEach((done) => {
      async.each(transactionsData, (transaction, cb) => {
        request(app)
          .post('/groups/' + publicGroup.id + '/transactions')
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .send({
            transaction: transaction
          })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;

            cb();
          });
      }, done);
    });

    it('fails getting transactions for a not authorized group', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully get a group\'s transactions', (done) => {
      request(app)
        .get('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          var transactions = res.body;
          expect(transactions).to.have.length(transactionsData.length);
          transactions.forEach((t) => {
            expect(t.GroupId).to.equal(privateGroup.id);
          });

          done();

        });
    });

    it('successfully get a group\'s transactions if it is public', (done) => {
      request(app)
        .get('/groups/' + publicGroup.id + '/transactions')
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          var transactions = res.body;
          expect(transactions).to.have.length(transactionsData.length);
          transactions.forEach((t) => {
            expect(t.GroupId).to.equal(publicGroup.id);
          });

          done();
        });
    });

    describe('Pagination', () => {

      var perPage = 3;

      it('successfully get a group\'s transactions with per_page', (done) => {
        request(app)
          .get('/groups/' + privateGroup.id + '/transactions')
          .send({
            per_page: perPage,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end((e, res) => {
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

      it('successfully get the second page of a group\'s transactions', (done) => {
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
          .end((e, res) => {
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

      it('successfully get a group\'s transactions using since_id', (done) => {
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
          .end((e, res) => {
            expect(e).to.not.exist;
            var transactions = res.body;
            expect(transactions[0].id > sinceId).to.be.true;
            var last = 0;
            _.each(transactions, (t) => {
              expect(t.id >= last).to.be.true;
            });

            // Check pagination header.
            var headers = res.headers;
            expect(headers.link).to.be.empty;
            done();
          });

      });

    });

    describe('Sorting', () => {

      it('successfully get a group\'s transactions with sorting', (done) => {
        request(app)
          .get('/groups/' + privateGroup.id + '/transactions')
          .send({
            sort: 'createdAt',
            direction: 'asc'
          })
          .set('Authorization', 'Bearer ' + user.jwt(application))
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            var transactions = res.body;
            var last = new Date(transactions[0].createdAt);
            _.each(transactions, (a) => {
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
  // TODO remove #postmigration, replaced by expenses.routes.test.js
  describe('#approve', () => {

    var transaction;
    var transaction2;
    var expensiveTransaction;

    // Create a transaction for group1.
    beforeEach((done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: transactionsData[0]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          models.Transaction
            .find(parseInt(res.body.id))
            .then((t) => {
              transaction = t;
              done();
            })
            .catch(done);
        });
    });

    // Create a transaction for group2.
    beforeEach((done) => {
      request(app)
        .post('/groups/' + group2.id + '/transactions')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .send({
          transaction: transactionsData[1]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          models.Transaction
            .find(parseInt(res.body.id))
            .then((t) => {
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
        .end((e, res) => {
          expect(e).to.not.exist;
          expensiveTransaction = res.body;
          done();
        });
    });

    beforeEach((done) => {
      models.PaymentMethod.create({
        service: 'paypal',
        UserId: user.id,
        token: 'abc'
      })
      .done(done);
    });

    beforeEach(() => {
      var stub = sinon.stub(app.paypalAdaptive, 'preapprovalDetails');
      stub.yields(null, paypalMock.adaptive.preapprovalDetails.completed);
    });

    afterEach(() => {
      app.paypalAdaptive.preapprovalDetails.restore();
    });


    it('fails approving a non-existing transaction', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + 123 + '/approve')
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails approving a transaction that the user does not have access to', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/approve')
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails approving a transaction that is not part of the group', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction2.id + '/approve')
        .send({
          approved: true
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails approving a transaction if there are no funds left', (done) => {
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

    it('successfully approve a transaction', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/approve')
        .send({
          approved: true
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          models.Transaction
            .find(parseInt(transaction.id))
            .then((t) => {
              expect(t.approved).to.be.true;
              expect(t.approvedAt).not.to.be.null;
              done();
            })
            .catch(done);
        });
    });

    it('successfully disapprove a transaction', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/approve')
        .send({
          approved: false
        })
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          models.Transaction
            .find(parseInt(transaction.id))
            .then((t) => {
              expect(t.approved).to.be.false;
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
  describe('#attribution', () => {

    var transaction;
    var transaction2;
    var user4; // part of Group1 as a backer

    beforeEach((done) => {
      async.auto({
        createTransactionA: (cb) => {
          request(app)
            .post('/groups/' + privateGroup.id + '/transactions')
            .set('Authorization', 'Bearer ' + user.jwt(application))
            .send({
              transaction: transactionsData[0]
            })
            .expect(200)
            .end((e, res) => {
              expect(e).to.not.exist;
              models.Transaction
                .find(parseInt(res.body.id))
                .done(cb);
            });
        },
        createTransactionB: (cb) => {
          request(app)
            .post('/groups/' + group2.id + '/transactions')
            .set('Authorization', 'Bearer ' + user.jwt(application))
            .send({
              transaction: transactionsData[1]
            })
            .expect(200)
            .end((e, res) => {
              expect(e).to.not.exist;
              models.Transaction
                .find(parseInt(res.body.id))
                .done(cb);
            });
        },
        createUserD: (cb) => {
          models.User.create(utils.data('user4')).done(cb);
        },
        addUserDGroupA: ['createUserD', (cb, results) => {
          privateGroup
            .addUserWithRole(results.createUserD, roles.BACKER)
            .done(cb);
        }]
      }, (e, results) => {
        expect(e).to.not.exist;
        transaction = results.createTransactionA;
        transaction2 = results.createTransactionB;
        user4 = results.createUserD;
        done();
      });
    });

    it('fails attributing a non-existing transaction', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + 123 + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(404)
        .end(done);
    });

    it('fails attributing a transaction that is not part of the group', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction2.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails attributing a transaction that the user does not have access to [backer of the group]', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user4.jwt(application))
        .expect(403)
        .end(done);
    });

    it('fails attributing a transaction that the user does not have access to [not part of the group]', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user2.jwt(application))
        .expect(403)
        .end(done);
    });

    it('successfully attribute another user\'s transaction if member', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user3.jwt(application))
        .expect(200)
        .end(done);
    });

    it('successfully attribute a transaction [host]', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .set('Authorization', 'Bearer ' + user.jwt(application))
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          models.Transaction
            .find(parseInt(transaction.id))
            .then((t) => {
              expect(t.UserId).to.equal(user4.id);
              done();
            })
            .catch(done);
        });
    });

    it('successfully attribute a transaction with an app', (done) => {
      request(app)
        .post('/groups/' + privateGroup.id + '/transactions/' + transaction.id + '/attribution/' + user4.id)
        .send({
          api_key: application2.api_key
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);
          models.Transaction
            .find(parseInt(transaction.id))
            .then((t) => {
              expect(t.UserId).to.equal(user4.id);
              done();
            })
            .catch(done);
        });
    });

    it('fails attributing a transaction with a non authorized app', (done) => {
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
