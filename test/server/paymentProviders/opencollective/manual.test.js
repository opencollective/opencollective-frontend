import { expect } from 'chai';

import models from '../../../../server/models';
import ManualPaymentMethod from '../../../../server/paymentProviders/opencollective/manual';
import * as store from '../../../stores';

describe('server/paymentProviders/opencollective/manual', () => {
  const hostFeePercent = 5;

  let user, host, collective;

  /** Create a test PENDING order from `user` to `collective` */
  const createOrder = async (amount = 5000) => {
    const order = await models.Order.create({
      CreatedByUserId: user.id,
      FromCollectiveId: user.CollectiveId,
      CollectiveId: collective.id,
      totalAmount: amount,
      currency: 'USD',
      status: 'PENDING',
    });

    // Bind some required properties
    order.collective = collective;
    order.fromCollective = user.collective;
    order.createByUser = user;
    return order;
  };

  // ---- Setup host, collective and user

  before('Create Host (USD)', async () => {
    host = await models.Collective.create({ name: 'Host 1', currency: 'USD', isActive: true, hostFeePercent });
  });

  before('Create collective', async () => {
    collective = await models.Collective.create({
      name: 'collective1',
      currency: 'USD',
      HostCollectiveId: host.id,
      isActive: true,
      hostFeePercent,
    });
  });

  before('Create User', async () => {
    user = await models.User.createUserWithCollective({ email: store.randEmail(), name: 'User 1' });
  });

  // ---- Test features ----

  describe('Features', () => {
    it("Doesn't support recurring", () => expect(ManualPaymentMethod.features.recurring).to.be.false);
    it("Doesn't charge automatically", () => expect(ManualPaymentMethod.features.waitToCharge).to.be.true);
  });

  // ---- Test processOrder ----

  describe('processOrder', () => {
    it('Returns the CREDIT transaction', async () => {
      const amount = 5000;
      const order = await createOrder(amount);
      const transaction = await ManualPaymentMethod.processOrder(order);

      expect(transaction.type).to.equal('CREDIT');
      expect(transaction.currency).to.equal('USD');
      expect(transaction.hostCurrency).to.equal('USD');
      expect(transaction.OrderId).to.equal(order.id);
      expect(transaction.amount).to.equal(amount);
      expect(transaction.amountInHostCurrency).to.equal(amount);
      expect(transaction.hostFeeInHostCurrency).to.equal(-250);
      expect(transaction.platformFeeInHostCurrency).to.equal(0); // We take no fee on manual transactions
      expect(transaction.paymentProcessorFeeInHostCurrency).to.equal(0); // We take no fee on manual transactions
      expect(transaction.netAmountInCollectiveCurrency).to.equal(4750);
      expect(transaction.HostCollectiveId).to.equal(host.id);
      expect(transaction.CreatedByUserId).to.equal(user.id);
      expect(transaction.FromCollectiveId).to.equal(user.collective.id);
      expect(transaction.CollectiveId).to.equal(collective.id);
      expect(transaction.PaymentMethodId).to.be.null;
    });

    it('Is not fooled by floating issues', async () => {
      // (hostFeePercent = 5 / 100) * 28 = 1.4000000000000001
      const amount = 28;
      const order = await createOrder(amount);
      const transaction = await ManualPaymentMethod.processOrder(order);
      expect(transaction.amountInHostCurrency).to.equal(amount);
      expect(transaction.hostFeeInHostCurrency).to.equal(-1);
    });
  });

  // ---- refundTransaction ----
  describe('refundTransaction', () => {
    it('Create opposite transactions', async () => {
      const amount = 5000;
      const order = await createOrder(amount);
      const transaction = await ManualPaymentMethod.processOrder(order);

      // Check that the original transaction is correctly updated
      const updatedTransaction = await ManualPaymentMethod.refundTransaction(transaction, user);
      expect(updatedTransaction.RefundTransactionId).to.not.be.null;

      // Check the refund transaction
      const refundTransaction = await models.Transaction.findByPk(updatedTransaction.RefundTransactionId);
      expect(refundTransaction.type).to.equal('DEBIT');
      expect(refundTransaction.currency).to.equal('USD');
      expect(refundTransaction.hostCurrency).to.equal('USD');
      expect(refundTransaction.OrderId).to.equal(order.id);
      expect(refundTransaction.amount).to.equal(-amount);
      expect(refundTransaction.amountInHostCurrency).to.equal(-amount);
      expect(refundTransaction.hostFeeInHostCurrency).to.equal(250);
      expect(refundTransaction.platformFeeInHostCurrency).to.equal(0); // We take no fee on manual refundTransactions
      expect(refundTransaction.paymentProcessorFeeInHostCurrency).to.equal(0); // We take no fee on manual refundTransactions
      expect(refundTransaction.netAmountInCollectiveCurrency).to.equal(-4750);
      expect(refundTransaction.HostCollectiveId).to.equal(host.id);
      expect(refundTransaction.CreatedByUserId).to.equal(user.id);
      expect(refundTransaction.FromCollectiveId).to.equal(user.collective.id);
      expect(refundTransaction.CollectiveId).to.equal(collective.id);
      expect(refundTransaction.PaymentMethodId).to.be.null;
    });
  });
});
