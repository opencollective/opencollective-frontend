import sinon from 'sinon';
import { expect } from 'chai';
import * as utils from './utils';
import models from '../server/models';
import * as store from './features/support/stores';

const ORDER_TOTAL_AMOUNT = 1000;

const createOrderQuery = `
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      fromCollective {
        id
        slug
      }
      collective {
        id
        slug
      }
      subscription {
        id
        amount
        interval
        isActive
        stripeSubscriptionId
      }
      totalAmount
      currency
      description
    }
  }
`;


describe("payments.collectiveToCollective.test.js", () => {
  const STRIPE_FEE_STUBBED_VALUE = 300;
  let sandbox, user1, user2, transactions,  collective1, collective2, collective3, host1, host2,
      organization, stripePaymentMethod, openCollectivePaymentMethod;

  before(async () => {
    await utils.resetTestDB();
  });

  describe('validation', () => {
    it('validates the token for Stripe', (done) => {
      models.PaymentMethod.create({ service: 'stripe', type: 'creditcard', token: 'invalid token' })
        .catch(e => {
          expect(e.message).to.equal("Invalid Stripe token invalid token");
          done();
        })
    })
  });

  describe('Collective to Collective Transactions', () => {

    before('creates User 1', () => models.User.createUserWithCollective({ name: "User 1" }).then(u => user1 = u));
    before('creates User 2', () => models.User.createUserWithCollective({ name: "User 2" }).then(u => user2 = u));
    before('create Host 1', () => models.Collective.create({ name: "Host 1", currency: "USD", isActive: true }).then(c => host1 = c));
    before('create Host 2', () => models.Collective.create({ name: "Host 2", currency: "USD", isActive: true }).then(c => host2 = c));
    before('create Collective 1', () => models.Collective.create({ name: "Collective 1", currency: "USD", HostCollectiveId: host1.id, isActive: true }).then(c => collective1 = c));
    before('create Collective 2', () => models.Collective.create({ name: "Collective 2", currency: "USD", HostCollectiveId: host1.id, isActive: true }).then(c => collective2 = c));
    before('create Collective 3', () => models.Collective.create({ name: "Collective 3", currency: "USD", HostCollectiveId: host2.id, isActive: true }).then(c => collective3 = c));
    // before('Add User 1 as Admin of Collective 1', () => collective1.editMembers([{ id: user1.id, MemberCollectiveId: user1.CollectiveId, role: 'ADMIN' }]));
    before('create an organization', () => models.Collective.create({ name: "pubnub", currency: "USD" }).then(o => organization = o));
    before('create a payment method', async () => models.PaymentMethod.create({
      name: '4242',
      service: 'stripe',
      type: 'creditcard',
      token: 'tok_123456781234567812345678',
      CollectiveId: organization.id,
      monthlyLimitPerMember: 10000
    }).then(pm => stripePaymentMethod = pm));
    beforeEach('create many transactions', async () => {
      transactions = [
        { amount: -500, netAmountInCollectiveCurrency: -500 },
        { amount: -200, netAmountInCollectiveCurrency: -200 },
        { amount: -1000,netAmountInCollectiveCurrency: -1000 }
      ];
      const transactionsDefaultValue = {
        CreatedByUserId: user1.id,
        FromCollectiveId: collective1.id,
        CollectiveId: organization.id,
        PaymentMethodId: stripePaymentMethod.id,
        currency: collective1.currency,
        HostCollectiveId: collective1.HostCollectiveId,
        type: 'DEBIT'
      };
      await models.Transaction.createMany(transactions, transactionsDefaultValue);
      await models.Transaction.createManyDoubleEntry(transactions, transactionsDefaultValue);
    });
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      // And given that the endpoint for creating customers on Stripe
      // is patched
      utils.stubStripeCreate(sandbox, { charge: { currency: 'usd', status: 'succeeded' } });
      // And given the stripe stuff that depends on values in the
      // order struct is patch. It's here and not on each test because
      // the `totalAmount' field doesn't change throught the tests.
      utils.stubStripeBalance(sandbox, ORDER_TOTAL_AMOUNT, 'usd',
                              0,
                              STRIPE_FEE_STUBBED_VALUE); // This is the payment processor fee.
    });

    afterEach(() => sandbox.restore());


    it('collective balance for Admin Member matches sum of transactions amounts', async () => {
      // getting balance of transactions that were just created
      const reducer = (accumulator, currentValue) => accumulator + currentValue;

      // multiplying by -1 to get the Collective 1 Credit values
      const balance = (-1) * transactions.map(t => t.netAmountInCollectiveCurrency).reduce(reducer, 0);

      //finding opencollective payment method for Collective 1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({ where: {type: 'collective', CollectiveId: collective1.id}});

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

      expect(balance).to.equal(ocPaymentMethodBalance.amount);
      expect(collective1.currency).to.equal(ocPaymentMethodBalance.currency);
    });/** END OF "check if collective balance for Admin Member matches sum of transactions amounts" */

    it('Collective 1 fails to pay Collective 2 because it is not logged in', async () => {
      //finding opencollective payment method for Collective 1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({ where: {type: 'collective', CollectiveId: collective1.id}});

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

      // Setting up order
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective2.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: ocPaymentMethodBalance.amount,
      }
      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order });

      // Then there should be Errors
      expect(res.errors).to.exist;

    });/** END OF "Collective 1 fails to pay Collective 2 because it is not logged in" */

    it('Collective 1 fails to pay Collective 2 because user is not Admin', async () => {
      //finding opencollective payment method for Collective 1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({ where: {type: 'collective', CollectiveId: collective1.id}});

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

      // Setting up order
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective2.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: ocPaymentMethodBalance.amount,
      }
      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user2);

      // Then there should be Errors
      expect(res.errors).to.exist;

    });/** END OF "Collective 1 fails to pay Collective 2 because user is not Admin" */

    it('Collective 1 sends money to Collective 2 with no fees(same host)', async () => {
      // Add User 1 as Collective 1 Admin
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN'
      });

      //finding opencollective payment method for Collective 1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({ where: {type: 'collective', CollectiveId: collective1.id}});

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

      // Setting up order
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective2.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: ocPaymentMethodBalance.amount,
      }

      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be no errors
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      // Then Find Created Transaction
      const orderFromCollective = res.data.createOrder.fromCollective;
      const orderCollective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: orderCollective.id, amount: order.totalAmount }
      });
      // Then Check whether Created Transaction has NO fees
      expect(transaction.FromCollectiveId).to.equal(orderFromCollective.id);
      expect(orderCollective.id).to.equal(collective2.id);
      expect(transaction.CollectiveId).to.equal(collective2.id);
      expect(transaction.currency).to.equal(collective2.currency);
      expect(transaction.platformFeeInHostCurrency).to.equal(0);
      expect(transaction.hostFeeInHostCurrency).to.equal(0);
      expect(transaction.paymentProcessorFeeInHostCurrency).to.equal(0);

    });/** END OF "Collective 1 sends money to Collective 2 with no fees(same host)" */

    it('Collective 1 fails to send money to Collective 3 because Collective 1\'s Host does not have a credit card', async () => {
      // Add User 1 as Collective 1 Admin
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN'
      });

      //finding opencollective payment method for Collective 1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({ where: {type: 'collective', CollectiveId: collective1.id}});

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

      // Setting up order
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective3.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: ocPaymentMethodBalance.amount/10,
      }
      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be Errors
      expect(res.errors).to.exist;
    });/** END OF "Collective 1 fails to send money to Collective 3 because Collective 1\'s Host does not have a credit card" */

    it('Collective 1 fails to send money to Collective 3 because Collective 3\'s Host does not have a credit card', async () => {
      // Add User 1 as Collective 1 Admin
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN'
      });

      // Create stripe connected account to host of collective 1
      await store.stripeConnectedAccount(collective1.HostCollectiveId);

      // Add credit card to Collective 1
      const collectivePaymentMethod = await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective1.HostCollectiveId,
        monthlyLimitPerMember: 10000
      });

      //finding opencollective payment method for Collective 1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({ where: {type: 'collective', CollectiveId: collective1.id}});

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

      // Setting up order
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective3.id },
        paymentMethod: { uuid: collectivePaymentMethod.uuid },
        totalAmount: ocPaymentMethodBalance.amount/10,
      }
      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be Errors
      expect(res.errors).to.exist;
    });/** END OF "Collective 1 fails to send money to Collective 3 because Collective 3\'s Host does not have a credit card" */

    it('Collective 1 sends money to Collective 3 through different hosts(no platform fees, but still has stripe and host fees)', async () => {
      // Add User 1 as Collective 1 Admin
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN'
      });

      // Create stripe connected account to host of collective 1
      await store.stripeConnectedAccount(collective1.HostCollectiveId);
      // Add credit card to Collective 1
      await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective1.HostCollectiveId,
        monthlyLimitPerMember: 10000
      });

      // Create stripe connected account to host of collective 3
      await store.stripeConnectedAccount(collective3.HostCollectiveId);
      // Add credit card to Collective 3
      await models.PaymentMethod.create({
        name: '4343',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective3.HostCollectiveId,
        monthlyLimitPerMember: 10000
      });

      //finding opencollective payment method for Collective 1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({ where: {type: 'collective', CollectiveId: collective1.id}});

      // Setting up order with amount less than the credit card monthly limit
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective3.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: 1000,
      }

      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be no errors
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      // Then Find Created Transaction
      const orderFromCollective = res.data.createOrder.fromCollective;
      const orderCollective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: orderCollective.id, amount: order.totalAmount }
      });

      // Then Check basic Transaction data
      expect(transaction.FromCollectiveId).to.equal(orderFromCollective.id);
      expect(orderCollective.id).to.equal(collective3.id);
      expect(transaction.CollectiveId).to.equal(collective3.id);
      expect(transaction.currency).to.equal(collective3.currency);

      // Then Check if transaction has NO Platform fees and has
      // Host and Payment Processor fees
      expect(transaction.platformFeeInHostCurrency).to.equal(0);
      const hostFee = (-1) * (collective1.hostFeePercent/100) * order.totalAmount;
      expect(transaction.hostFeeInHostCurrency).to.equal(hostFee);
      const paymentProcessorFee = (-1) * STRIPE_FEE_STUBBED_VALUE;
      expect(transaction.paymentProcessorFeeInHostCurrency).to.equal(paymentProcessorFee);
      expect(transaction.netAmountInCollectiveCurrency).to.equal(transaction.amount + hostFee + paymentProcessorFee);

    });/** END OF "Collective 1 sends money to Collective 3 through different hosts(no platform fees, but still has stripe and host fees)" */

    it('creates a recurring donation as logged in user', async () => {
      // Add User 1 as Collective 1 Admin
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN'
      });

      // Create stripe connected account to host of collective 1
      await store.stripeConnectedAccount(collective1.HostCollectiveId);
      // Add credit card to Collective 1
      await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective1.HostCollectiveId,
        monthlyLimitPerMember: 10000
      });

      // Create stripe connected account to host of collective 3
      await store.stripeConnectedAccount(collective3.HostCollectiveId);
      // Add credit card to Collective 3
      await models.PaymentMethod.create({
        name: '4343',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective3.HostCollectiveId,
        monthlyLimitPerMember: 10000
      });

      //finding opencollective payment method for Collective 1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({ where: {type: 'collective', CollectiveId: collective1.id}});

      // Setting up order with amount less than the credit card monthly limit
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective3.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: 1000,
        interval: 'month',
      }
      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be no errors
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      // When the order is created
      // Then the created transaction should match the requested data
      const orderCreated = res.data.createOrder;
      const orderCreatedCollective = orderCreated.collective;
      const orderCreatedFromCollective = orderCreated.fromCollective;
      const subscription = orderCreated.subscription;
      expect(subscription.interval).to.equal('month');
      expect(subscription.isActive).to.be.true;
      expect(subscription.amount).to.equal(order.totalAmount);

      const transaction = await models.Transaction.findOne({
        where: {
          CollectiveId: orderCreatedCollective.id,
          FromCollectiveId: orderCreatedFromCollective.id,
          amount: order.totalAmount,
        }
      });
      // make sure the transaction has been recorded
      expect(transaction.FromCollectiveId).to.equal(collective1.id);
      expect(transaction.CollectiveId).to.equal(collective3.id);
      expect(transaction.currency).to.equal(collective1.currency);
    });

  }); /** END OF "Collective to Collective Transactions"*/

}); /** END OF "payments.collectiveToCollective.test" */
