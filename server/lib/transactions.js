import Promise from 'bluebird';
import models, { Op, sequelize } from '../models';
import errors from '../lib/errors';
import { type } from '../constants/transactions';
import { getFxRate } from '../lib/currency';
import { exportToCSV } from '../lib/utils';
import { toNegative } from '../lib/math';

/**
 * Export transactions as CSV
 * @param {*} transactions
 */
export function exportTransactions(transactions, attributes) {
  attributes = attributes || ['id', 'createdAt', 'amount', 'currency', 'description', 'netAmountInCollectiveCurrency', 'hostCurrency', 'hostCurrencyFxRate', 'paymentProcessorFeeInHostCurrency', 'hostFeeInHostCurrency', 'platformFeeInHostCurrency', 'netAmountInHostCurrency' ];

  return exportToCSV(transactions, attributes);
}

/**
 * Get transactions between startDate and endDate for collectiveids
 * @param {*} collectiveids
 * @param {*} startDate
 * @param {*} endDate
 * @param {*} limit
 */
export function getTransactions(collectiveids, startDate = new Date("2015-01-01"), endDate = new Date, options) {
  const where = options.where || {};
  const query = {
    where: {
      ...where,
      CollectiveId: { [Op.in]: collectiveids },
      createdAt: { [Op.gte]: startDate, [Op.lt]: endDate }
    },
    order: [ ['createdAt', 'DESC' ]]
  };
  if (options.limit) query.limit = options.limit;
  if (options.include) query.include = options.include;
  return models.Transaction.findAll(query);
}

export function createFromPaidExpense(host, paymentMethod, expense, paymentResponses, preapprovalDetails, UserId, paymentProcessorFeeInHostCurrency = 0) {
  const hostCurrency = host.currency;
  let createPaymentResponse, executePaymentResponse;
  let fxrate;
  let paymentProcessorFeeInCollectiveCurrency = 0;
  let getFxRatePromise;

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
        throw new errors.BadRequest(`Please approve this payment manually on ${createPaymentResponse.paymentApprovalUrl}`);

      default:
        throw new errors.ServerError(`controllers.expenses.pay: Unknown error while trying to create transaction for expense ${expense.id}. The full response was: ${JSON.stringify(executePaymentResponse)}`);
    }

    const senderFees = createPaymentResponse.defaultFundingPlan.senderFees;
    paymentProcessorFeeInCollectiveCurrency = senderFees.amount * 100; // paypal sends this in float

    const currencyConversion = createPaymentResponse.defaultFundingPlan.currencyConversion || { exchangeRate: 1 };
    fxrate = parseFloat(currencyConversion.exchangeRate); // paypal returns a float from host.currency to expense.currency
    paymentProcessorFeeInHostCurrency = 1/fxrate * paymentProcessorFeeInCollectiveCurrency;

    getFxRatePromise = Promise.resolve(fxrate);
  } else {
    // If manual (add funds or manual reimbursement of an expense)
    getFxRatePromise = getFxRate(expense.currency, host.currency, expense.incurredAt || expense.createdAt);
  }

  // We assume that all expenses are in Collective currency
  // (otherwise, ledger breaks with a triple currency conversion)
  const transaction = {
    netAmountInCollectiveCurrency: -1 * (expense.amount + paymentProcessorFeeInCollectiveCurrency),
    hostCurrency,
    paymentProcessorFeeInHostCurrency: toNegative(paymentProcessorFeeInHostCurrency),
    ExpenseId: expense.id,
    type: type.DEBIT,
    amount: -expense.amount,
    currency: expense.currency,
    description: expense.description,
    CreatedByUserId: UserId,
    CollectiveId: expense.CollectiveId,
    HostCollectiveId: host.id,
    PaymentMethodId: paymentMethod ? paymentMethod.id : null
  };

  return getFxRatePromise
    .then(fxrate => {
      if (!isNaN(fxrate)) {
        transaction.hostCurrencyFxRate = fxrate;
        transaction.amountInHostCurrency = -Math.round(fxrate * expense.amount); // amountInHostCurrency is an INTEGER (in cents)
      }
      return transaction;
    })
    .then(() => models.User.findById(UserId))
    .then(user => {
      transaction.FromCollectiveId = user.CollectiveId;
      return transaction;
    })
    .then(transaction => models.Transaction.createDoubleEntry(transaction));
  }

/** Create transaction for donation in kind
 *
 * After paying an expense of the type donation, a transaction is
 * created to subtract the payment from the collective's ledger. This
 * function creates a transaction that acknowledge the contribution
 * from the user and also zeroing out the previous transaction on the
 * collective's ledger.
 *
 * @param {models.Transaction} expenseTransaction is the transaction
 *  created on the collective's ledger.
 */
export async function createTransactionFromInKindDonation(expenseTransaction) {
  return models.Transaction.createDoubleEntry({
    netAmountInCollectiveCurrency: -expenseTransaction.amount,
    amount: -expenseTransaction.amount,
    amountInHostCurrency: -expenseTransaction.amount,
    hostCurrency: expenseTransaction.hostCurrency,
    type: type.DEBIT,
    currency: expenseTransaction.currency,
    description: expenseTransaction.description,
    CreatedByUserId: expenseTransaction.CreatedByUserId,
    CollectiveId: expenseTransaction.CollectiveId,
    FromCollectiveId: expenseTransaction.FromCollectiveId,
    HostCollectiveId: expenseTransaction.HostCollectiveId,
    PaymentMethodId: expenseTransaction.PaymentMethodId,
    paymentProcessorFeeInHostCurrency: expenseTransaction.paymentProcessorFeeInHostCurrency,
    ExpenseId: expenseTransaction.ExpenseId,
  });
}

/** Calculate net amount of a transaction */
export function netAmount(tr) {
  return Math.round((
      tr.amountInHostCurrency +
      tr.hostFeeInHostCurrency +
      tr.platformFeeInHostCurrency +
      tr.paymentProcessorFeeInHostCurrency) * tr.hostCurrencyFxRate);
}

/** Verify net amount of a transaction */
export function verify(tr) {
  if (tr.type === 'CREDIT' && tr.amount <= 0) return 'amount <= 0';
  if (tr.type === 'DEBIT' && tr.amount >= 0) return 'amount >= 0';
  if (tr.type === 'CREDIT' && tr.netAmountInCollectiveCurrency <= 0) return 'netAmount <= 0';
  if (tr.type === 'DEBIT' && tr.netAmountInCollectiveCurrency >= 0) return 'netAmount >= 0';
  if (netAmount(tr) !== tr.netAmountInCollectiveCurrency) return 'netAmount diff';
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
  const attributes = [[ totalAttr, 'total' ]];
  const result = await models.Transaction.find({ attributes, where });
  return result.dataValues.total;
}
