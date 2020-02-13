import models, { Op, sequelize } from '../models';
import { PayoutMethodTypes } from '../models/PayoutMethod';
import errors from '../lib/errors';
import { TransactionTypes } from '../constants/transactions';
import { getFxRate } from '../lib/currency';
import { exportToCSV } from '../lib/utils';
import { toNegative } from '../lib/math';

/**
 * Export transactions as CSV
 * @param {*} transactions
 */
export function exportTransactions(transactions, attributes) {
  attributes = attributes || [
    'id',
    'createdAt',
    'amount',
    'currency',
    'description',
    'netAmountInCollectiveCurrency',
    'hostCurrency',
    'hostCurrencyFxRate',
    'paymentProcessorFeeInHostCurrency',
    'hostFeeInHostCurrency',
    'platformFeeInHostCurrency',
    'netAmountInHostCurrency',
  ];

  return exportToCSV(transactions, attributes);
}

/**
 * Get transactions between startDate and endDate for collectiveids
 * @param {*} collectiveids
 * @param {*} startDate
 * @param {*} endDate
 * @param {*} limit
 */
export function getTransactions(collectiveids, startDate = new Date('2015-01-01'), endDate = new Date(), options) {
  const where = options.where || {};
  const query = {
    where: {
      ...where,
      CollectiveId: { [Op.in]: collectiveids },
      createdAt: { [Op.gte]: startDate, [Op.lt]: endDate },
    },
    order: [['createdAt', 'DESC']],
  };
  if (options.limit) {
    query.limit = options.limit;
  }
  if (options.include) {
    query.include = options.include;
  }
  return models.Transaction.findAll(query);
}

export async function createFromPaidExpense(
  host,
  paymentMethod,
  expense,
  paymentResponses,
  UserId,
  paymentProcessorFeeInHostCurrency = 0,
  hostFeeInHostCurrency = 0,
  platformFeeInHostCurrency = 0,
  transactionData,
) {
  const hostCurrency = host.currency;
  let createPaymentResponse, executePaymentResponse;
  let paymentProcessorFeeInCollectiveCurrency = 0,
    hostFeeInCollectiveCurrency = 0,
    platformFeeInCollectiveCurrency = 0;
  let hostCurrencyFxRate = 1;
  const payoutMethod = await expense.getPayoutMethod();
  const payoutMethodType = payoutMethod ? payoutMethod.type : expense.getPayoutMethodTypeFromLegacy();

  // If PayPal
  if (paymentResponses) {
    createPaymentResponse = paymentResponses.createPaymentResponse;
    executePaymentResponse = paymentResponses.executePaymentResponse;

    switch (executePaymentResponse.paymentExecStatus) {
      case 'COMPLETED':
        break;

      case 'CREATED':
        /*
         * When we don't provide a preapprovalKey (paymentMethod.token) to payServices['paypal'](),
         * it creates a payKey that we can use to redirect the user to PayPal.com to manually approve that payment
         * TODO We should handle that case on the frontend
         */
        throw new errors.BadRequest(
          `Please approve this payment manually on ${createPaymentResponse.paymentApprovalUrl}`,
        );

      case 'ERROR':
        throw new errors.ServerError(
          `Error while paying the expense with PayPal: "${executePaymentResponse.payErrorList[0].error.message}". Please contact support@opencollective.com`,
        );

      default:
        throw new errors.ServerError(
          `Error while paying the expense with PayPal. Please contact support@opencollective.com`,
        );
    }

    const senderFees = createPaymentResponse.defaultFundingPlan.senderFees;
    paymentProcessorFeeInCollectiveCurrency = senderFees.amount * 100; // paypal sends this in float

    const currencyConversion = createPaymentResponse.defaultFundingPlan.currencyConversion || { exchangeRate: 1 };
    hostCurrencyFxRate = 1 / parseFloat(currencyConversion.exchangeRate); // paypal returns a float from host.currency to expense.currency
    paymentProcessorFeeInHostCurrency = Math.round(hostCurrencyFxRate * paymentProcessorFeeInCollectiveCurrency);
  } else if (payoutMethodType === PayoutMethodTypes.BANK_ACCOUNT) {
    // Notice this is the FX rate between Host and Collective, the user is not involved here and that's why TransferWise quote rate is irrelavant here.
    hostCurrencyFxRate = await getFxRate(expense.currency, host.currency);
    paymentProcessorFeeInHostCurrency = Math.round(transactionData.quote.fee * 100);
    paymentProcessorFeeInCollectiveCurrency = Math.round((1 / hostCurrencyFxRate) * paymentProcessorFeeInHostCurrency);
    hostFeeInCollectiveCurrency = Math.round((1 / hostCurrencyFxRate) * hostFeeInHostCurrency);
    platformFeeInCollectiveCurrency = Math.round((1 / hostCurrencyFxRate) * platformFeeInHostCurrency);
  } else {
    // If manual (add funds or manual reimbursement of an expense)
    hostCurrencyFxRate = await getFxRate(expense.currency, host.currency, expense.incurredAt || expense.createdAt);
    paymentProcessorFeeInCollectiveCurrency = Math.round((1 / hostCurrencyFxRate) * paymentProcessorFeeInHostCurrency);
    hostFeeInCollectiveCurrency = Math.round((1 / hostCurrencyFxRate) * hostFeeInHostCurrency);
    platformFeeInCollectiveCurrency = Math.round((1 / hostCurrencyFxRate) * platformFeeInHostCurrency);
  }

  // We assume that all expenses are in Collective currency
  // (otherwise, ledger breaks with a triple currency conversion)
  const transaction = {
    netAmountInCollectiveCurrency:
      -1 *
      (expense.amount +
        paymentProcessorFeeInCollectiveCurrency +
        hostFeeInCollectiveCurrency +
        platformFeeInCollectiveCurrency),
    hostCurrency,
    paymentProcessorFeeInHostCurrency: toNegative(paymentProcessorFeeInHostCurrency),
    hostFeeInHostCurrency: toNegative(hostFeeInHostCurrency),
    platformFeeInHostCurrency: toNegative(platformFeeInHostCurrency),
    ExpenseId: expense.id,
    type: TransactionTypes.DEBIT,
    amount: -expense.amount,
    currency: expense.currency,
    description: expense.description,
    CreatedByUserId: UserId,
    CollectiveId: expense.CollectiveId,
    HostCollectiveId: host.id,
    PaymentMethodId: paymentMethod ? paymentMethod.id : null,
    data: transactionData,
  };

  transaction.hostCurrencyFxRate = hostCurrencyFxRate;
  transaction.amountInHostCurrency = -Math.round(hostCurrencyFxRate * expense.amount); // amountInHostCurrency is an INTEGER (in cents)
  const user = await models.User.findByPk(UserId);
  transaction.FromCollectiveId = user.CollectiveId;
  return models.Transaction.createDoubleEntry(transaction);
}

/**
 * Calculate net amount of a transaction in the currency of the collective
 * Notes:
 * - fees are negative numbers
 * - netAmountInCollectiveCurrency * hostCurrencyFxRate = amountInHostCurrency
 *   Therefore, amountInHostCurrency / hostCurrencyFxRate= netAmountInCollectiveCurrency
 */
export function netAmount(tr) {
  const fees = tr.hostFeeInHostCurrency + tr.platformFeeInHostCurrency + tr.paymentProcessorFeeInHostCurrency || 0;
  return Math.round((tr.amountInHostCurrency + fees) / tr.hostCurrencyFxRate);
}

/**
 * Verify net amount of a transaction
 */
export function verify(tr) {
  if (tr.type === 'CREDIT' && tr.amount <= 0) {
    return 'amount <= 0';
  }
  if (tr.type === 'DEBIT' && tr.amount >= 0) {
    return 'amount >= 0';
  }
  if (tr.type === 'CREDIT' && tr.netAmountInCollectiveCurrency <= 0) {
    return 'netAmount <= 0';
  }
  if (tr.type === 'DEBIT' && tr.netAmountInCollectiveCurrency >= 0) {
    return 'netAmount >= 0';
  }
  const diff = Math.abs(netAmount(tr) - tr.netAmountInCollectiveCurrency);
  // if the difference is within one cent, it's most likely a rounding error (because of the number of decimals in the hostCurrencyFxRate)
  if (diff > 0 && diff < 10) {
    return 'netAmount diff';
  }
  return true;
}

/** Calculate how off a transaction is
 *
 * Which is pretty much the difference between transaction net amount
 * & netAmountInCollectiveCurrency */
export function difference(tr) {
  return netAmount(tr) - tr.netAmountInCollectiveCurrency;
}

/** Returnt he sum of transaction rows that match search.
 *
 * @param {Object} where is an object that contains all the fields
 *  that you want to use to narrow down the search against the
 *  transactions table. For example, if you want to sum up the
 *  donations of a user to a specific collective, use the following:
 * @example
 *  > const babel = await models.Collectives.findOne({ slug: 'babel' });
 *  > libransactions.sum({ FromCollectiveId: userCollective.id, CollectiveId: babel.id })
 * @return the sum of the column `amount`.
 */
export async function sum(where) {
  const totalAttr = sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('netAmountInCollectiveCurrency')), 0);
  const attributes = [[totalAttr, 'total']];
  const result = await models.Transaction.findOne({ attributes, where });
  return result.dataValues.total;
}
