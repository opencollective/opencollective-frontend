import _ from 'lodash';
import app from '../server/index';
import async from 'async';
import sinon from 'sinon';
import {expect} from 'chai';
import request from 'supertest';
import * as utils from '../test/utils';
import models from '../server/models';
import roles from '../server/constants/roles';

const application = utils.data('application');
const publicGroupData = utils.data('group1');
const transactionsData = utils.data('transactions1').transactions;

describe('transactions.routes.test.js', () => {

  let sandbox, publicGroup, group2, user, user2, user3;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  beforeEach(() => utils.resetTestDB());

  // Create a stub for clearbit
  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  // Create users
  beforeEach('create user', () => models.User.create(utils.data('user1')).tap(u => user = u));
  beforeEach('create user2', () => models.User.create(utils.data('user2')).tap(u => user2 = u));
  beforeEach('create user3', () => models.User.create(utils.data('user3')).tap(u => user3 = u));

  // Create groups
  beforeEach('create publicGroup', () => models.Group.create(publicGroupData).tap(g => publicGroup = g));
  beforeEach('create group2', () => models.Group.create(_.omit(utils.data('group2'), ['slug'])).tap(g => group2 = g));

  // Add users to groups
  beforeEach('add user to group2 as a host', () => group2.addUserWithRole(user, roles.HOST));
  beforeEach('add user to publicGroup as a host', () => publicGroup.addUserWithRole(user, roles.HOST));
  beforeEach('add user3 to publicGroup as a member', () => publicGroup.addUserWithRole(user3, roles.MEMBER));

  beforeEach(() => models.PaymentMethod.create({UserId: user.id}))

  afterEach(() => utils.clearbitStubAfterEach(sandbox));

  /**
   * Create.
   */
  // TODO remove #postmigration, replaced by expenses.routes.test.js
  describe('#create', () => {

    it('fails creating a transaction if no authenticated', (done) => {
      request(app)
        .post(`/groups/${publicGroup.id}/transactions`)
        .send({
          api_key: application.api_key,
          transaction: transactionsData[0]
        })
        .expect(401)
        .end(done);
    });

    it('fails creating a transaction if no transaction passed', (done) => {
      request(app)
        .post(`/groups/${publicGroup.id}/transactions`)
        .send({
          api_key: application.api_key
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
        .post(`/groups/${publicGroup.id}/transactions`)
        .set('Authorization', `Bearer ${user2.jwt()}`)
        .send({
          api_key: application.api_key,
          transaction: transactionsData[0]
        })
        .expect(403)
        .end(done);
    });

    it('successfully create a transaction with a user', (done) => {
      request(app)
        .post(`/groups/${publicGroup.id}/transactions`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          api_key: application.api_key,
          transaction: transactionsData[0]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('vat', transactionsData[0].vat);
          expect(res.body).to.have.property('GroupId', publicGroup.id);
          expect(res.body).to.have.property('UserId', user.id); // ...
          done();
        });
    });

    // TODO: this shouldn't be allowed. 
    // Should only be able to create an expense or a donation (that need to be approved)
    // xdamman: fixed -- but need to test on staging to be sure
    it('cannot create a transaction without a user', () => 
      request(app)
        .post(`/groups/${publicGroup.id}/transactions`)
        .send({
          api_key: application.api_key,
          transaction: transactionsData[7]
        })
        .expect(401)    
    );

  });

  /**
   * Get group's transactions.
   */
  describe('#get', () => {

    let transaction;

    beforeEach('create multiple transactions for publicGroup', (done) => {
      async.each(transactionsData, (t, cb) => {
        request(app)
          .post(`/groups/${publicGroup.id}/transactions?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user3.jwt()}`)
          .send({ transaction: t })
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            transaction = res.body;
            cb();
          });
      }, done);
    });

    beforeEach('create a transaction for group2', (done) => {
      async.each(transactionsData, (transaction, cb) => {
        request(app)
          .post(`/groups/${group2.id}/transactions?api_key=${application.api_key}`)
          .set('Authorization', `Bearer ${user.jwt()}`)
          .send({
            transaction
          })
          .expect(200)
          .end(e => {
            expect(e).to.not.exist;
            cb();
          });
      }, done);
    });

    it('successfully get a group\'s transactions', (done) => {
      request(app)
        .get(`/groups/${publicGroup.id}/transactions?api_key=${application.api_key}`)
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

    it('get the transaction details with host info', (done) => {
      request(app)
        .get(`/transactions/${transaction.id}?api_key=${application.api_key}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const transactionDetails = res.body;
          expect(transactionDetails).to.have.property('host');
          expect(transactionDetails.description).to.equal(transaction.description);
          expect(transactionDetails.host.username).to.equal(user.username);
          expect(transactionDetails.host.billingAddress).to.equal(user.billingAddress);
          expect(transactionDetails.user.billingAddress).to.equal(user3.billingAddress);
          expect(transactionDetails.group.slug).to.equal(publicGroup.slug);
          done();
        });
    });

    describe('Pagination', () => {

      const perPage = 3;

      it('successfully get a group\'s transactions with per_page', (done) => {
        request(app)
          .get(`/groups/${publicGroup.id}/transactions?api_key=${application.api_key}`)
          .send({
            per_page: perPage,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(perPage);
            expect(res.body[0].id).to.equal(1);

            // Check pagination header.
            const { headers } = res;
            expect(headers).to.have.property('link');
            expect(headers.link).to.contain('next');
            expect(headers.link).to.contain('page=2');
            expect(headers.link).to.contain('current');
            expect(headers.link).to.contain('page=1');
            expect(headers.link).to.contain(`per_page=${perPage}`);
            expect(headers.link).to.contain(`/groups/${publicGroup.id}/transactions`);
            const tot = transactionsData.length;
            expect(headers.link).to.contain(`/groups/${publicGroup.id}/transactions?page=${Math.ceil(tot / perPage)}&per_page=${perPage}>; rel="last"`);

            done();
          });
      });

      it('successfully get the second page of a group\'s transactions', (done) => {
        const page = 2;
        request(app)
          .get(`/groups/${publicGroup.id}/transactions?api_key=${application.api_key}`)
          .send({
            per_page: perPage,
            page,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt()}`)
          .expect(200)
          .end((e, res) => {
            expect(e).to.not.exist;
            expect(res.body.length).to.equal(perPage);
            expect(res.body[0].id).to.equal(perPage + 1);

            // Check pagination header.
            const { headers } = res;
            expect(headers.link).to.contain('page=3');
            expect(headers.link).to.contain('page=2');
            done();
          });
      });

      it('successfully get a group\'s transactions using since_id', (done) => {
        const sinceId = 5;

        request(app)
          .get(`/groups/${publicGroup.id}/transactions?api_key=${application.api_key}`)
          .send({
            since_id: sinceId,
            sort: 'id',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt()}`)
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
            const { headers } = res;
            expect(headers.link).to.be.empty;
            done();
          });

      });

    });

    describe('Sorting', () => {

      it('successfully get a group\'s transactions with sorting', (done) => {
        request(app)
          .get(`/groups/${publicGroup.id}/transactions?api_key=${application.api_key}`)
          .send({
            sort: 'createdAt',
            direction: 'asc'
          })
          .set('Authorization', `Bearer ${user.jwt()}`)
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
