import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../../../../server/models';
import Promise from 'bluebird';
import * as utils from '../../../utils';
import emailLib from '../../../../server/lib/email';
import sinon from 'sinon';
import { randEmail } from '../../../stores';

describe('server/graphql/v1/orders', () => {
  const backers = [],
    collectives = [],
    orders = [];
  let host, hostAdmin, sandbox, emailSendMessageSpy;
  before('reset test db', () => utils.resetTestDB());
  before('spies', () => {
    sandbox = sinon.createSandbox();
    emailSendMessageSpy = sandbox.spy(emailLib, 'sendMessage');
  });
  after('cleaning', () => {
    afterEach(() => sandbox.restore());
  });
  before('build up db content', async () => {
    hostAdmin = await models.User.createUserWithCollective({
      email: 'hostAdmin@gmail.com',
    });
    backers[0] = await models.User.createUserWithCollective({
      email: 'backer1@gmail.com',
    });
    backers[1] = await models.User.createUserWithCollective({
      email: 'backer2@gmail.com',
    });
    host = await models.Collective.create({
      name: 'brusselstogetherasbl',
      currency: 'EUR',
      tags: ['brussels', 'host'],
    });
    await host.addUserWithRole(hostAdmin, 'ADMIN');
    collectives[0] = await models.Collective.create({
      name: 'veganbrussels',
      currency: 'EUR',
      tags: ['brussels', 'vegan'],
    });
    collectives[1] = await models.Collective.create({
      name: 'codenplay',
      currency: 'EUR',
      tags: ['brussels', 'coding'],
    });
    const randomUser = models.User.createUserWithCollective({ email: randEmail() });
    await Promise.map(collectives, collective =>
      collective.addHost(host, randomUser, { shouldAutomaticallyApprove: true }),
    );
    orders[0] = await models.Order.create({
      CreatedByUserId: backers[1].id,
      CollectiveId: collectives[1].id,
      FromCollectiveId: backers[1].CollectiveId,
      totalAmount: 15000,
      currency: 'EUR',
      status: 'PENDING',
    });
    orders[1] = await models.Order.create({
      CreatedByUserId: backers[0].id,
      CollectiveId: collectives[0].id,
      FromCollectiveId: backers[0].CollectiveId,
      totalAmount: 10000,
      currency: 'EUR',
      status: 'PENDING',
    });
    orders[2] = await models.Order.create({
      CreatedByUserId: backers[1].id,
      CollectiveId: collectives[0].id,
      FromCollectiveId: backers[1].CollectiveId,
      totalAmount: 20000,
      currency: 'EUR',
      status: 'PAID',
    });
  });

  describe('query', () => {
    const allOrdersQuery = `
    query allOrders($collectiveSlug: String!, $status: String, $includeHostedCollectives: Boolean) {
      allOrders(collectiveSlug: $collectiveSlug, status: $status, includeHostedCollectives: $includeHostedCollectives) {
        id
        collective {
          id
          slug
        }
        fromCollective {
          id
          slug
        }
        description
        totalAmount
        currency
        status
      }
    }
    `;

    it('gets all the PENDING orders for one collective', async () => {
      const result = await utils.graphqlQuery(allOrdersQuery, {
        collectiveSlug: collectives[0].slug,
        status: 'PENDING',
      });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const { allOrders } = result.data;
      expect(allOrders).to.have.length(1);
    });

    it('gets all the PENDING orders across all hosted collectives', async () => {
      const result = await utils.graphqlQuery(allOrdersQuery, {
        collectiveSlug: host.slug,
        status: 'PENDING',
        includeHostedCollectives: true,
      });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const { allOrders } = result.data;
      expect(allOrders).to.have.length(2);
      allOrders.map(order => {
        expect(order.status).to.equal('PENDING');
      });
    });
  });

  describe('mutation', () => {
    const markOrderAsPaidQuery = `
    mutation markOrderAsPaid($id: Int!) {
      markOrderAsPaid(id: $id) {
        id
        status
      }
    }
    `;

    const markPendingOrderAsExpiredQuery = `
      mutation markPendingOrderAsExpired($id: Int!) {
        markPendingOrderAsExpired(id: $id) {
          id
          status
        }
      }
    `;
    it('fails if not authenticated', async () => {
      const result = await utils.graphqlQuery(markOrderAsPaidQuery, {
        id: orders[0].id,
      });
      expect(result.errors[0].message).to.equal('You need to be authenticated to perform this action');
    });
    it('fails if not authenticated as an admin of the host', async () => {
      const result = await utils.graphqlQuery(
        markOrderAsPaidQuery,
        {
          id: orders[0].id,
        },
        backers[0],
      );
      expect(result.errors[0].message).to.equal('You must be logged in as an admin of the host of the collective');
    });
    it('fails if order not found', async () => {
      const result = await utils.graphqlQuery(
        markOrderAsPaidQuery,
        {
          id: 123,
        },
        backers[0],
      );
      expect(result.errors[0].message).to.equal('Order not found');
    });
    it('marks a pending order as paid', async () => {
      const result = await utils.graphqlQuery(
        markOrderAsPaidQuery,
        {
          id: orders[0].id,
        },
        hostAdmin,
      );
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const { markOrderAsPaid } = result.data;
      expect(markOrderAsPaid.status).to.equal('PAID');
      const order = await models.Order.findByPk(orders[0].id);
      expect(order.status).to.equal('PAID');
      expect(order.processedAt).to.not.equal(null);
      const transactions = await models.Transaction.findAll({
        where: { OrderId: orders[0].id },
      });
      expect(transactions.length).to.equal(2);
      expect(transactions[0].type).to.equal('DEBIT');
      expect(transactions[1].type).to.equal('CREDIT');
      expect(transactions[1].currency).to.equal(orders[0].currency);
      expect(transactions[1].HostCollectiveId).to.equal(host.id);
      expect(transactions[1].PaymentMethodId).to.be.null;
      expect(transactions[1].platformFeeInHostCurrency).to.equal(0);
      expect(transactions[1].hostFeeInHostCurrency).to.equal(-0.05 * orders[0].totalAmount);
      await utils.waitForCondition(() => emailSendMessageSpy.callCount === 1);
      expect(emailSendMessageSpy.callCount).to.equal(1);
      expect(emailSendMessageSpy.firstCall.args[0]).to.equal(backers[1].email);
      expect(emailSendMessageSpy.firstCall.args[1]).to.match(/Thank you for your €\s?150 contribution to codenplay/);
    });

    it('marks a pending order as expired', async () => {
      const result = await utils.graphqlQuery(
        markPendingOrderAsExpiredQuery,
        {
          id: orders[1].id,
        },
        hostAdmin,
      );
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const { markPendingOrderAsExpired } = result.data;
      expect(markPendingOrderAsExpired.status).to.equal('EXPIRED');
      const order = await models.Order.findByPk(orders[1].id);
      expect(order.status).to.equal('EXPIRED');
    });
  });
});
