// Test tools
import { expect } from 'chai';
import nock from 'nock';
import * as utils from './utils';

// Components needed for writing the test
import models from '../server/models';

// What's being tested
import creditcard from '../server/paymentProviders/stripe/creditcard';

async function createOrderWithPaymentMethod(paymentMethodName, orderParams = {}) {
  const user = await models.User.createUserWithCollective({
    name: 'TestMcTesterson',
    email: 'tmct@mct.com',
  });
  const host = await models.Collective.create({ name: 'Host Collective' });
  const tier = await models.Tier.create({ name: 'backer', amount: 0 });
  const collective = await models.Collective.create({ name: 'Parcel!!' });
  collective.addHost(host);
  const connectedAccount = await models.ConnectedAccount.create({
    service: 'stripe',
    token: 'tok_1Be9noDjPFcHOcTmT574CrEv',
    CollectiveId: host.id,
  });
  const paymentMethod = await models.PaymentMethod.create({
    name: paymentMethodName,
    token: 'tok_123456781234567812345678',
    service: 'stripe',
    type: 'creditcard',
    data: { expMonth: 11, expYear: 2025 },
    monthlyLimitPerMember: 10000,
    CollectiveId: collective.id,
  });
  const order = await models.Order.create(
    Object.assign(
      {
        CreatedByUserId: user.id,
        FromCollectiveId: user.CollectiveId,
        CollectiveId: collective.id,
        PaymentMethodId: paymentMethod.id,
        TierId: tier.id,
        totalAmount: 1000,
        currency: 'USD',
      },
      orderParams,
    ),
  );
  order.fromCollective = user.collective;
  order.collective = collective;
  order.createdByUser = user;
  order.paymentMethod = paymentMethod;
  return { order, user, collective, paymentMethod, connectedAccount };
}

describe('paymentmethods.stripe.creditcard', () => {
  describe('#processOrder()', async () => {
    let secondCallToCreateCustomer;

    beforeEach(() => utils.resetTestDB());

    beforeEach(() => {
      // Call performed by getOrCreateCustomerOnPlatformAccount
      nock('https://api.stripe.com:443')
        .post('/v1/customers')
        .reply(200, {});

      // Calls performed by getOrCreateCustomerIdForHost
      nock('https://api.stripe.com:443')
        .post('/v1/tokens')
        .reply(200, {});
      secondCallToCreateCustomer = nock('https://api.stripe.com:443')
        .post('/v1/customers')
        .reply(200, {});

      // Calls performed by createChargeAndTransactions
      nock('https://api.stripe.com:443')
        .post('/v1/payment_intents')
        .reply(200, {
          charges: {
            data: [{ id: 'ch_1B5j91D8MNtzsDcgNMsUgI8L', balance_transaction: 'txn_1B5j92D8MNtzsDcgQzIcmfrn' }],
          },
          status: 'succeeded',
        });
      nock('https://api.stripe.com:443')
        .get('/v1/balance_transactions/txn_1B5j92D8MNtzsDcgQzIcmfrn')
        .reply(200, { amount: 1000, fee: 0, fee_details: [] });
    });

    afterEach(() => nock.cleanAll());

    it('should create a new customer id for a host', async () => {
      const { order } = await createOrderWithPaymentMethod('name');
      await creditcard.processOrder(order);
      expect(secondCallToCreateCustomer.isDone()).to.be.true;
    });

    it('has tax information stored in transaction', async () => {
      const taxAmount = 100;
      const { order } = await createOrderWithPaymentMethod('name', { taxAmount });
      const transaction = await creditcard.processOrder(order);
      expect(transaction.taxAmount).to.be.equal(-taxAmount);
    });
  });
});
