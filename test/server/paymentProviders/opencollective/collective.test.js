import sinon from 'sinon';
import { expect } from 'chai';

import models from '../../../../server/models';
import CollectivePaymentProvider from '../../../../server/paymentProviders/opencollective/collective';

import * as utils from '../../../utils';
import * as store from '../../../stores';

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

describe('server/paymentProviders/opencollective/collective', () => {
  before(async () => {
    await utils.resetTestDB();
  });

  describe('Collective to Collective Transactions', () => {
    let sandbox,
      user1,
      user2,
      transactions,
      collective1,
      collective2,
      collective3,
      collective5,
      host1,
      host2,
      host3,
      organization,
      stripePaymentMethod,
      openCollectivePaymentMethod;

    before('creates User 1', () =>
      models.User.createUserWithCollective({
        email: store.randEmail(),
        name: 'User 1',
      }).then(u => (user1 = u)),
    );

    before('creates User 2', () =>
      models.User.createUserWithCollective({
        email: store.randEmail(),
        name: 'User 2',
      }).then(u => (user2 = u)),
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

    before('create collective5(currency USD, hostCurrency:EUR)', () =>
      models.Collective.create({
        name: 'collective5',
        currency: 'USD',
        HostCollectiveId: host3.id,
        isActive: true,
      }).then(c => (collective5 = c)),
    );

    before('create an organization', () =>
      models.Collective.create({ name: 'pubnub', currency: 'USD' }).then(o => (organization = o)),
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

    beforeEach('create transactions for 3 donations from organization to collective1', async () => {
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
      await models.Transaction.createManyDoubleEntry(transactions, transactionsDefaultValue);
    });

    beforeEach('create transactions for 3 donations from organization to collective5', async () => {
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
      await models.Transaction.createManyDoubleEntry(transactions, transactionsDefaultValue);
    });

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
      utils.stubStripeBalance(sandbox, ORDER_TOTAL_AMOUNT, 'usd', 0, STRIPE_FEE_STUBBED_VALUE); // This is the payment processor fee.
    });

    afterEach(() => sandbox.restore());

    it('the available balance of the payment method of the collective should be equal to the balance of the collective', async () => {
      // getting balance of transactions that were just created
      const reducer = (accumulator, currentValue) => accumulator + currentValue;
      const balance = transactions.map(t => t.netAmountInCollectiveCurrency).reduce(reducer, 0);

      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

      expect(balance).to.equal(ocPaymentMethodBalance.amount);
      expect(collective1.currency).to.equal(ocPaymentMethodBalance.currency);
    }); /** END OF "the available balance of the payment method of the collective should be equal to the balance of the collective" */

    it("Non admin members can't use the payment method of the collective", async () => {
      // finding opencollective payment method for collective1
      openCollectivePaymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', CollectiveId: collective1.id },
      });

      // get Balance given the created user
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

      // Setting up order
      const order = {
        fromCollective: { id: collective1.id },
        collective: { id: collective2.id },
        paymentMethod: { uuid: openCollectivePaymentMethod.uuid },
        totalAmount: ocPaymentMethodBalance.amount,
      };
      // Executing queries
      const res = await utils.graphqlQuery(createOrderQuery, { order });
      const resWithUserParam = await utils.graphqlQuery(createOrderQuery, { order }, user2);

      // Then there should be Errors for the Result of the query without any user defined as param
      expect(res.errors).to.exist;
      expect(res.errors).to.not.be.empty;
      expect(res.errors[0].message).to.contain('You need to be authenticated to perform this action');

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
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

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
      const ocPaymentMethodBalance = await openCollectivePaymentMethod.getBalanceForUser(user1);

      // set an amount that's higher than the collective balance
      const amountHigherThanCollectiveBalance = ocPaymentMethodBalance.amount + 1;

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
      expect(res.errors[0].message).to.contain("don't have enough funds available ");
    }); /** END OF "Cannot send money that exceeds Collective balance" */

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

    it('Recurring donations between Collectives with different hosts must not be allowed', async () => {
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

      // Then there should be errors
      expect(res.errors).to.exist;
      expect(res.errors).to.not.be.empty;
      expect(res.errors[0].message).to.contain(
        'Cannot use the opencollective payment method to make a payment between different hosts',
      );
    });
  }); /** END OF "Recurring donations between Collectives with different hosts must be allowed"*/

  describe('Refunds', () => {
    let user, fromCollective, toCollective, host;

    /** Create an order from `collective1` to `collective2` */
    const createOrder = async (fromCollective, toCollective, amount = 5000) => {
      const paymentMethod = await models.PaymentMethod.findOne({
        where: { type: 'collective', service: 'opencollective', CollectiveId: fromCollective.id },
      });

      const order = await models.Order.create({
        CreatedByUserId: fromCollective.CreatedByUserId,
        FromCollectiveId: fromCollective.id,
        CollectiveId: toCollective.id,
        totalAmount: amount,
        currency: 'USD',
        status: 'PENDING',
        PaymentMethodId: paymentMethod.id,
      });

      // Bind some required properties
      order.collective = toCollective;
      order.fromCollective = fromCollective;
      order.createByUser = user;
      order.paymentMethod = paymentMethod;
      return order;
    };

    const checkBalances = async (expectedFrom, expectedTo) => {
      expect(await fromCollective.getBalance()).to.eq(expectedFrom);
      expect(await toCollective.getBalance()).to.eq(expectedTo);
    };

    before('Create initial data', async () => {
      host = await models.Collective.create({ name: 'Host', currency: 'USD', isActive: true });
      user = await models.User.createUserWithCollective({ email: store.randEmail(), name: 'User 1' });
      const collectiveParams = {
        currency: 'USD',
        HostCollectiveId: host.id,
        isActive: true,
        type: 'COLLECTIVE',
        CreatedByUserId: user.id,
      };
      fromCollective = await models.Collective.create({ name: 'collective1', ...collectiveParams });
      toCollective = await models.Collective.create({ name: 'collective2', ...collectiveParams });
    });

    it('Creates the opposite transactions', async () => {
      await checkBalances(0, 0);
      const orderData = await createOrder(fromCollective, toCollective);
      const transaction = await CollectivePaymentProvider.processOrder(orderData);
      await checkBalances(-5000, 5000);

      const refund = await CollectivePaymentProvider.refundTransaction(transaction, user);
      await checkBalances(0, 0);

      expect(refund.amount).to.eq(transaction.amount);
      expect(refund.currency).to.eq(transaction.currency);
      expect(refund.platformFeeInHostCurrency).to.eq(0);
      expect(refund.hostFeeInHostCurrency).to.eq(0);
      expect(refund.paymentProcessorFeeInHostCurrency).to.eq(0);
    });

    it('Cannot reimburse money if it exceeds the Collective balance', async () => {
      await checkBalances(0, 0);
      const orderData = await createOrder(fromCollective, toCollective);
      const transaction = await CollectivePaymentProvider.processOrder(orderData);
      await checkBalances(-5000, 5000);
      const orderData2 = await createOrder(toCollective, fromCollective, 2500);
      await CollectivePaymentProvider.processOrder(orderData2);
      await checkBalances(-2500, 2500);
      expect(CollectivePaymentProvider.refundTransaction(transaction, user)).to.be.rejectedWith(
        "The collective doesn't have enough funds to process this refund",
      );
    }); /** END OF "Cannot send money that exceeds Collective balance" */
  });
}); /** END OF "payments.collectiveToCollective.test" */
