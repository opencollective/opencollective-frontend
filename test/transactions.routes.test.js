import _ from 'lodash';
import app from '../server/index';
import sinon from 'sinon';
import {expect} from 'chai';
import request from 'supertest';
import * as utils from '../test/utils';
import models from '../server/models';
import roles from '../server/constants/roles';
const application = utils.data('application');
const publicCollectiveData = utils.data('collective1');
const transactionsData = utils.data('transactions1').transactions;

describe('transactions.routes.test.js', () => {

  let sandbox, publicCollective, collective2, user, user2, user3;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  after(() => sandbox.restore());

  beforeEach(() => utils.resetTestDB());

  // Create a stub for clearbit
  beforeEach(() => utils.clearbitStubBeforeEach(sandbox));

  // Create users
  beforeEach('create user', () => models.User.createUserWithCollective(utils.data('user1')).tap(u => user = u));
  beforeEach('create user2', () => models.User.createUserWithCollective(utils.data('user2')).tap(u => user2 = u));
  beforeEach('create user3', () => models.User.createUserWithCollective(utils.data('user3')).tap(u => user3 = u));

  // Create collectives
  beforeEach('create publicCollective', () => models.Collective.create(publicCollectiveData).tap(g => publicCollective = g));
  beforeEach('create collective2', () => models.Collective.create(_.omit(utils.data('collective2'), ['slug'])).tap(g => collective2 = g));

  // Add users to collectives
  beforeEach('add user to collective2 as a host', () => collective2.addUserWithRole(user, roles.HOST));
  beforeEach('add user to publicCollective as a host', () => publicCollective.addUserWithRole(user, roles.HOST));
  beforeEach('add user3 to publicCollective as a member', () => publicCollective.addUserWithRole(user3, roles.ADMIN));

  beforeEach(() => models.PaymentMethod.create({
    CreatedByUserId: user.id,
    CollectiveId: user.CollectiveId,
    service: 'stripe',
    token: 'tok_123456781234567812345678'
  }))

  afterEach(() => utils.clearbitStubAfterEach(sandbox));

  /**
   * Create.
   */
  // TODO remove #postmigration, replaced by expenses.routes.test.js
  describe('#create', () => {

    it('fails creating a transaction if no authenticated', (done) => {
      request(app)
        .post(`/collectives/${publicCollective.id}/transactions`)
        .send({
          api_key: application.api_key,
          transaction: transactionsData[0]
        })
        .expect(401)
        .end(done);
    });

    it('fails creating a transaction if no transaction passed', (done) => {
      request(app)
        .post(`/collectives/${publicCollective.id}/transactions`)
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

    it('fails creating a transaction if user has no access to the collective', (done) => {
      request(app)
        .post(`/collectives/${publicCollective.id}/transactions`)
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
        .post(`/collectives/${publicCollective.id}/transactions`)
        .set('Authorization', `Bearer ${user.jwt()}`)
        .send({
          api_key: application.api_key,
          transaction: transactionsData[0]
        })
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          expect(res.body).to.have.property('ToCollectiveId', publicCollective.id);
          expect(res.body).to.have.property('CreatedByUserId', user.id); // ...
          done();
        });
    });

    // TODO: this shouldn't be allowed. 
    // Should only be able to create an expense or a donation (that need to be approved)
    // xdamman: fixed -- but need to test on staging to be sure
    it('cannot create a transaction without a user', () => 
      request(app)
        .post(`/collectives/${publicCollective.id}/transactions`)
        .send({
          api_key: application.api_key,
          transaction: transactionsData[7]
        })
        .expect(401)    
    );

  });

  /**
   * Get collective's transactions.
   */
  describe('#get', () => {

    let transaction, defaultAttributes;

    before(() => {
      defaultAttributes = {
        CreatedByUserId: user3.id,
        FromCollectiveId: user3.CollectiveId,
        HostCollectiveId: user.CollectiveId
      };
    });

    beforeEach('create multiple transactions for publicCollective', () => models.Transaction
      .createMany(transactionsData, { ToCollectiveId: publicCollective.id, ...defaultAttributes })
      .then(transactions => {
        transaction = transactions[0]
      })
    );

    beforeEach('create multiple transactions for collective2', () => models.Transaction
      .createMany(transactionsData, { ToCollectiveId: collective2.id, ...defaultAttributes })
    );

    it('cannot get the transaction details by id', (done) => {
      request(app)
        .get(`/transactions/${transaction.id}?api_key=${application.api_key}`)
        .expect(400)
        .end((e, res) => {
          expect(res.body.error.message).to.equal("Must provide transaction uuid");
          done();
        })
    });

    it('get the transaction details with host info', (done) => {
      request(app)
        .get(`/transactions/${transaction.uuid}?api_key=${application.api_key}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const transactionDetails = res.body;
          expect(transactionDetails).to.have.property('host');
          expect(transactionDetails.description).to.equal(transaction.description);
          expect(transactionDetails.host.id).to.equal(user.CollectiveId);
          expect(transactionDetails.host.billingAddress).to.equal(user.billingAddress);
          expect(transactionDetails.createdByUser.billingAddress).to.equal(user3.billingAddress);
          expect(transactionDetails.toCollective.slug).to.equal(publicCollective.slug);
          expect(transactionDetails.createdByUser).to.not.have.property('email');
          expect(transactionDetails.createdByUser).to.not.have.property('paypalEmail');
          expect(transactionDetails.host).to.not.have.property('email');
          done();
        });
    });

    it('get the transaction details by uuid', (done) => {
      request(app)
        .get(`/transactions/${transaction.uuid}?api_key=${application.api_key}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const transactionDetails = res.body;
          expect(transactionDetails).to.have.property('host');
          expect(transactionDetails.createdByUser).to.not.have.property('email');
          expect(transactionDetails.createdByUser).to.not.have.property('paypalEmail');
          expect(transactionDetails.type).to.equal(transaction.type);
          expect(transactionDetails.description).to.equal(transaction.description);
          expect(transactionDetails.host.id).to.equal(user.CollectiveId);
          expect(transactionDetails.host.billingAddress).to.equal(user.billingAddress);
          expect(transactionDetails.createdByUser.billingAddress).to.equal(user3.billingAddress);
          expect(transactionDetails.toCollective.slug).to.equal(publicCollective.slug);
          done();
        });
    });

  });

});
