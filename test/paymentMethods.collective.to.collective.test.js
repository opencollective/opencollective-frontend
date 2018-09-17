import sinon from 'sinon';
import { expect } from 'chai';
import * as utils from './utils';
import models from '../server/models';
import * as store from './features/support/stores';

const ORDER_TOTAL_AMOUNT = 1000;
const STRIPE_FEE_STUBBED_VALUE = 300;

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

describe('paymentMethods.collective.to.collective.test.js', () => {
  let sandbox,
    user1,
    user2,
    transactions,
    collective1,
    collective2,
    collective3,
    collective4,
    collective5,
    collective6,
    host1,
    host2,
    host3,
    host4,
    organization,
    stripePaymentMethod,
    openCollectivePaymentMethod;

  before(async () => {
    await utils.resetTestDB();
  });

  describe('validation', () => {
    it('validates the token for Stripe', done => {
      models.PaymentMethod.create({
        service: 'stripe',
        type: 'creditcard',
        token: 'invalid token',
      }).catch(e => {
        expect(e.message).to.equal('Invalid Stripe token invalid token');
        done();
      });
    });
  });

  describe('Collective to Collective Transactions', () => {
    before('creates User 1', () =>
      models.User.createUserWithCollective({ name: 'User 1' }).then(
        u => (user1 = u),
      ),
    );
    before('creates User 2', () =>
      models.User.createUserWithCollective({ name: 'User 2' }).then(
        u => (user2 = u),
      ),
    );
    before('create Host 1(USD)', () =>
      models.Collective.create({
        name: 'Host 1',
        currency: 'USD',
        isActive: true,
      }).then(c => (host1 = c)),
    );
    before('create Host 2(USD)', () =>
      models.Collective.create({
        name: 'Host 2',
        currency: 'USD',
        isActive: true,
      }).then(c => (host2 = c)),
    );
    before('create Host 3(EUR)', () =>
      models.Collective.create({
        name: 'Host 3',
        currency: 'EUR',
        isActive: true,
      }).then(c => (host3 = c)),
    );
    before('create Host 4(EUR)', () =>
      models.Collective.create({
        name: 'Host 4',
        currency: 'EUR',
        isActive: true,
      }).then(c => (host4 = c)),
    );
    before('create collective1(currency USD, hostCurrency:USD)', () =>
      models.Collective.create({
        name: 'collective1',
        currency: 'USD',
        HostCollectiveId: host1.id,
        isActive: true,
      }).then(c => (collective1 = c)),
    );
    before('create collective2(currency USD, hostCurrency:USD)', () =>
      models.Collective.create({
        name: 'collective2',
        currency: 'USD',
        HostCollectiveId: host1.id,
        isActive: true,
      }).then(c => (collective2 = c)),
    );
    before('create collective3(currency USD, hostCurrency:USD)', () =>
      models.Collective.create({
        name: 'collective3',
        currency: 'USD',
        HostCollectiveId: host2.id,
        isActive: true,
      }).then(c => (collective3 = c)),
    );
    before('create collective4(currency EUR, hostCurrency:EUR)', () =>
      models.Collective.create({
        name: 'collective4',
        currency: 'EUR',
        HostCollectiveId: host3.id,
        isActive: true,
      }).then(c => (collective4 = c)),
    );
    before('create collective5(currency USD, hostCurrency:EUR)', () =>
      models.Collective.create({
        name: 'collective5',
        currency: 'USD',
        HostCollectiveId: host3.id,
        isActive: true,
      }).then(c => (collective5 = c)),
    );
    before('create collective6(currency USD, hostCurrency:EUR)', () =>
      models.Collective.create({
        name: 'collective6',
        currency: 'USD',
        HostCollectiveId: host4.id,
        isActive: true,
      }).then(c => (collective6 = c)),
    );
    before('create an organization', () =>
      models.Collective.create({ name: 'pubnub', currency: 'USD' }).then(
        o => (organization = o),
      ),
    );
    before('create a payment method', async () =>
      models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: organization.id,
        monthlyLimitPerMember: 10000,
      }).then(pm => (stripePaymentMethod = pm)),
    );
    beforeEach(
      'create transactions for 3 donations from organization to collective1',
      async () => {
        transactions = [
          { amount: 500, netAmountInCollectiveCurrency: 500 },
          { amount: 200, netAmountInCollectiveCurrency: 200 },
          { amount: 1000, netAmountInCollectiveCurrency: 1000 },
        ];
        const transactionsDefaultValue = {
          CreatedByUserId: user1.id,
          FromCollectiveId: organization.id,
          CollectiveId: collective1.id,
          PaymentMethodId: stripePaymentMethod.id,
          currency: collective1.currency,
          HostCollectiveId: collective1.HostCollectiveId,
          type: 'DEBIT',
        };
        await models.Transaction.createManyDoubleEntry(
          transactions,
          transactionsDefaultValue,
        );
      },
    );
    beforeEach(
      'create transactions for 3 donations from organization to collective5',
      async () => {
        transactions = [
          { amount: 500, netAmountInCollectiveCurrency: 500 },
          { amount: 200, netAmountInCollectiveCurrency: 200 },
          { amount: 1000, netAmountInCollectiveCurrency: 1000 },
        ];
        const transactionsDefaultValue = {
          CreatedByUserId: user1.id,
          FromCollectiveId: organization.id,
          CollectiveId: collective5.id,
          PaymentMethodId: stripePaymentMethod.id,
          currency: collective5.currency,
          HostCollectiveId: collective5.HostCollectiveId,
          type: 'DEBIT',
        };
        await models.Transaction.createManyDoubleEntry(
          transactions,
          transactionsDefaultValue,
        );
      },
    );
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      // And given that the endpoint for creating customers on Stripe
      // is patched
      utils.stubStripeCreate(sandbox, {
        charge: { currency: 'usd', status: 'succeeded' },
      });
      // And given the stripe stuff that depends on values in the
      // order struct is patch. It's here and not on each test because
      // the `totalAmount' field doesn't change throught the tests.
      utils.stubStripeBalance(
        sandbox,
        ORDER_TOTAL_AMOUNT,
        'usd',
        0,
        STRIPE_FEE_STUBBED_VALUE,
      ); // This is the payment processor fee.
    });

    afterEach(() => sandbox.restore());

    it('the available balance of the payment method of the collective should be equal to the balance of the collective', async () => {
      // getting balance of transactions that were just created
      const reducer = (accumulator, currentValue) => accumulator + currentValue;
      const balance = transactions
        .map(t => t.netAmountInCollectiveCurrency)
        .reduce(reducer, 0);

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(
        user1,
      );

      expect(balance).to.equal(ocPaymentMethodBalance.amount);
      expect(collective1.currency).to.equal(ocPaymentMethodBalance.currency);
    }); /** END OF "the available balance of the payment method of the collective should be equal to the balance of the collective" */

    it("Non admin members can't use the payment method of the collective", async () => {
      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(
        user1,
      );

      // Setting up order
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective2.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: ocPaymentMethodBalance.amount,
      };
      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order });
      const resWithUserParam = await utils.graphqlQuery(
        createOrderQuery,
        { order },
        user2,
      );

      // Then there should be Errors for the Result of the query without any user defined as param
      expect(res.errors).to.exist;
      expect(res.errors).to.not.be.empty;
      expect(res.errors[0].message).to.contain(
        'need to be logged in to create an order for an existing open collective',
      );

      // Then there should also be Errors for the Result of the query through user2
      expect(resWithUserParam.errors).to.exist;
      expect(resWithUserParam.errors).to.not.be.empty;
      expect(resWithUserParam.errors[0].message).to.contain(
        "don't have sufficient permissions to create an order on behalf of the",
      );
    }); /** END OF "Non admin members can\'t use the payment method of the collective" */

    it('Transactions between Collectives on the same host must have NO Fees', async () => {
      // Add user1 as an ADMIN of collective1
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN',
      });

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(
        user1,
      );

      // Setting up order
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective2.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: ocPaymentMethodBalance.amount,
      };

      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be no errors
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      // Then Find Created Transaction
      const orderFromCollective = res.data.createOrder.fromCollective;
      const orderCollective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: orderCollective.id, amount: order.totalAmount },
      });
      // Then Check whether Created Transaction has NO fees
      expect(transaction.FromCollectiveId).to.equal(orderFromCollective.id);
      expect(orderCollective.id).to.equal(collective2.id);
      expect(transaction.CollectiveId).to.equal(collective2.id);
      expect(transaction.currency).to.equal(collective2.currency);
      expect(transaction.platformFeeInHostCurrency).to.equal(0);
      expect(transaction.hostFeeInHostCurrency).to.equal(0);
      expect(transaction.paymentProcessorFeeInHostCurrency).to.equal(0);
    }); /** END OF "Transactions between Collectives on the same host must have NO Fees" */

    it("Cannot send money to a different host if the host of the collective doesn't have a credit card", async () => {
      // Add user1 as an ADMIN of collective1
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN',
      });

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(
        user1,
      );

      // Setting up order
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective3.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: ocPaymentMethodBalance.amount / 10,
      };
      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be Errors
      expect(res.errors).to.exist;
      expect(res.errors).to.not.be.empty;
      expect(res.errors[0].message).to.contain(
        'needs to add a credit card to send money',
      );
    }); /** END OF "Cannot send money to a different host if the host of the collective doesn\'t have a credit card" */

    it('Cannot send money that exceeds Collective balance', async () => {
      // Add user1 as an ADMIN of collective1
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN',
      });

      // Create stripe connected account to host of collective1
      await store.stripeConnectedAccount(collective1.HostCollectiveId);
      // Add credit card to collective1
      await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective1.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });
      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(
        user1,
      );

      // set an amount that's higher than the collective balance
      const amountHigherThanCollectiveBalance =
        ocPaymentMethodBalance.amount + 1;

      // Setting up order with amount higher than collective1 balance
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective3.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: amountHigherThanCollectiveBalance,
      };

      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be errors
      expect(res.errors).to.exist;
      expect(res.errors).to.not.be.empty;
      expect(res.errors[0].message).to.contain(
        "don't have enough funds available ",
      );
    }); /** END OF "Cannot send money that exceeds Collective balance" */

    it('Cannot send money if The Collectives have different currencies', async () => {
      // Add user1 as an ADMIN of collective1
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN',
      });

      // Create stripe connected account to host of collective1
      await store.stripeConnectedAccount(collective1.HostCollectiveId);
      // Add credit card to collective1
      await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective1.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // Setting up order with amount less than the credit card monthly limit
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective4.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: 1000,
      };

      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be errors
      expect(res.errors).to.exist;
      expect(res.errors).to.not.be.empty;
      expect(res.errors[0].message).to.contain(
        'Payments Across hosts are only allowed when both Collectives have the same currency.',
      );
    }); /** END OF "Cannot send money if The Collectives have different currencies" */

    it('Cannot send money If Hosts of Collectives have different currencies', async () => {
      // Add user1 as an ADMIN of collective1
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN',
      });

      // Create stripe connected account to host of collective1
      await store.stripeConnectedAccount(collective1.HostCollectiveId);
      // Add credit card to collective1
      await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective1.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // Setting up order with amount less than the credit card monthly limit
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective5.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: 1000,
      };

      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be errors
      expect(res.errors).to.exist;
      expect(res.errors).to.not.be.empty;
      expect(res.errors[0].message).to.contain(
        'Payment Across Hosts are only allowed when both Hosts have the same currency.',
      );
    }); /** END OF "Cannot send money If Hosts of Collectives have different currencies" */

    it("Transaction between Collectives with same currency(collective5 USD and collective6 USD) with different hosts that have the same currency(host3 EUR and host4 EUR) that's different from the collectives currencies", async () => {
      // Add user1 as an ADMIN of collective5
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective5.id,
        role: 'ADMIN',
      });

      // Create stripe connected account to host of collective1
      await store.stripeConnectedAccount(collective5.HostCollectiveId);
      // Add credit card to collective1
      await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        currency: 'EUR',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective5.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });

      // Create stripe connected account to host of collective6
      await store.stripeConnectedAccount(collective6.HostCollectiveId);
      // Add credit card to collective3
      await models.PaymentMethod.create({
        name: '4343',
        service: 'stripe',
        type: 'creditcard',
        currency: 'EUR',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective6.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective5.id },
      });

      // Setting up order with amount less than the credit card monthly limit
      const order = {
        fromCollective: { id: collective5.id },
        collective: { id: collective6.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: 1000,
      };

      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be no errors
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      // When the order is created
      // Then the created transaction should match the requested data
      const orderCreated = res.data.createOrder;
      const transaction = await models.Transaction.findOne({
        where: {
          CollectiveId: orderCreated.collective.id,
          FromCollectiveId: orderCreated.fromCollective.id,
          amount: order.totalAmount,
        },
      });
      // make sure the transaction has been recorded
      expect(transaction.FromCollectiveId).to.equal(collective5.id);
      expect(transaction.CollectiveId).to.equal(collective6.id);
      expect(transaction.currency).to.equal(collective5.currency);
    }); /** END OF "Transaction between Collectives with same currency(collective5 USD and collective6 USD) with different hosts that have the same currency(host3 EUR and host4 EUR) that\'s different from the collectives currencies" */

    it('Transactions between Collectives through different hosts must have NO platform fees but still have stripe and host fees', async () => {
      // Add user1 as an ADMIN of collective1
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN',
      });

      // Create stripe connected account to host of collective1
      await store.stripeConnectedAccount(collective1.HostCollectiveId);
      // Add credit card to collective1
      await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective1.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });

      // Create stripe connected account to host of collective3
      await store.stripeConnectedAccount(collective3.HostCollectiveId);
      // Add credit card to collective3
      await models.PaymentMethod.create({
        name: '4343',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective3.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // Setting up order with amount less than the credit card monthly limit
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective3.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: 1000,
      };

      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order }, user1);

      // Then there should be no errors
      res.errors && console.error(res.errors);
      expect(res.errors).to.not.exist;

      // Then Find Created Transaction
      const orderFromCollective = res.data.createOrder.fromCollective;
      const orderCollective = res.data.createOrder.collective;
      const transaction = await models.Transaction.findOne({
        where: { CollectiveId: orderCollective.id, amount: order.totalAmount },
      });
      // Then Check basic Transaction data
      expect(transaction.FromCollectiveId).to.equal(orderFromCollective.id);
      expect(orderCollective.id).to.equal(collective3.id);
      expect(transaction.CollectiveId).to.equal(collective3.id);
      expect(transaction.currency).to.equal(collective3.currency);

      // Then Check if transaction has NO Platform fees and has
      // Host and Payment Processor fees
      expect(transaction.platformFeeInHostCurrency).to.equal(0);
      const hostFee =
        -1 * (collective1.hostFeePercent / 100) * order.totalAmount;
      expect(transaction.hostFeeInHostCurrency).to.equal(hostFee);
      const paymentProcessorFee = -1 * STRIPE_FEE_STUBBED_VALUE;
      expect(transaction.paymentProcessorFeeInHostCurrency).to.equal(
        paymentProcessorFee,
      );
      expect(transaction.netAmountInCollectiveCurrency).to.equal(
        transaction.amount + hostFee + paymentProcessorFee,
      );
    }); /** END OF "Transactions between Collectives through different hosts must have NO platform fees but still have stripe and host fees" */

    it('Recurring donations between Collectives with the same host must be allowed', async () => {
      // Add user1 as an ADMIN of collective1
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN',
      });

      // Create stripe connected account to host of collective1
      await store.stripeConnectedAccount(collective1.HostCollectiveId);
      // Add credit card to collective1
      await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective1.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // Setting up order with amount less than the credit card monthly limit
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective2.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: 1000,
        interval: 'month',
      };
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
        },
      });
      // make sure the transaction has been recorded
      expect(transaction.FromCollectiveId).to.equal(collective1.id);
      expect(transaction.CollectiveId).to.equal(collective2.id);
      expect(transaction.currency).to.equal(collective1.currency);
    }); /** END OF "Recurring donations between Collectives with the same host must be allowed"*/

    it('Recurring donations between Collectives with different hosts must be allowed', async () => {
      // Add user1 as an ADMIN of collective1
      await models.Member.create({
        CreatedByUserId: user1.id,
        MemberCollectiveId: user1.CollectiveId,
        CollectiveId: collective1.id,
        role: 'ADMIN',
      });

      // Create stripe connected account to host of collective1
      await store.stripeConnectedAccount(collective1.HostCollectiveId);
      // Add credit card to collective1
      await models.PaymentMethod.create({
        name: '4242',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective1.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });

      // Create stripe connected account to host of collective3
      await store.stripeConnectedAccount(collective3.HostCollectiveId);
      // Add credit card to collective3
      await models.PaymentMethod.create({
        name: '4343',
        service: 'stripe',
        type: 'creditcard',
        token: 'tok_123456781234567812345678',
        CollectiveId: collective3.HostCollectiveId,
        monthlyLimitPerMember: 10000,
      });

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // Setting up order with amount less than the credit card monthly limit
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective3.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: 1000,
        interval: 'month',
      };
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
        },
      });
      // make sure the transaction has been recorded
      expect(transaction.FromCollectiveId).to.equal(collective1.id);
      expect(transaction.CollectiveId).to.equal(collective3.id);
      expect(transaction.currency).to.equal(collective1.currency);
    });
  }); /** END OF "Recurring donations between Collectives with different hosts must be allowed"*/
}); /** END OF "payments.collectiveToCollective.test" */
