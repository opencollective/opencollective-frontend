import models from '../../models';
import * as libpayments from '../../lib/payments';
import * as libtransactions from '../../lib/transactions';
import { get } from 'lodash';

/**
 * Virtual Card Payment method - This payment Method works basically as an alias
 * to other Payment method(field "SourcePaymentMethodId") that will create transactions
 * and then the payment methods of those transactions will be replaced by
 * the virtual card payment method that first processed the order.
*/

/** Get the balance of a virtual card card
 * @param {models.PaymentMethod} paymentMethod is the instance of the
 *  virtual card payment method.
 * @return {Object} with amount & currency from the payment method.
 */
async function getBalance(paymentMethod) {
  if (!libpayments.isProvider('opencollective.virtual', paymentMethod)) {
    throw new Error(`Expected opencollective.virtual but got ${paymentMethod.service}.${paymentMethod.type}`);
  }
  /* Result will be negative (We're looking for DEBIT transactions) */
  const spent = await libtransactions.sum({
    PaymentMethodId: paymentMethod.id,
    currency: paymentMethod.currency,
    type: 'DEBIT',
  });
  return {
    amount: paymentMethod.initialBalance + spent,
    currency: paymentMethod.currency,
  };
}

/** Process a virtual card order
 *
 * @param {models.Order} order The order instance to be processed.
 * @return {models.Transaction} the double entry generated transactions.
 */
async function processOrder(order) {
  const user = order.createdByUser;
  const { paymentMethod: { data } } = order;

  // check if payment Method has expired
  if (!paymentMethod.expiryDate || paymentMethod.expiryDate < new Date())
    throw new Error('Payment method has already expired');
  // Making sure the SourcePaymentMethodId is Set(requirement for virtual cards)
  if (!get(paymentMethod, 'SourcePaymentMethodId'))
    throw new Error('Virtual Card payment method must have a value a "SourcePaymentMethodId" defined');

  // finding Source Payment method and processing order
  const sourcePaymentMethod = await models.PaymentMethod.findById(paymentMethod.SourcePaymentMethodId);
  const transactions = await sourcePaymentMethod.processOrder(order);
  // Updating already created transactions to use the Virtual Payment Method id instead
  const updatedPaymentMethodTransactions = await Promise.map(fileNames, function(fileName) {
      await transaction.update({ PaymentMethodId: order.paymentMethod.id });  
      return transaction;
  });
  return updatedPaymentMethodTransactions;
}

/* Expected API of a Payment Method Type */
export default {
  features: {
    recurring: true,
    waitToCharge: false
  },
  getBalance,
  processOrder,
};
