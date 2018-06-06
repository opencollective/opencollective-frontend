import config from 'config';
import nock from 'nock';
import sinon from 'sinon';
import { expect } from 'chai';
import { cloneDeep } from 'lodash';

import models from '../server/models';
import twitter from '../server/lib/twitter';
import * as utils from './utils';
import * as store from './features/support/stores';

const order = {
    "quantity": 1,
    "interval": null,
    "totalAmount": 154300,
    "paymentMethod": {
        "name": "4242",
        "token": "tok_1B5j8xDjPFcHOcTm3ogdnq0K",
        "data": {
          "expMonth": 10,
          "expYear": 2023,
          "brand": "Visa",
          "country": "US",
          "funding": "credit"
        }
    },
    "collective": {
        "id": null
    }
  }

const createOrderQuery = `
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      createdByUser {
        id
      }
      paymentMethod {
        id
      }
      totalAmount
      fromCollective {
        id
        slug
        name
        website
      }
      collective {
        id
        slug
        currency
      }
      subscription {
        id
        amount
        interval
        isActive
        stripeSubscriptionId
      }
    }
  }
  `;

  const constants = {
  paymentMethod: {
    name: 'payment method',
    service: "stripe",
    type: 'creditcard',
    data: {
      expMonth: 11,
      expYear: 2025
    }
  }
};

describe('createOrder', () => {

  let sandbox, tweetStatusSpy, brusselstogether;

  before(() => {
    nock('http://data.fixer.io')
      .get(/20[0-9]{2}\-[0-9]{2}\-[0-9]{2}/)
      .times(5)
      .query({ access_key: config.fixer.accessKey, base: 'EUR', symbols: 'USD'})
      .reply(200, {"base":"EUR","date":"2017-09-01","rates":{"USD":1.192}});

    nock('http://data.fixer.io')
      .get('/latest')
      .times(5)
      .query({ access_key: config.fixer.accessKey, base: 'EUR', symbols: 'USD'})
      .reply(200, {"base":"EUR","date":"2017-09-22","rates":{"USD":1.1961} }, ['Server', 'nosniff'])
  });

  after(() => nock.cleanAll());

  beforeEach(async () => {
    await utils.resetTestDB();
    sandbox = sinon.sandbox.create();
    tweetStatusSpy = sandbox.spy(twitter, 'tweetStatus');

    // Given a collective (with a host)
    brusselstogether = (await store.newCollectiveWithHost(
      'brusselstogether', 'EUR', 'EUR', 5)).collective;
    // And the above collective's host has a stripe account
    await store.stripeConnectedAccount(brusselstogether.HostCollectiveId);
    // And given that the above collective is active
    await brusselstogether.update({ isActive: true });
    // And given that the endpoint for creating customers on Stripe
    // is patched
    utils.stubStripeCreate(sandbox, { charge: { currency: 'eur', status: 'succeeded' } });
    // And given the stripe stuff that depends on values in the
    // order struct is patch. It's here and not on each test because
    // the `totalAmount' field doesn't change throught the tests.
    utils.stubStripeBalance(sandbox, order.totalAmount, 'eur',
                            Math.round(order.totalAmount * 0.05),
                            4500) // This is the payment processor fee.
  })

  afterEach(() => sandbox.restore());


    it("fails if collective is not active", async () => {
      const collective = await models.Collective.create({
        slug: 'test',
        name: 'test',
        isActive: false
      });
      const thisOrder = cloneDeep(order);
      thisOrder.collective.id = collective.id;
      const res = await utils.graphqlQuery(createOrderQuery, { order: thisOrder });
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("This collective is not active");
    });

    it('creates an order as new user and sends a tweet', async () => {
      // And given a twitter connected account for the above
      // collective
      await models.ConnectedAccount.create({
        CollectiveId: brusselstogether.id,
        service: "twitter",
        clientId: "clientid",
        token: "xxxx",
        settings: {
          "newBacker": {
            active: true,
            tweet: "{backerTwitterHandle} thank you for your {amount} donation!"
          }
        }
      });
      // And given an order
      order.collective = { id: brusselstogether.id };
      order.user = {
        firstName: "John",
        lastName: "Smith",
        email: "jsmith@email.com",
        twitterHandle: "johnsmith",
        newsletterOptIn: true,
      };
      // When the query is executed
      const res = await utils.graphqlQuery(createOrderQuery, { order });

      // Then there should be no errors
      expect(res.errors).to.not.exist;

      const fromCollective = res.data.createOrder.fromCollective;
      const collective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, amount: order.totalAmount }
      });
      expect(transaction.FromCollectiveId).to.equal(fromCollective.id);
      expect(transaction.CollectiveId).to.equal(collective.id);
      expect(transaction.currency).to.equal(collective.currency);
      expect(transaction.hostFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
      expect(transaction.platformFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
      expect(transaction.data.charge.currency).to.equal(collective.currency.toLowerCase());
      expect(transaction.data.charge.status).to.equal('succeeded');
      expect(transaction.data.balanceTransaction.net + transaction.hostFeeInHostCurrency)
        .to.equal(transaction.netAmountInCollectiveCurrency);
      // we create a customer on the host stripe account even for one time charges
      expect(transaction.data.charge.customer).to.not.be.null;

      const { createdByUser: { id } } = res.data.createOrder;
      const user = await models.User.findById(id);
      expect(user.newsletterOptIn).to.be.true;

      // make sure the payment has been recorded in the connected Stripe Account of the host
      expect(transaction.data.charge.currency).to.equal('eur');

      await utils.waitForCondition(() => tweetStatusSpy.callCount > 0);
      expect(tweetStatusSpy.firstCall.args[1]).to.contain("@johnsmith thank you for your €1,543 donation!");
    });

    it('creates an order as new anonymous user', async () => {
      // Given an order request
      const newOrder = cloneDeep(order);
      newOrder.collective = { id: brusselstogether.id };
      newOrder.user = {
        firstName: "",
        lastName: "",
        email: "jsmith@email.com"
      };
      newOrder.totalAmount = 0;
      delete newOrder.paymentMethod;

      // When the GraphQL query is executed
      const res = await utils.graphqlQuery(createOrderQuery, { order: newOrder });

      // Then there should be no errors
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      // And then the donor's Collective slug & name should be
      // anonymous
      const fromCollective = res.data.createOrder.fromCollective;
      expect(fromCollective.slug).to.match(/anonymous/);
      expect(fromCollective.name).to.match(/anonymous/);
    });

    it('creates an order as logged in user', async () => {
      // Given a user
      const xdamman = (await store.newUser('xdamman')).user;
      // And given that the order is from the above user with the
      // above payment method
      order.fromCollective = { id: xdamman.CollectiveId };
      order.collective = { id: brusselstogether.id };
      // When the query is executed
      const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
      // Then there should be no errors
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      // And then the creator of the order should be xdamman
      const collective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, amount: order.totalAmount }
      });
      expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
      expect(transaction.CollectiveId).to.equal(collective.id);
      expect(transaction.currency).to.equal(collective.currency);
      expect(transaction.hostFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
      expect(transaction.platformFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
      expect(transaction.data.charge.currency).to.equal(collective.currency.toLowerCase());
      expect(transaction.data.charge.status).to.equal('succeeded');
      expect(transaction.data.balanceTransaction.net + transaction.hostFeeInHostCurrency).to.equal(transaction.netAmountInCollectiveCurrency);
      // make sure the payment has been recorded in the connected
      // Stripe Account of the host
      expect(transaction.data.charge.currency).to.equal('eur');
    });

    it('creates an order as logged in user using saved credit card', async () => {
      // Given a user
      const xdamman = (await store.newUser('xdamman')).user;
      // And the parameters for the query
      const collectiveToEdit = {
        id: xdamman.CollectiveId,
        paymentMethods: []
      }
      collectiveToEdit.paymentMethods.push({
        name: '4242',
        service: 'stripe',
        token: 'tok_2B5j8xDjPFcHOcTm3ogdnq0K',
      });
      // And then the collective is edited with the above data
      let res;
      const query = `
      mutation editCollective($collective: CollectiveInputType!) {
        editCollective(collective: $collective) {
          id,
          paymentMethods {
            uuid
            service
            name
          }
        }
      }
      `;
      res = await utils.graphqlQuery(query, { collective: collectiveToEdit }, xdamman);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      // And the order is setup with the above data
      order.collective = { id: brusselstogether.id };
      order.fromCollective = { id: xdamman.CollectiveId }
      order.paymentMethod = { uuid: res.data.editCollective.paymentMethods[0].uuid };

      // When the order is created
      res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);

      // There should be no errors
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      // And the transaction has to have the data from the right user,
      // right collective, and right amounts
      const collective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, amount: order.totalAmount }
      });
      expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
      expect(transaction.CollectiveId).to.equal(collective.id);
      expect(transaction.currency).to.equal(collective.currency);
      expect(transaction.hostFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
      expect(transaction.platformFeeInHostCurrency).to.equal(-(0.05 * order.totalAmount));
      expect(transaction.data.charge.currency).to.equal(collective.currency.toLowerCase());
      expect(transaction.data.charge.status).to.equal('succeeded');
      expect(transaction.data.balanceTransaction.net + transaction.hostFeeInHostCurrency).to.equal(transaction.netAmountInCollectiveCurrency);
      // make sure the payment has been recorded in the connected
      // Stripe Account of the host
      expect(transaction.data.charge.currency).to.equal('eur');
    });

    it('creates a recurring donation as logged in user', async () => {
      // Given a user
      const xdamman = (await store.newUser('xdamman')).user;
      // And the parameters for the query
      order.fromCollective = { id: xdamman.CollectiveId };
      order.paymentMethod = { ...constants.paymentMethod, token: 'tok_1B5j8xDjPFcHOcTm3ogdnq0K' };
      order.interval = 'month';
      order.totalAmount = 1000;
      order.collective = { id: brusselstogether.id };
      // When the order is created
      const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      // Then the created transaction should match the requested data
      const orderCreated = res.data.createOrder;
      const collective = orderCreated.collective;
      const subscription = orderCreated.subscription;
      expect(subscription.interval).to.equal('month');
      expect(subscription.isActive).to.be.true;
      expect(subscription.amount).to.equal(order.totalAmount);

      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, FromCollectiveId: xdamman.CollectiveId, amount: order.totalAmount }
      });

      // make sure the transaction has been recorded
      expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
      expect(transaction.CollectiveId).to.equal(collective.id);
      expect(transaction.currency).to.equal(collective.currency);
    });

    it('creates an order as a new user for a new organization', async () => {
      // Given the following data for the order
      order.collective = { id: brusselstogether.id };
      order.user = { firstName: "John", lastName: "Smith", email: "jsmith@email.com" };
      order.fromCollective = { name: "NewCo", website: "newco.com" };
      order.paymentMethod = { ...constants.paymentMethod, token: 'tok_3B5j8xDjPFcHOcTm3ogdnq0K' };
      // When the order is created
      const res = await utils.graphqlQuery(createOrderQuery, { order });
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const orderCreated = res.data.createOrder;
      const fromCollective = orderCreated.fromCollective;
      const collective = orderCreated.collective;
      const transactions = await models.Transaction.findAll({ where: { OrderId: orderCreated.id }});
      expect(fromCollective.website).to.equal('http://newco.com'); // api should prepend http://
      expect(transactions.length).to.equal(2);
      expect(transactions[0].type).to.equal('DEBIT');
      expect(transactions[0].FromCollectiveId).to.equal(collective.id);
      expect(transactions[0].CollectiveId).to.equal(fromCollective.id);
      expect(transactions[1].type).to.equal('CREDIT');
      expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
      expect(transactions[1].CollectiveId).to.equal(collective.id);
    });

    it('creates an order as a logged in user for an existing organization', async () => {
      // Given some users
      const xdamman = (await store.newUser('xdamman')).user;
      const duc = (await store.newUser('another user')).user;
      // And given an organization
      const newco = await models.Collective.create({
        type: 'ORGANIZATION',
        name: "newco",
        CreatedByUserId: xdamman.id,
      });
      // And the order parameters
      order.fromCollective = { id: newco.id };
      order.collective = { id: brusselstogether.id };
      order.paymentMethod = { ...constants.paymentMethod, token: 'tok_4B5j8xDjPFcHOcTm3ogdnq0K' };
      // Should fail if not an admin or member of the organization
      let res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("You don't have sufficient permissions to create an order on behalf of the newco organization");

      await models.Member.create({
        CollectiveId: newco.id,
        MemberCollectiveId: duc.CollectiveId,
        role: 'MEMBER',
        CreatedByUserId: duc.id
      });

      res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const orderCreated = res.data.createOrder;
      const fromCollective = orderCreated.fromCollective;
      const collective = orderCreated.collective;
      const transactions = await models.Transaction.findAll({ where: { OrderId: orderCreated.id }});
      expect(orderCreated.createdByUser.id).to.equal(duc.id);
      expect(transactions.length).to.equal(2);
      expect(transactions[0].type).to.equal('DEBIT');
      expect(transactions[0].FromCollectiveId).to.equal(collective.id);
      expect(transactions[0].CollectiveId).to.equal(fromCollective.id);
      expect(transactions[1].type).to.equal('CREDIT');
      expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
      expect(transactions[1].CollectiveId).to.equal(collective.id);
    });

    it(`creates an order as a logged in user for an existing collective using the collective's payment method`, async () => {
      const duc = (await store.newUser('another user')).user;
      const newco = await models.Collective.create({
        type: 'ORGANIZATION',
        name: "newco",
        CreatedByUserId: duc.id
      });
      order.collective = { id: brusselstogether.id };
      order.fromCollective = { id: newco.id };
      order.totalAmount = 20000;
      const paymentMethod = await models.PaymentMethod.create({
        ...constants.paymentMethod,
        token: 'tok_5B5j8xDjPFcHOcTm3ogdnq0K',
        monthlyLimitPerMember: 10000,
        CollectiveId: newco.id
      });
      order.paymentMethod = { uuid: paymentMethod.uuid };

      // Should fail if not an admin or member of the organization
      let res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("You don't have sufficient permissions to create an order on behalf of the newco organization");

      await models.Member.create({
        CollectiveId: newco.id,
        MemberCollectiveId: duc.CollectiveId,
        role: 'MEMBER',
        CreatedByUserId: duc.id
      });

      // Should fail if order.totalAmount > PaymentMethod.monthlyLimitPerMember
      res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("The total amount of this order (€200 ~= $239) is higher than your monthly spending limit on this payment method ($100)");

      sandbox.useFakeTimers((new Date('2017-09-22')).getTime());
      await paymentMethod.update({ monthlyLimitPerMember: 25000 }); // $250 limit
      res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      const availableBalance = await paymentMethod.getBalanceForUser(duc);
      expect(availableBalance.amount).to.equal(1160);

      const orderCreated = res.data.createOrder;
      const fromCollective = orderCreated.fromCollective;
      const collective = orderCreated.collective;
      const transactions = await models.Transaction.findAll({ where: { OrderId: orderCreated.id }, order: [['id','ASC']]});
      expect(orderCreated.createdByUser.id).to.equal(duc.id);
      expect(transactions.length).to.equal(2);
      expect(transactions[0].type).to.equal('DEBIT');
      expect(transactions[0].FromCollectiveId).to.equal(collective.id);
      expect(transactions[0].CollectiveId).to.equal(fromCollective.id);
      expect(transactions[1].type).to.equal('CREDIT');
      expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
      expect(transactions[1].CollectiveId).to.equal(collective.id);

      // Should fail if order.totalAmount > PaymentMethod.getBalanceForUser
      res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("You don't have enough funds available ($12 left) to execute this order (€200 ~= $239)");

    });

    describe(`host moves funds between collectives`, async () => {
      let hostAdmin, hostCollective;

      beforeEach(async () => {
        // First clean the database
        await utils.resetTestDB();
        // Given a host collective and its admin
        ({ hostAdmin, hostCollective } = await store.newHost('Host', 'USD', 10));
        // And the above collective's host has a stripe account
        await store.stripeConnectedAccount(hostCollective.id);
        // And given two collectives in that host
        const fromCollective = (await store.newCollectiveInHost('opensource', 'USD', hostCollective)).collective;
        await fromCollective.update({ isActive: true });
        const { collective } = await store.newCollectiveInHost('apex', 'USD', hostCollective);
        await collective.update({ isActive: true });
        // And given a payment method for the host
        const paymentMethod = await models.PaymentMethod.create({
          service: 'opencollective',
          CollectiveId: fromCollective.id,
        });
        // And given the following changes for the order
        order.fromCollective = { id: fromCollective.id };
        order.collective = { id: collective.id };
        order.paymentMethod = { uuid: paymentMethod.uuid  };
        order.interval = null;
        order.totalAmount = 10000000;
        delete order.tier;
        // And add some funds to the fromCollective
        await models.Transaction.create({
          CreatedByUserId: hostAdmin.id,
          HostCollectiveId: fromCollective.HostCollectiveId,
          CollectiveId: fromCollective.id,
          netAmountInCollectiveCurrency: 746149,
          type: 'CREDIT',
          currency: 'USD',
        });
      })

      it("Should fail if not enough funds in the fromCollective", async () => {
        const res = await utils.graphqlQuery(createOrderQuery, { order }, hostAdmin);
        expect(res.errors).to.exist;
        expect(res.errors[0].message).to.equal("You don't have enough funds available ($7,461 left) to execute this order ($100,000)");
      });

      it("succeeds", async () => {
        order.totalAmount = 20000;
        const res = await utils.graphqlQuery(createOrderQuery, { order }, hostAdmin);
        expect(res.errors).to.not.exist;
      })
    });

    it(`creates an order as a logged in user for an existing collective using the collective's balance`, async () => {
      const xdamman = (await store.newUser('xdamman')).user;
      const { hostCollective } = await store.newHost('Host Collective', 'USD', 10);
      const fromCollective = (await store.newCollectiveInHost(
        'opensource', 'USD', hostCollective)).collective;
      await fromCollective.update({ isActive: true });
      const collective = (await store.newCollectiveInHost(
        'apex', 'USD', hostCollective)).collective;
      await collective.update({ isActive: true });

      await models.Member.create({
        CreatedByUserId: xdamman.id,
        CollectiveId: fromCollective.id,
        MemberCollectiveId: xdamman.CollectiveId,
        role: 'ADMIN'
      });

      const paymentMethod = await models.PaymentMethod.create({
        CreatedByUserId: xdamman.id,
        service: 'opencollective',
        type: 'collective',
        CollectiveId: fromCollective.id
      });

      await models.Transaction.create({
        CreatedByUserId: xdamman.id,
        HostCollectiveId: fromCollective.HostCollectiveId,
        CollectiveId: fromCollective.id,
        netAmountInCollectiveCurrency: 746149,
        type: 'CREDIT',
        currency: 'USD',
      });

      order.fromCollective = { id: fromCollective.id };
      order.collective = { id: collective.id };
      order.paymentMethod = { uuid: paymentMethod.uuid };
      order.interval = null;
      order.totalAmount = 10000000;
      delete order.tier;

      // Should fail if not enough funds in the fromCollective
      let res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
      expect(res.errors).to.exist;
      expect(res.errors[0].message).to.equal("You don't have enough funds available ($7,461 left) to execute this order ($100,000)");

      order.totalAmount = 20000;

      res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      const availableBalance = await paymentMethod.getBalanceForUser(xdamman);
      expect(availableBalance.amount).to.equal(726149);

      const orderCreated = res.data.createOrder;
      const transactions = await models.Transaction.findAll({ where: { OrderId: orderCreated.id }});
      expect(orderCreated.createdByUser.id).to.equal(xdamman.id);
      expect(transactions.length).to.equal(2);
      expect(transactions[0].type).to.equal('DEBIT');
      expect(transactions[0].FromCollectiveId).to.equal(collective.id);
      expect(transactions[0].CollectiveId).to.equal(fromCollective.id);
      expect(transactions[1].type).to.equal('CREDIT');
      expect(transactions[1].FromCollectiveId).to.equal(fromCollective.id);
      expect(transactions[1].CollectiveId).to.equal(collective.id);

    });
});
