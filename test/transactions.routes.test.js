/**
 * Dependencies.
 */
const _ = require('lodash');
const app = require('../server/index');
const async = require('async');
const sinon = require('sinon');
const expect = require('chai').expect;
const request = require('supertest');
const utils = require('../test/utils.js')();

/**
 * Variables.
 */
const publicGroupData = utils.data('group1');
const privateGroupData = utils.data('group2');
const models = app.set('models');
const transactionsData = utils.data('transactions1').transactions;
const roles = require('../server/constants/roles');

/**
 * Tests.
 */
describe('transactions.routes.test.js', () => {

  let privateGroup;
  let publicGroup;
  let group2;
  let user;
  let user2;
  let user3;
  let application;
  let application2;
  let application3;
  const sandbox = sinon.sandbox.create();

  beforeEach(() => utils.cleanAllDb().tap(a => application = a));

  // Create a stub for clearbit
  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  // Create user.
  beforeEach(() => models.User.create(utils.data('user1')).tap(u => user = u));

  // Create user2.
  beforeEach(() => models.User.create(utils.data('user2')).tap(u => user2 = u));

  // Create user3.
  beforeEach(() => models.User.create(utils.data('user3')).tap(u => user3 = u));

  // Create the group.
  beforeEach(() => models.Group.create(privateGroupData).tap(g => privateGroup = g));

  // Create the group2.
  beforeEach(() => models.Group.create(_.omit(utils.data('group2'), ['slug'])).tap(g => group2 = g));

  // Create the publicGroup.
  beforeEach(() => models.Group.create(publicGroupData).tap(g => publicGroup = g));

  // Add user to the group.
  beforeEach(() => privateGroup.addUserWithRole(user, roles.HOST));

  // Add user3 to the group.
  beforeEach(() => privateGroup.addUserWithRole(user3, roles.MEMBER));

  // Add user to the group2.
  beforeEach(() => group2.addUserWithRole(user, roles.HOST));

  // Add user to the publicGroup.
  beforeEach(() => publicGroup.addUserWithRole(user, roles.HOST));

  // Create an application which has only access to `group`
  beforeEach(() => models.Application.create(utils.data('application2'))
    .tap(a => application2 = a)
    .then(() => application2.addGroup(privateGroup)));

  // Create an independent application.
  beforeEach(() => models.Application.create(utils.data('application3')).tap(a => application3 = a));

  beforeEach(() => models.PaymentMethod.create({UserId: user.id}))


  afterEach(() => utils.clearbitStubAfterEach(sandbox));

  /**
   * Create.
   */
  // TODO remove #postmigration, replaced by expenses.routes.test.js
  describe('#create', () => {

    it('fails creating a transaction if no authenticated', (done) => {
      request(app)
        .post(`/groups/${privateGroup.id}/transactions`)
        .send({
          transaction: transactionsData[0]
        })
        .expect(401)
        .end(done);
    });

    it('fails creating a transaction if no transaction passed', (done) => {
      request(app)
        .post(`/groups/${privateGroup.id}/transactions`)
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
        .post(`/groups/${privateGroup.id}/transactions`)
        .set('Authorization', `Bearer ${user2.jwt(application)}`)
        .send({
          transaction: transactionsData[0]
        })
        .expect(403)
        .end(done);
    });

    it('fails creating a transaction if application has no access to the group', (done) => {
      request(app)
        .post(`/groups/${privateGroup.id}/transactions`)
        .send({
          api_key: application3.api_key,
          transaction: transactionsData[0]
        })
        .expect(403)
        .end(done);
    });

    it('fails creating a transaction with wrong payoutMethod', (done) => {
      request(app)
        .post(`/groups/${privateGroup.id}/transactions`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .send({
          transaction: _.extend({}, transactionsData[0], {payoutMethod:'lalala'})
        })
        .expect(400)
        .end(done);
    });

    it('successfully create a transaction with an application', (done) => {
      request(app)
        .post(`/groups/${privateGroup.id}/transactions`)
        .set('Authorization', `Bearer ${user.jwt(application2)}`)
        .send({
          api_key: application2.api_key,
          transaction: transactionsData[0]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const t = res.body;
          expect(t).to.have.property('id');
          expect(t).to.have.property('currency', 'USD');
          expect(t).to.have.property('vendor', transactionsData[0].vendor);
          expect(t).to.have.property('GroupId', privateGroup.id);
          expect(t).to.have.property('UserId', user.id); // ...
          expect(t).to.have.property('payoutMethod', transactionsData[0].payoutMethod);
          done();
        });
    });

    it('successfully create a transaction with a user', (done) => {
      request(app)
        .post(`/groups/${privateGroup.id}/transactions`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .send({
          transaction: transactionsData[0]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('vat', transactionsData[0].vat);
          expect(res.body).to.have.property('GroupId', privateGroup.id);
          expect(res.body).to.have.property('UserId', user.id); // ...
          done();
        });
    });

    it('successfully creates a transaction without a user', (done) => {
      request(app)
        .post(`/groups/${publicGroup.id}/transactions`)
        .send({
          api_key: application.api_key,
          transaction: transactionsData[7]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.UserId > 0).to.be.true;
          expect(res.body).to.have.property('GroupId', publicGroup.id);
          done();
        });
    });

    it('successfully creates a transaction with a logged out user', (done) => {
      const transaction = _.merge({}, transactionsData[7]);
      transaction.email = user.email;
      transaction.paypalEmail = null;

      request(app)
        .post(`/groups/${publicGroup.id}/transactions`)
        .send({
          api_key: application.api_key,
          transaction: transaction
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.UserId).to.equal(user.id);
          expect(res.body).to.have.property('GroupId', publicGroup.id);
          done();
        });
    });

    it('successfully creates a transaction with a logged out user with its paypalEmail', (done) => {
      const transaction = _.merge({}, transactionsData[7]);
      transaction.email = null;
      transaction.paypalEmail = user.paypalEmail;

      request(app)
        .post(`/groups/${publicGroup.id}/transactions`)
        .send({
          api_key: application.api_key,
          transaction: transaction
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.UserId).to.equal(user.id);
          expect(res.body).to.have.property('GroupId', publicGroup.id);
          done();
        });
    });

    it('fails to create a transaction without a user if group is private', (done) => {
      request(app)
        .post(`/groups/${privateGroup.id}/transactions`)
        .send({
          api_key: application.api_key,
          transaction: transactionsData[7]
        })
        .expect(403)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body.error.type).to.equal('forbidden');
          done();
        });
    });
  });

  /**
   * Update
   */
  describe('#update', () => {
    let toUpdate;

    beforeEach((done) => {
      request(app)
        .post(`/groups/${privateGroup.id}/transactions`)
        .set('Authorization', `Bearer ${user.jwt(application2)}`)
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
        .put(`/groups/${privateGroup.id}/transactions/987123`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(404)
        .end(done);
    });

    it('fails updating a transaction which does not belong to the group', (done) => {
      request(app)
        .put(`/groups/${group2.id}/transactions/${toUpdate.id}`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(403)
        .end(done);
    });

    it('fails updating a transaction if user has no access to the group', (done) => {
      request(app)
        .put(`/groups/${privateGroup.id}/transactions/${toUpdate.id}`)
        .set('Authorization', `Bearer ${user2.jwt(application)}`)
        .expect(403)
        .end(done);
    });

    it('fails updating a transaction if transaction is not included', (done) => {
      request(app)
        .put(`/groups/${privateGroup.id}/transactions/${toUpdate.id}`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
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
      const payoutMethod = 'manual';

      expect(toUpdate.payoutMethod).to.not.be.equal(payoutMethod);
      request(app)
        .put(`/groups/${privateGroup.id}/transactions/${toUpdate.id}`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
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

    const transactions = [];

    // Create transactions.
    beforeEach((done) => {
      async.each(transactionsData, (transaction, cb) => {
        request(app)
          .post(`/groups/${privateGroup.id}/transactions`)
          .set('Authorization', `Bearer ${user.jwt(application)}`)
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
        .delete(`/groups/${privateGroup.id}/transactions/987123`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(404)
        .end(done);
    });

    it('fails deleting a transaction which does not belong to the group', (done) => {
      request(app)
        .delete(`/groups/${group2.id}/transactions/${transactions[0].id}`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(403)
        .end(done);
    });

    it('fails deleting a transaction if user has no access to the group', (done) => {
      request(app)
        .delete(`/groups/${privateGroup.id}/transactions/${transactions[0].id}`)
        .set('Authorization', `Bearer ${user2.jwt(application)}`)
        .expect(403)
        .end(done);
    });

    it('fails deleting a transaction if user is not a host', (done) => {
      request(app)
        .delete(`/groups/${group2.id}/transactions/${transactions[0].id}`)
        .set('Authorization', `Bearer ${user3.jwt(application)}`)
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
        .delete(`/groups/${privateGroup.id}/transactions/${transactions[0].id}`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('success', true);

          async.parallel([
            (cb) => {
              models.Transaction.findById(transactions[0].id).then((t) => {
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
        .delete(`/groups/${privateGroup.id}/transactions/${transactions[0].id}`)
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

    const transactions = [];

    // Create transactions.
    beforeEach((done) => {
      async.each(transactionsData, (transaction, cb) => {
        request(app)
          .post(`/groups/${privateGroup.id}/transactions`)
          .set('Authorization', `Bearer ${user.jwt(application)}`)
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
          .post(`/groups/${publicGroup.id}/transactions`)
          .set('Authorization', `Bearer ${user.jwt(application)}`)
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
        .get(`/groups/${privateGroup.id}/transactions/987123`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(404)
        .end(done);
    });

    it('fails getting a transaction which does not belong to the group', (done) => {
      request(app)
        .get(`/groups/${group2.id}/transactions/${transactions[0].id}`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(403)
        .end(done);
    });

    it('fails getting a transaction if user has no access to the group', (done) => {
      request(app)
        .get(`/groups/${privateGroup.id}/transactions/${transactions[0].id}`)
        .set('Authorization', `Bearer ${user2.jwt(application)}`)
        .expect(403)
        .end(done);
    });

    it('successfully get a transaction', (done) => {
      request(app)
        .get(`/groups/${privateGroup.id}/transactions/${transactions[0].id}`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('id', transactions[0].id);
          done();
        });
    });

    it('successfully get a transaction with an authorized application', (done) => {
      request(app)
        .get(`/groups/${privateGroup.id}/transactions/${transactions[0].id}`)
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
        .get(`/groups/${publicGroup.id}/transactions/${transactions[0].id}`)
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
          .post(`/groups/${privateGroup.id}/transactions`)
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .send({
            transaction: transaction
          })
          .expect(200)
          .end(e => {
            expect(e).to.not.exist;
            cb();
          });
      }, done);
    });

    // Create transactions for publicGroup.
    beforeEach((done) => {
      async.each(transactionsData, (transaction, cb) => {
        request(app)
          .post(`/groups/${publicGroup.id}/transactions`)
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .send({
            transaction: transaction
          })
          .expect(200)
          .end(e => {
            expect(e).to.not.exist;

            cb();
          });
      }, done);
    });

    it('fails getting transactions for a not authorized group', (done) => {
      request(app)
        .get(`/groups/${privateGroup.id}/transactions`)
        .set('Authorization', `Bearer ${user2.jwt(application)}`)
        .expect(403)
        .end(done);
    });

    it('successfully get a group\'s transactions', (done) => {
      request(app)
        .get(`/groups/${privateGroup.id}/transactions`)
        .set('Authorization', `Bearer ${user.jwt(application)}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          const transactions = res.body;
          expect(transactions).to.have.length(transactionsData.length);
          transactions.forEach((t) => {
            expect(t.GroupId).to.equal(privateGroup.id);
          });

          done();

        });
    });

    it('successfully get a group\'s transactions if it is public', (done) => {
      request(app)
        .get(`/groups/${publicGroup.id}/transactions`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;

          const transactions = res.body;
          expect(transactions).to.have.length(transactionsData.length);
          transactions.forEach((t) => {
            expect(t.GroupId).to.equal(publicGroup.id);
          });

          done();
        });
    });

    describe('Pagination', () => {

      const perPage = 3;

      it('successfully get a group\'s transactions with per_page', (done) => {
        request(app)
          .get(`/groups/${privateGroup.id}/transactions`)
          .send({
            per_page: perPage,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(perPage);
            expect(res.body[0].id).to.equal(1);

            // Check pagination header.
            const headers = res.headers;
            expect(headers).to.have.property('link');
            expect(headers.link).to.contain('next');
            expect(headers.link).to.contain('page=2');
            expect(headers.link).to.contain('current');
            expect(headers.link).to.contain('page=1');
            expect(headers.link).to.contain(`per_page=${perPage}`);
            expect(headers.link).to.contain(`/groups/${privateGroup.id}/transactions`);
            const tot = transactionsData.length;
            expect(headers.link).to.contain(`/groups/${privateGroup.id}/transactions?page=${Math.ceil(tot / perPage)}&per_page=${perPage}>; rel="last"`);

            done();
          });
      });

      it('successfully get the second page of a group\'s transactions', (done) => {
        const page = 2;
        request(app)
          .get(`/groups/${privateGroup.id}/transactions`)
          .send({
            per_page: perPage,
            page: page,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(perPage);
            expect(res.body[0].id).to.equal(perPage + 1);

            // Check pagination header.
            const headers = res.headers;
            expect(headers.link).to.contain('page=3');
            expect(headers.link).to.contain('page=2');
            done();
          });
      });

      it('successfully get a group\'s transactions using since_id', (done) => {
        const sinceId = 5;

        request(app)
          .get(`/groups/${privateGroup.id}/transactions`)
          .send({
            since_id: sinceId,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            const transactions = res.body;
            expect(transactions[0].id > sinceId).to.be.true;
            const last = 0;
            _.each(transactions, (t) => {
              expect(t.id >= last).to.be.true;
            });

            // Check pagination header.
            const headers = res.headers;
            expect(headers.link).to.be.empty;
            done();
          });

      });

    });

    describe('Sorting', () => {

      it('successfully get a group\'s transactions with sorting', (done) => {
        request(app)
          .get(`/groups/${privateGroup.id}/transactions`)
          .send({
            sort: 'createdAt',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt(application)}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            const transactions = res.body;
            let last = new Date(transactions[0].createdAt);
            _.each(transactions, (a) => {
              expect((new Date(a.createdAt) >= new Date(last))).to.be.true;
              last = a.createdAt;
            });

            done();
          });
      });

    });

  });

});
