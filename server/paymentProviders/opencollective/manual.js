import { get, pick } from 'lodash';
import models from '../../models';
import { TransactionTypes } from '../../constants/transactions';
import { maxInteger } from '../../constants/math';
import { createRefundTransaction, associateTransactionRefundId } from '../../lib/payments';

/**
 * Manual Payment method
 * This payment method enables a host to manually receive donations (e.g. by wire directly to the host's bank account)
 * The order's status will be set to PENDING and will have to be updated manually by the host
 */

/** Get the balance
 * Since we don't have a way to check the balance of the donor, we return Infinity
 * note: since GraphQL doesn't like Infinity, we use maxInteger
 */
async function getBalance() {
  return maxInteger;
}

/** Process an order with a manual payment method
 *
 * @param {models.Order} order The order instance to be processed.
 * @return {models.Transaction} the double entry generated transactions.
 */
async function processOrder(order) {
  // gets the Credit transaction generated
  const payload = pick(order, ['CreatedByUserId', 'FromCollectiveId', 'CollectiveId', 'PaymentMethodId']);
  const host = await order.collective.getHostCollective();

  if (host.currency !== order.currency) {
    throw Error(
      `Cannot manually record a transaction in a different currency than the currency of the host ${host.currency}`,
    );
  }

  const hostFeePercent = get(order, 'data.hostFeePercent', order.collective.hostFeePercent);
  const hostFeeInHostCurrency = -Math.round((hostFeePercent / 100) * order.totalAmount);
  const platformFeeInHostCurrency = 0;
  const paymentProcessorFeeInHostCurrency = 0;

  payload.transaction = {
    type: TransactionTypes.CREDIT,
    OrderId: order.id,
    amount: order.totalAmount,
    currency: order.currency,
    hostCurrency: host.currency,
    hostCurrencyFxRate: 1,
    netAmountInCollectiveCurrency: order.totalAmount - hostFeeInHostCurrency - platformFeeInHostCurrency,
    amountInHostCurrency: order.totalAmount,
    hostFeeInHostCurrency,
    platformFeeInHostCurrency,
    paymentProcessorFeeInHostCurrency,
    taxAmount: order.taxAmount,
    description: order.description,
  };

  const creditTransaction = await models.Transaction.createFromPayload(payload);
  return creditTransaction;
}

/**
 * Refund a given transaction by creating the opposing transaction.
 * There's nothing more to do because it's up to the host/collective to see how
 * they want to actually refund the money.
 */
const refundTransaction = async (transaction, user) => {
  const refundTransaction = await createRefundTransaction(transaction, 0, null, user);
  return associateTransactionRefundId(transaction, refundTransaction);
};

/* Expected API of a Payment Method Type */
export default {
  features: {
    recurring: false,
    waitToCharge: true, // don't process the order automatically. Wait for host to "mark it as paid"
  },
  getBalance,
  processOrder,
  refundTransaction,
};
