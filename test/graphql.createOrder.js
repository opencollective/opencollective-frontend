import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';
import * as utils from './utils';
import Stripe from 'stripe';
import config from 'config';
import { cloneDeep } from 'lodash';
import nock from 'nock';
import initNock from './graphql.createOrder.nock';

const order = {
    "quantity": 1,
    "interval": null,
    "totalAmount": 154300,
    "paymentMethod": {
        "name": "4242",
        "data": {
          "expMonth": 10,
          "expYear": 2023,
          "brand": "Visa",
          "country": "US",
          "funding": "credit"
        }
    },
    "collective": {
        "id": 207
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
      processedAt
    }
  }
  `;

  const constants = {
  paymentMethod: {
    service: "stripe",
    type: 'creditcard',
    data: {
      expMonth: 11,
      expYear: 2025
    }
  }
};

describe('createOrder', () => {

  describe("using empty opencollective_test db", () => {

    beforeEach(() => utils.resetTestDB());

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

  });

  describe("using opencollective_dvl db", () => {

    before(initNock);

    after(() => {
      nock.cleanAll();
    });

    beforeEach(() => utils.loadDB('opencollective_dvl'));

    it('creates an order as new user', async () => {

      const stripeCardToken = await utils.createStripeToken();

      order.user = {
        firstName: "John",
        lastName: "Smith",
        email: "jsmith@email.com"
      };
      order.paymentMethod.token = stripeCardToken;
      const res = await utils.graphqlQuery(createOrderQuery, { order });
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const fromCollective = res.data.createOrder.fromCollective;
      const collective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, amount: order.totalAmount }
      });
      expect(transaction.FromCollectiveId).to.equal(fromCollective.id);
      expect(transaction.CollectiveId).to.equal(collective.id);
      expect(transaction.currency).to.equal(collective.currency);
      // expect(transaction.hostFeeInHostCurrency).to.equal(0.05 * order.totalAmount); // need to update BrusselsTogether.hostFee in opencollective_dvl DB
      expect(transaction.platformFeeInHostCurrency).to.equal(0.05 * order.totalAmount);
      expect(transaction.data.charge.currency).to.equal(collective.currency.toLowerCase());
      expect(transaction.data.charge.status).to.equal('succeeded');
      expect(transaction.data.balanceTransaction.net - transaction.hostFeeInHostCurrency).to.equal(transaction.netAmountInCollectiveCurrency);

      // we create a customer on the host stripe account even for one time charges
      expect(transaction.data.charge.customer).to.not.be.null;

      // make sure the payment has been recorded in the connected Stripe Account of the host
      const hostMember = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'HOST' } });
      const hostStripeAccount = await models.ConnectedAccount.findOne({
        where: { service: 'stripe', CollectiveId: hostMember.MemberCollectiveId }
      });
      const charge = await Stripe(hostStripeAccount.token).charges.retrieve(transaction.data.charge.id);
      expect(charge.source.last4).to.equal('4242');
    });

    it('creates an order as new anonymous user', async () => {

      const newOrder = cloneDeep(order);
      newOrder.user = {
        firstName: "",
        lastName: "",
        email: "jsmith@email.com"
      };
      newOrder.totalAmount = 0;
      delete newOrder.paymentMethod;

      const res = await utils.graphqlQuery(createOrderQuery, { order: newOrder });
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const fromCollective = res.data.createOrder.fromCollective;
      expect(fromCollective.slug).to.match(/anonymous/);
      expect(fromCollective.name).to.match(/anonymous/);
    });

    it('creates an order as logged in user', async () => {

      const xdamman = await models.User.findById(2);

      const stripeCardToken = await utils.createStripeToken();

      order.fromCollective = { id: xdamman.CollectiveId };
      order.paymentMethod.token = stripeCardToken;

      const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const collective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, amount: order.totalAmount }
      });
      expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
      expect(transaction.CollectiveId).to.equal(collective.id);
      expect(transaction.currency).to.equal(collective.currency);
      expect(transaction.hostFeeInHostCurrency).to.equal(0);
      expect(transaction.platformFeeInHostCurrency).to.equal(0.05 * order.totalAmount);
      expect(transaction.data.charge.currency).to.equal(collective.currency.toLowerCase());
      expect(transaction.data.charge.status).to.equal('succeeded');
      expect(transaction.data.balanceTransaction.net - transaction.hostFeeInHostCurrency).to.equal(transaction.netAmountInCollectiveCurrency);

      // make sure the payment has been recorded in the connected Stripe Account of the host
      const hostMember = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'HOST' } });
      const hostStripeAccount = await models.ConnectedAccount.findOne({
        where: { service: 'stripe', CollectiveId: hostMember.MemberCollectiveId }
      });
      const charge = await Stripe(hostStripeAccount.token).charges.retrieve(transaction.data.charge.id);
      expect(charge.source.last4).to.equal('4242');
    });

    it('creates an order as logged in user using saved credit card', async () => {

      const token = await utils.createStripeToken();
      const xdamman = await models.User.findById(2);
      const collectiveToEdit = {
        id: xdamman.CollectiveId,
        paymentMethods: []
      }

      collectiveToEdit.paymentMethods.push({
        name: '4242',
        service: 'stripe',
        token
      });

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

      order.fromCollective = { id: xdamman.CollectiveId }
      order.paymentMethod = { uuid: res.data.editCollective.paymentMethods[0].uuid };

      res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;
      const collective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: collective.id, amount: order.totalAmount }
      });
      expect(transaction.FromCollectiveId).to.equal(xdamman.CollectiveId);
      expect(transaction.CollectiveId).to.equal(collective.id);
      expect(transaction.currency).to.equal(collective.currency);
      expect(transaction.hostFeeInHostCurrency).to.equal(0);
      expect(transaction.platformFeeInHostCurrency).to.equal(0.05 * order.totalAmount);
      expect(transaction.data.charge.currency).to.equal(collective.currency.toLowerCase());
      expect(transaction.data.charge.status).to.equal('succeeded');
      expect(transaction.data.balanceTransaction.net - transaction.hostFeeInHostCurrency).to.equal(transaction.netAmountInCollectiveCurrency);

      // make sure the payment has been recorded in the connected Stripe Account of the host
      const hostMember = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'HOST' } });
      const hostStripeAccount = await models.ConnectedAccount.findOne({
        where: { service: 'stripe', CollectiveId: hostMember.MemberCollectiveId }
      });
      const charge = await Stripe(hostStripeAccount.token).charges.retrieve(transaction.data.charge.id);
      expect(charge.source.last4).to.equal('4242');
    });

    it('creates a recurring donation as logged in user', async () => {

      const token = await utils.createStripeToken();
      const xdamman = await models.User.findById(2);

      order.fromCollective = { id: xdamman.CollectiveId };
      order.paymentMethod = {
        ...constants.paymentMethod,
        token
      };
      order.interval = 'month';
      order.totalAmount = 1000;

      const res = await utils.graphqlQuery(createOrderQuery, { order }, xdamman);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      const orderCreated = res.data.createOrder;
      const collective = orderCreated.collective;
      const subscription = orderCreated.subscription;
      expect(orderCreated.processedAt).to.not.be.null;
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

      // make sure the subscription has been recorded in the connected Stripe Account of the host
      const hostMember = await models.Member.findOne({ where: { CollectiveId: collective.id, role: 'HOST' } });
      const hostStripeAccount = await models.ConnectedAccount.findOne({
        where: { service: 'stripe', CollectiveId: hostMember.MemberCollectiveId }
      });

      const paymentMethod = await models.PaymentMethod.findById(orderCreated.paymentMethod.id);
      const stripeSubscription = await Stripe(config.stripe.secret).subscriptions.retrieve(subscription.stripeSubscriptionId, { stripe_account: hostStripeAccount.username });

      expect(stripeSubscription.application_fee_percent).to.equal(5);
      expect(stripeSubscription.plan.id).to.equal('EUR-MONTH-1000');
      expect(stripeSubscription.plan.interval).to.equal('month');

      expect(paymentMethod.data.customerIdForHost[hostStripeAccount.username]).to.equal(stripeSubscription.customer);
    });

    it('creates an order as a new user for a new organization', async () => {

      const token = await utils.createStripeToken();

      order.user = {
        firstName: "John",
        lastName: "Smith",
        email: "jsmith@email.com"
      };

      order.fromCollective = {
        name: "NewCo",
        website: "newco.com"
      };

      order.paymentMethod = {
        ...constants.paymentMethod,
        token,
      }

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

      const token = await utils.createStripeToken();
      const duc = await models.User.findById(65);
      const newco = await models.Collective.create({
        type: 'ORGANIZATION',
        name: "newco",
        CreatedByUserId: 8 // Aseem
      });

      order.fromCollective = { id: newco.id };

      order.paymentMethod = {
        ...constants.paymentMethod,
        token,
      }

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

      const token = await utils.createStripeToken();
      const duc = await models.User.findById(65);
      const newco = await models.Collective.create({
        type: 'ORGANIZATION',
        name: "newco",
        CreatedByUserId: duc.id
      });

      order.fromCollective = { id: newco.id };
      order.totalAmount = 20000;
      const paymentMethod = await models.PaymentMethod.create({
        ...constants.paymentMethod,
        token,
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

      await paymentMethod.update({ monthlyLimitPerMember: 25000 }); // $250 limit
      res = await utils.graphqlQuery(createOrderQuery, { order }, duc);
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      const availableBalance = await paymentMethod.getBalanceForUser(duc);
      expect(availableBalance.amount).to.equal(1078);

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
      expect(res.errors[0].message).to.equal("You don't have enough funds available ($11 left) to execute this order (€200 ~= $239)");

    });

    it(`creates an order as a logged in user for an existing collective using the collective's balance`, async () => {

      const xdamman = await models.User.findById(2);
      const fromCollective = await models.Collective.findOne({ where: { slug: 'opensource' }})
      const collective = await models.Collective.findOne({ where: { slug: 'apex' }})

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
});
