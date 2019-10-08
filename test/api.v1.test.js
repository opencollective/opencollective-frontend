/**
 * Note: to update the snapshots run:
 * TZ=UTC CHAI_JEST_SNAPSHOT_UPDATE_ALL=true npx mocha test/api.v1.test.js
 */

import request from 'supertest';
import { expect } from 'chai';
import { omit, orderBy } from 'lodash';

import app from '../server/index';
import models from '../server/models';
import roles from '../server/constants/roles';
import * as utils from '../test/utils';

const application = utils.data('application');
const publicCollectiveData = utils.data('collective1');
const transactionsData = utils.data('transactions1.transactions');

const orderTransactions = transactions => orderBy(transactions, ['createdAt', 'id'], ['desc', 'desc']);

describe('api.v1.test.js', () => {
  let collective, user, host;

  before(() => utils.resetTestDB());

  // Create users
  before('create user', () => models.User.createUserWithCollective(utils.data('user1')).tap(u => (user = u)));
  before('create host', () => models.User.createUserWithCollective(utils.data('host1')).tap(u => (host = u)));

  // Create collectives
  before('create collective', () => models.Collective.create(publicCollectiveData).tap(g => (collective = g)));

  // Add users to collectives
  before('add host to collective', () => collective.addHost(host.collective, host));
  before('add user to collective as a member', () => collective.addUserWithRole(user, roles.ADMIN));

  let transaction, defaultAttributes;

  before(() => {
    defaultAttributes = {
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      HostCollectiveId: host.CollectiveId,
    };
  });

  before('create multiple transactions for collective', () => {
    return models.Transaction.createMany(transactionsData, {
      CollectiveId: collective.id,
      ...defaultAttributes,
    })
      .then(orderTransactions)
      .then(transactions => {
        transaction = transactions[0];
      });
  });

  /**
   * Get collective's transactions.
   */
  describe('#get', () => {
    it('get the latest transactions', done => {
      request(app)
        .get(`/v1/collectives/${collective.slug}/transactions?api_key=${application.api_key}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const transactions = orderTransactions(res.body.result);
          expect(transactions.length).to.equal(9);
          const debits = transactions.filter(t => t.type === 'DEBIT');
          const credits = transactions.filter(t => t.type === 'CREDIT');
          expect(omit(debits[0], ['id', 'createdAt'])).to.matchSnapshot();
          expect(omit(credits[0], ['id', 'createdAt'])).to.matchSnapshot();
          done();
        });
    });

    it('get one transaction details by uuid', done => {
      request(app)
        .get(`/v1/collectives/${collective.slug}/transactions/${transaction.uuid}?api_key=${application.api_key}`)
        .expect(200)
        .end((e, res) => {
          expect(e).to.not.exist;
          const transaction = omit(res.body.result, ['id', 'createdAt']);
          expect(transaction).to.matchSnapshot();
          done();
        });
    });
  });
});
