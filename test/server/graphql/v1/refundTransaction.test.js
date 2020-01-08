// Test tools
import nock from 'nock';
import sinon from 'sinon';
import { expect } from 'chai';
import * as utils from '../../../utils';

// Code components used for setting up the tests
import models from '../../../../server/models';
import * as constants from '../../../../server/constants/transactions';
import * as paymentsLib from '../../../../server/lib/payments';
import { extractFees } from '../../../../server/lib/stripe';

// The GraphQL query that will refund a transaction (it returns the
// transaction being refunded)
const refundQuery = `
  mutation refundTransaction($id: Int!) {
    refundTransaction(id: $id) {
      id
    }
  }
`;

async function setupTestObjects() {
  const user = await models.User.createUserWithCollective(utils.data('user1'));
  const host = await models.User.createUserWithCollective(utils.data('host1'));
  const collective = await models.Collective.create(utils.data('collective1'));
  await collective.addHost(host.collective, host);
  const tier = await models.Tier.create(utils.data('tier1'));
  const paymentMethod = await models.PaymentMethod.create(utils.data('paymentMethod2'));
  await models.ConnectedAccount.create({
    service: 'stripe',
    token: 'sk_test_XOFJ9lGbErcK5akcfdYM1D7j',
    username: 'acct_198T7jD8MNtzsDcg',
    CollectiveId: host.id,
  });
  const order = await models.Order.create({
    description: 'Donation',
    totalAmount: 5000,
    currency: 'USD',
    TierId: tier.id,
    CreatedByUserId: user.id,
    FromCollectiveId: user.CollectiveId,
    CollectiveId: collective.id,
    PaymentMethodId: paymentMethod.id,
  });
  const charge = {
    id: 'ch_1Bs9ECBYycQg1OMfGIYoPFvk',
    object: 'charge',
    amount: 5000,
    amount_refunded: 0,
    application: 'ca_68FQ4jN0XMVhxpnk6gAptwvx90S9VYXF',
    application_fee: 'fee_1Bs9EEBYycQg1OMfdtHLPqEr',
    balance_transaction: 'txn_1Bs9EEBYycQg1OMfTR33Y5Xr',
    captured: true,
    created: 1517834264,
    currency: 'usd',
    customer: 'cus_9sKDFZkPwuFAF8',
  };
  const balanceTransaction = {
    id: 'txn_1Bs9EEBYycQg1OMfTR33Y5Xr',
    object: 'balance_transaction',
    amount: 5000,
    currency: 'usd',
    fee: 425,
    fee_details: [
      { amount: 175, currency: 'usd', type: 'stripe_fee' },
      { amount: 250, currency: 'usd', type: 'application_fee' },
    ],
    net: 4575,
    status: 'pending',
    type: 'charge',
  };
  const fees = extractFees(balanceTransaction);
  const payload = {
    CreatedByUserId: user.id,
    FromCollectiveId: user.CollectiveId,
    CollectiveId: collective.id,
    PaymentMethodId: paymentMethod.id,
    transaction: {
      type: constants.TransactionTypes.CREDIT,
      OrderId: order.id,
      amount: order.totalAmount,
      currency: order.currency,
      hostCurrency: balanceTransaction.currency,
      amountInHostCurrency: balanceTransaction.amount,
      hostCurrencyFxRate: order.totalAmount / balanceTransaction.amount,
      hostFeeInHostCurrency: paymentsLib.calcFee(balanceTransaction.amount, collective.hostFeePercent),
      platformFeeInHostCurrency: fees.applicationFee,
      paymentProcessorFeeInHostCurrency: fees.stripeFee,
      description: order.description,
      data: { charge, balanceTransaction },
    },
  };
  const transaction = await models.Transaction.createFromPayload(payload);
  return { user, host, collective, tier, paymentMethod, order, transaction };
}

function initStripeNock({ amount, fee, fee_details, net }) {
  const refund = {
    id: 're_1Bvu79LzdXg9xKNSFNBqv7Jn',
    amount: 5000,
    balance_transaction: 'txn_1Bvu79LzdXg9xKNSWEVCLSUu',
  };

  nock('https://api.stripe.com:443')
    .post('/v1/refunds')
    .reply(200, refund);

  nock('https://api.stripe.com:443')
    .get('/v1/balance_transactions/txn_1Bvu79LzdXg9xKNSWEVCLSUu')
    .reply(200, {
      id: 'txn_1Bvu79LzdXg9xKNSWEVCLSUu',
      amount,
      fee,
      fee_details,
      net,
    });

  nock('https://api.stripe.com:443')
    .get('/v1/charges/ch_1Bs9ECBYycQg1OMfGIYoPFvk')
    .reply(200, {
      id: 'ch_1Bs9ECBYycQg1OMfGIYoPFvk',
      amount,
      fee,
      fee_details,
      refunds: {
        object: 'list',
        data: [refund],
      },
    });
}

describe('server/graphql/v1/refundTransaction', () => {
  /* All the tests will touch the database, so resetting it is the
   * first thing we do. */
  beforeEach(async () => await utils.resetTestDB());

  it('should gracefully fail when transaction does not exist', async () => {
    // Given that we create a user, host, collective, tier,
    // paymentMethod, an order and a transaction (that we'll ignore)
    const { user } = await setupTestObjects();

    // When a refunded attempt happens on a transaction that does not
    // exist in the database
    const result = await utils.graphqlQuery(refundQuery, { id: 919191 }, user);

    // Then it should error out with the right error
    const [{ message }] = result.errors;
    expect(message).to.equal('Transaction not found');
  });

  it("should error if user isn't an admin of the host or the creator of the transaction", async () => {
    // Given that we create a user, host, collective, tier,
    // paymentMethod, an order and a transaction
    const { transaction } = await setupTestObjects();

    // And a newly created user
    const anotherUser = await models.User.createUserWithCollective(utils.data('user2'));

    // When a refunded attempt happens from another user
    const result = await utils.graphqlQuery(refundQuery, { id: transaction.id }, anotherUser);

    // Then it should error out with the right error
    const [{ message }] = result.errors;
    expect(message).to.equal('Not a site admin or host collective admin');
  });

  describe('Save CreatedByUserId', () => {
    let userStub;
    beforeEach(() => {
      userStub = sinon.stub(models.User.prototype, 'isRoot').callsFake(() => true);
    });
    afterEach(() => userStub.restore());

    beforeEach(() => initStripeNock({ amount: -5000, fee: 0, fee_details: [], net: -5000 }));

    afterEach(nock.cleanAll);

    it('should save the ID of the user that refunded the transaction in CreatedByUserId', async () => {
      // Given that we create a user, host, collective, tier,
      // paymentMethod, an order and a transaction
      const { user, transaction } = await setupTestObjects();

      // And a newly created user that's also a site admin
      const anotherUser = await models.User.createUserWithCollective(utils.data('user3'));

      // When a refunded attempt happens from the above user
      const result = await utils.graphqlQuery(refundQuery, { id: transaction.id }, anotherUser);

      // Then there should be no errors
      if (result.errors) {
        throw result.errors;
      }

      // And then all the transactions with that same order id are
      // retrieved.
      const [tr1, tr2, tr3, tr4] = await models.Transaction.findAll({
        where: { OrderId: transaction.OrderId },
      });

      // And then the first two transactions (related to the order)
      // should be owned by the user created in setupTestObjects()
      expect(tr1.CreatedByUserId).to.equal(user.id);
      expect(tr2.CreatedByUserId).to.equal(user.id);

      // And then the two refund transactions should be owned by the
      // user that refunded the first transactions
      expect(tr3.CreatedByUserId).to.equal(anotherUser.id);
      expect(tr4.CreatedByUserId).to.equal(anotherUser.id);
    });
  }); /* describe("Save CreatedByUserId") */

  /* Stripe will fully refund the processing fee for accounts created
   * prior to 09/17/17. The refunded fee can be seen in the balance
   * transaction call right after a refund.  The nock output isn't
   * complete but we really don't use the other fields retrieved from
   * Stripe. */
  describe('Stripe Transaction - for hosts created before September 17th 2017', () => {
    let userStub;
    beforeEach(() => {
      userStub = sinon.stub(models.User.prototype, 'isRoot').callsFake(() => true);
    });
    afterEach(() => userStub.restore());

    beforeEach(() =>
      initStripeNock({
        amount: -5000,
        fee: -175,
        fee_details: [{ amount: -175, type: 'stripe_fee' }],
        net: -4825,
      }),
    );

    afterEach(nock.cleanAll);

    it('should create negative transactions with all the fees refunded', async () => {
      // Given that we create a user, host, collective, tier,
      // paymentMethod, an order and a transaction
      const { user, collective, host, transaction } = await setupTestObjects();

      // When the above transaction is refunded
      const result = await utils.graphqlQuery(refundQuery, { id: transaction.id }, host);

      // Then there should be no errors
      if (result.errors) {
        throw result.errors;
      }

      // And then all the transactions with that same order id are
      // retrieved.
      const allTransactions = await models.Transaction.findAll({
        where: { OrderId: transaction.OrderId },
      });

      // And two new transactions should be created in the
      // database.  This only makes sense in an empty database. For
      // order with subscriptions we'd probably find more than 4
      expect(allTransactions.length).to.equal(4);

      // And then the transaction created for the refund operation
      // should decrement all the fees in the CREDIT from collective
      // to user.
      const [tr1, tr2, tr3, tr4] = allTransactions;

      // 1. User Ledger
      expect(tr1.type).to.equal('DEBIT');
      expect(tr1.FromCollectiveId).to.equal(collective.id);
      expect(tr1.CollectiveId).to.equal(user.CollectiveId);
      expect(tr1.amount).to.equal(-4075);
      expect(tr1.amountInHostCurrency).to.equal(-4075);
      expect(tr1.platformFeeInHostCurrency).to.equal(-250);
      expect(tr1.hostFeeInHostCurrency).to.equal(-500);
      expect(tr1.paymentProcessorFeeInHostCurrency).to.equal(-175);
      expect(tr1.netAmountInCollectiveCurrency).to.equal(-5000);
      expect(tr1.RefundTransactionId).to.equal(tr4.id);

      // 2. Collective Ledger
      expect(tr2.type).to.equal('CREDIT');
      expect(tr2.FromCollectiveId).to.equal(user.CollectiveId);
      expect(tr2.CollectiveId).to.equal(collective.id);
      expect(tr2.amount).to.equal(5000);
      expect(tr2.amountInHostCurrency).to.equal(5000);
      expect(tr2.platformFeeInHostCurrency).to.equal(-250);
      expect(tr2.hostFeeInHostCurrency).to.equal(-500);
      expect(tr2.paymentProcessorFeeInHostCurrency).to.equal(-175);
      expect(tr2.netAmountInCollectiveCurrency).to.equal(4075);
      expect(tr2.RefundTransactionId).to.equal(tr3.id);

      // 3. Refund Collective Ledger
      expect(tr3.type).to.equal('DEBIT');
      expect(tr3.FromCollectiveId).to.equal(user.CollectiveId);
      expect(tr3.CollectiveId).to.equal(collective.id);
      expect(tr3.platformFeeInHostCurrency).to.equal(250);
      expect(tr3.hostFeeInHostCurrency).to.equal(500);
      expect(tr3.paymentProcessorFeeInHostCurrency).to.equal(175);
      expect(tr3.amount).to.equal(-5000);
      expect(tr3.amountInHostCurrency).to.equal(-5000);
      expect(tr3.netAmountInCollectiveCurrency).to.equal(-4075);
      expect(tr3.RefundTransactionId).to.equal(tr2.id);

      // 4. Refund User Ledger
      expect(tr4.type).to.equal('CREDIT');
      expect(tr4.FromCollectiveId).to.equal(collective.id);
      expect(tr4.CollectiveId).to.equal(user.CollectiveId);
      expect(tr4.platformFeeInHostCurrency).to.equal(250);
      expect(tr4.hostFeeInHostCurrency).to.equal(500);
      expect(tr4.paymentProcessorFeeInHostCurrency).to.equal(175);
      expect(tr4.netAmountInCollectiveCurrency).to.equal(5000);
      expect(tr4.amount).to.equal(4075);
      expect(tr4.amountInHostCurrency).to.equal(4075);
      expect(tr4.RefundTransactionId).to.equal(tr1.id);
    });
  }); /* describe("Stripe Transaction - for hosts created before September 17th 2017") */

  /* Stripe will not refund the processing fee for accounts created
   * after 09/17/17. The refunded fee will not appear in the balance
   * transaction call right after a refund.  The nock output isn't
   * complete but we really don't use the other fields retrieved from
   * Stripe. */
  describe('Stripe Transaction - for hosts created after September 17th 2017', () => {
    let userStub;
    beforeEach(() => {
      userStub = sinon.stub(models.User.prototype, 'isRoot').callsFake(() => true);
    });
    afterEach(() => userStub.restore());

    beforeEach(() => initStripeNock({ amount: -5000, fee: 0, fee_details: [], net: -5000 }));

    afterEach(nock.cleanAll);

    it('should create negative transactions without the stripe fee being refunded', async () => {
      // Given that we create a user, host, collective, tier,
      // paymentMethod, an order and a transaction
      const { user, collective, host, transaction } = await setupTestObjects();

      // When the above transaction is refunded
      const result = await utils.graphqlQuery(refundQuery, { id: transaction.id }, host);

      // Then there should be no errors
      if (result.errors) {
        throw result.errors;
      }

      // And then the returned value should match the transaction
      // passed to the mutation
      expect(result.data.refundTransaction.id).to.equal(transaction.id);

      // And then all the transactions with that same order id are
      // retrieved.
      const allTransactions = await models.Transaction.findAll({
        where: { OrderId: transaction.OrderId },
      });

      // And two new transactions should be created in the
      // database.  This only makes sense in an empty database. For
      // order with subscriptions we'd probably find more than 4
      expect(allTransactions.length).to.equal(4);

      // And then the transaction created for the refund operation
      // should decrement all the fees in the CREDIT from collective
      // to user.
      const [tr1, tr2, tr3, tr4] = allTransactions;

      // 1. User Ledger
      expect(tr1.type).to.equal('DEBIT');
      expect(tr1.FromCollectiveId).to.equal(collective.id);
      expect(tr1.CollectiveId).to.equal(user.CollectiveId);
      expect(tr1.amount).to.equal(-4075);
      expect(tr1.amountInHostCurrency).to.equal(-4075);
      expect(tr1.platformFeeInHostCurrency).to.equal(-250);
      expect(tr1.hostFeeInHostCurrency).to.equal(-500);
      expect(tr1.paymentProcessorFeeInHostCurrency).to.equal(-175);
      expect(tr1.netAmountInCollectiveCurrency).to.equal(-5000);
      expect(tr1.RefundTransactionId).to.equal(tr4.id);

      // 2. Collective Ledger
      expect(tr2.type).to.equal('CREDIT');
      expect(tr2.FromCollectiveId).to.equal(user.CollectiveId);
      expect(tr2.CollectiveId).to.equal(collective.id);
      expect(tr2.amount).to.equal(5000);
      expect(tr2.amountInHostCurrency).to.equal(5000);
      expect(tr2.platformFeeInHostCurrency).to.equal(-250);
      expect(tr2.hostFeeInHostCurrency).to.equal(-500);
      expect(tr2.paymentProcessorFeeInHostCurrency).to.equal(-175);
      expect(tr2.netAmountInCollectiveCurrency).to.equal(4075);
      expect(tr2.RefundTransactionId).to.equal(tr3.id);

      // 3. Refund Collective Ledger
      expect(tr3.type).to.equal('DEBIT');
      expect(tr3.FromCollectiveId).to.equal(user.CollectiveId);
      expect(tr3.CollectiveId).to.equal(collective.id);
      expect(tr3.platformFeeInHostCurrency).to.equal(250);
      // This is the part that we're saying that the host is paying
      // the refund. The `paymentProcessorFeeInHostCurrency` set to
      // zero and its value was added to the `hostFeeInHostCurrency`
      expect(tr3.hostFeeInHostCurrency).to.equal(500 + 175); // 675
      expect(tr3.paymentProcessorFeeInHostCurrency).to.equal(0);
      expect(tr3.amount).to.equal(-5000);
      expect(tr3.amountInHostCurrency).to.equal(-5000);
      expect(tr3.netAmountInCollectiveCurrency).to.equal(-4075);
      expect(tr3.RefundTransactionId).to.equal(tr2.id);

      // 4. Refund User Ledger
      expect(tr4.type).to.equal('CREDIT');
      expect(tr4.FromCollectiveId).to.equal(collective.id);
      expect(tr4.CollectiveId).to.equal(user.CollectiveId);
      expect(tr4.platformFeeInHostCurrency).to.equal(250);
      // This is the part that we're saying that the host is paying
      // the refund. The `paymentProcessorFeeInHostCurrency` set to
      // zero and its value was added to the `hostFeeInHostCurrency`
      expect(tr4.hostFeeInHostCurrency).to.equal(500 + 175); // 675
      expect(tr4.paymentProcessorFeeInHostCurrency).to.equal(0);
      expect(tr4.amount).to.equal(4075);
      expect(tr4.amountInHostCurrency).to.equal(4075);
      expect(tr4.netAmountInCollectiveCurrency).to.equal(5000);
      expect(tr4.RefundTransactionId).to.equal(tr1.id);
    });
  }); /* describe("Stripe Transaction - for hosts created after September 17th 2017") */
}); /* describe("Refund Transaction") */
