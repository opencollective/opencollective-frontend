import _ from 'lodash';
import app from '../server/index';
import { expect } from 'chai';
import request from 'supertest';
import * as utils from '../test/utils';
import models from '../server/models';
import roles from '../server/constants/roles';
const application = utils.data('application');
const publicCollectiveData = utils.data('collective1');
const transactionsData = utils.data('transactions1').transactions;

describe('transactions.routes.test.js', () => {

  let publicCollective, collective2, user, host;

  before(() => utils.resetTestDB());


  // Create users
  before('create user', () => models.User.createUserWithCollective(utils.data('user1')).tap(u => user = u));
  before('create host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => host = u));

  // Create collectives
  before('create publicCollective', () => models.Collective.create(publicCollectiveData).tap(g => publicCollective = g));
  before('create collective2', () => models.Collective.create(_.omit(utils.data('collective2'), ['slug'])).tap(g => collective2 = g));

  // Add users to collectives
  before('add host to collective2', () => collective2.addUserWithRole(host, roles.HOST));
  before('add host to publicCollective', () => publicCollective.addUserWithRole(host, roles.HOST));
  before('add user to publicCollective as a member', () => publicCollective.addUserWithRole(user, roles.ADMIN));

  /**
   * Get collective's transactions.
   */
  describe('#get', () => {

    let transaction, defaultAttributes;

    before(() => {
      defaultAttributes = {
        CreatedByUserId: user.id,
        FromCollectiveId: user.CollectiveId,
        HostCollectiveId: host.CollectiveId
      };
    });

    before('create multiple transactions for publicCollective', () => models.Transaction
      .createMany(transactionsData, { ToCollectiveId: publicCollective.id, ...defaultAttributes })
      .then(transactions => {
        transaction = transactions[0]
      })
    );

    before('create multiple transactions for collective2', () => models.Transaction
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
          expect(transactionDetails.host.id).to.equal(host.CollectiveId);
          expect(transactionDetails.host.billingAddress).to.equal(host.billingAddress);
          expect(transactionDetails.createdByUser.billingAddress).to.equal(user.billingAddress);
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
          expect(transactionDetails.host.id).to.equal(host.CollectiveId);
          expect(transactionDetails.host.billingAddress).to.equal(host.billingAddress);
          expect(transactionDetails.createdByUser.billingAddress).to.equal(user.billingAddress);
          expect(transactionDetails.toCollective.slug).to.equal(publicCollective.slug);
          done();
        });
    });

  });

});
