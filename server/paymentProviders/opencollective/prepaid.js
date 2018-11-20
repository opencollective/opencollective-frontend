import models from '../../models';
import * as libpayments from '../../lib/payments';
import * as currency from '../../lib/currency';
import { TransactionTypes, OC_FEE_PERCENT } from '../../constants/transactions';
import { get } from 'lodash';

/** Get the balance of a prepaid credit card
 *
 * When a card is created by a host (by adding funds to an
 * organization for example) the card is created with an initial
 * balance. This function subtracts the amount from transactions made
 * with this card from the initial balance.
 *
 * @param {models.PaymentMethod} paymentMethod is the instance of the
 *  prepaid credit card payment method.
 * @return {Object} with amount & currency from the payment method.
 */
async function getBalance(paymentMethod) {
  if (!libpayments.isProvider('opencollective.prepaid', paymentMethod)) {
    throw new Error(
      `Expected opencollective.prepaid but got ${paymentMethod.service}.${
        paymentMethod.type
      }`,
    );
  }
  /* Result will be negative (We're looking for DEBIT transactions) */
  const allTransactions = await models.Transaction.findAll({
    attributes: ['netAmountInCollectiveCurrency', 'currency'],
    where: {
      PaymentMethodId: paymentMethod.id,
      type: 'DEBIT',
    },
  });
  let spent = 0;
  for (const transaction of allTransactions) {
    if (transaction.currency != paymentMethod.currency) {
      const fxRate = await currency.getFxRate(
        transaction.currency,
        paymentMethod.currency,
      );
      spent += transaction.netAmountInCollectiveCurrency * fxRate;
    } else {
      spent += transaction.netAmountInCollectiveCurrency;
    }
  }
  return {
    amount: Math.round(paymentMethod.initialBalance + spent),
    currency: paymentMethod.currency,
  };
}

/** Process a pre paid card order
 *
 * @param {models.Order} order The order instance to be processed.
 * @return {models.Transaction} As any other payment method, after
 *  processing Giftcard orders, the transaction generated from it is
 *  returned.
 */
async function processOrder(order) {
  const user = order.createdByUser;
  const {
    paymentMethod: { data },
  } = order;
  // Making sure the paymentMethod has the information we need to
  // process a prepaid card
  if (!get(data, 'HostCollectiveId'))
    throw new Error(
      'Prepaid payment method must have a value for `data.HostCollectiveId`',
    );

  // Check that target Collective's Host is same as gift card issuer
  const hostCollective = await order.collective.getHostCollective();
  if (hostCollective.id !== data.HostCollectiveId)
    throw new Error(
      'Prepaid method can only be used in collectives from the same host',
    );

  // Use the above payment method to donate to Collective
  const hostFeeInHostCurrency = libpayments.calcFee(
    order.totalAmount,
    order.collective.hostFeePercent,
  );
  const platformFeeInHostCurrency = libpayments.calcFee(
    order.totalAmount,
    OC_FEE_PERCENT,
  );
  const transactions = await models.Transaction.createFromPayload({
    CreatedByUserId: user.id,
    FromCollectiveId: order.FromCollectiveId,
    CollectiveId: order.CollectiveId,
    PaymentMethodId: order.paymentMethod.id,
    transaction: {
      type: TransactionTypes.CREDIT,
      OrderId: order.id,
      amount: order.totalAmount,
      amountInHostCurrency: order.totalAmount,
      currency: order.currency,
      hostCurrency: order.currency,
      hostCurrencyFxRate: 1,
      hostFeeInHostCurrency,
      platformFeeInHostCurrency,
      paymentProcessorFeeInHostCurrency: 0,
      description: order.description,
    },
  });

  // Mark paymentMethod as confirmed
  order.paymentMethod.update({ confirmedAt: new Date() });

  return transactions;
}

/* Expected API of a Payment Method Type */
export default {
  features: {
    recurring: true,
    waitToCharge: false,
  },
  getBalance,
  processOrder,
};
