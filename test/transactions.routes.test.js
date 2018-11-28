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
  before('create user', () => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user = u)));
  before('create host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => (host = u)));

  // Create collectives
  before('create publicCollective', () =>
    models.Collective.create(publicCollectiveData).tap(g => (publicCollective = g)),
  );
  before('create collective2', () =>
    models.Collective.create(_.omit(utils.data('collective2'), ['slug'])).tap(g => (collective2 = g)),
  );

  // Add users to collectives
  before('add host to collective2', () => collective2.addHost(host.collective));
  before('add host to publicCollective', () => publicCollective.addHost(host.collective));
  before('add user to publicCollective as a member', () => publicCollective.addUserWithRole(user, roles.ADMIN));

  let transaction, defaultAttributes;

  before(() => {
    defaultAttributes = {
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      HostCollectiveId: host.CollectiveId,
    };
  });

  before('create multiple transactions for publicCollective', () =>
    models.Transaction.createMany(transactionsData, {
      CollectiveId: publicCollective.id,
      ...defaultAttributes,
    }).then(transactions => {
      transaction = transactions[0];
    }),
  );

  before('create multiple transactions for collective2', () =>
    models.Transaction.createMany(transactionsData, {
      CollectiveId: collective2.id,
      ...defaultAttributes,
    }),
  );

  /**
   * Get collective's transactions.
   */
  describe('#get', () => {
    it('cannot get the transaction details by id', done => {
      request(app)
        .get(`/transactions/${transaction.id}?api_key=${application.api_key}`)
        .expect(400)
        .end((e, res) => {
          expect(res.body.error.message).to.equal('Must provide transaction uuid');
          done();
        });
    });

    it('get the transaction details with host info', done => {
      request(app)
        .get(`/transactions/${transaction.uuid}?api_key=${application.api_key}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const transactionDetails = res.body;
          expect(transactionDetails).to.have.property('host');
          expect(transactionDetails.description).to.equal(transaction.description);
          expect(transactionDetails.host.id).to.equal(host.CollectiveId);
          expect(transactionDetails.host.address).to.equal(host.collective.address);
          expect(transactionDetails.collective.slug).to.equal(publicCollective.slug);
          expect(transactionDetails.createdByUser).to.not.have.property('email');
          expect(transactionDetails.createdByUser).to.not.have.property('paypalEmail');
          expect(transactionDetails.host).to.not.have.property('email');
          done();
        });
    });

    it('get the transaction details by uuid', done => {
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
          expect(transactionDetails.host.address).to.equal(host.collective.address);
          expect(transactionDetails.collective.slug).to.equal(publicCollective.slug);
          done();
        });
    });
  });

  describe('Pagination', () => {
    const perPage = 3;

    it("successfully get a group's transactions with per_page", done => {
      request(app)
        .get(`/groups/${publicCollective.id}/transactions?api_key=${application.api_key}`)
        .send({
          per_page: perPage,
          sort: 'id',
          direction: 'asc',
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
          expect(headers.link).to.contain(`/groups/${publicCollective.id}/transactions`);
          const tot = transactionsData.length;
          expect(headers.link).to.contain(
            `/groups/${publicCollective.id}/transactions?page=${Math.ceil(
              tot / perPage,
            )}&per_page=${perPage}>; rel="last"`,
          );

          done();
        });
    });

    it("successfully get the second page of a group's transactions", done => {
      const page = 2;
      request(app)
        .get(`/groups/${publicCollective.id}/transactions?api_key=${application.api_key}`)
        .send({
          per_page: perPage,
          page,
          sort: 'id',
          direction: 'asc',
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

    it("successfully get a group's transactions using since_id", done => {
      const sinceId = 5;

      request(app)
        .get(`/groups/${publicCollective.id}/transactions?api_key=${application.api_key}`)
        .send({
          since_id: sinceId,
          sort: 'id',
          direction: 'asc',
        })
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const transactions = res.body;
          expect(transactions[0].id > sinceId).to.be.true;
          const last = 0;
          _.each(transactions, t => {
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
    it("successfully get a group's transactions with sorting", done => {
      request(app)
        .get(`/groups/${publicCollective.id}/transactions?api_key=${application.api_key}`)
        .send({
          sort: 'createdAt',
          direction: 'asc',
        })
        .set('Authorization', `Bearer ${user.jwt()}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const transactions = res.body;
          let last = new Date(transactions[0].createdAt);
          _.each(transactions, a => {
            expect(new Date(a.createdAt) >= new Date(last)).to.be.true;
            last = a.createdAt;
          });
          done();
        });
    });
  });
});
