import { get } from 'lodash';
import models, { Op, sequelize } from '../models';
import errors from '../lib/errors';
import { TransactionTypes } from '../constants/transactions';
import { getFxRate } from '../lib/currency';
import { exportToCSV } from '../lib/utils';
import { toNegative } from '../lib/math';

const ledgerTransactionCategories = Object.freeze({
  PLATFORM: 'Platform Fee',
  PAYMENT_PROVIDER: 'Payment Provider Fee',
  WALLET_PROVIDER: 'Wallet Provider Fee',
  ACCOUNT: 'Account to Account',
  CURRENCY_CONVERSION: 'Currency Conversion',
});

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
  if (options.limit) query.limit = options.limit;
  if (options.include) query.include = options.include;
  return models.Transaction.findAll(query);
}

export async function createFromPaidExpense(
  host,
  paymentMethod,
  expense,
  paymentResponses,
  preapprovalDetails,
  UserId,
  paymentProcessorFeeInHostCurrency = 0,
  hostFeeInHostCurrency = 0,
  platformFeeInHostCurrency = 0,
) {
  const hostCurrency = host.currency;
  let createPaymentResponse, executePaymentResponse;
  let paymentProcessorFeeInCollectiveCurrency = 0;
  let hostCurrencyFxRate = 1;

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

      default:
        throw new errors.ServerError(
          `controllers.expenses.pay: Unknown error while trying to create transaction for expense ${
            expense.id
          }. The full response was: ${JSON.stringify(executePaymentResponse)}`,
        );
    }

    const senderFees = createPaymentResponse.defaultFundingPlan.senderFees;
    paymentProcessorFeeInCollectiveCurrency = senderFees.amount * 100; // paypal sends this in float

    const currencyConversion = createPaymentResponse.defaultFundingPlan.currencyConversion || { exchangeRate: 1 };
    hostCurrencyFxRate = 1 / parseFloat(currencyConversion.exchangeRate); // paypal returns a float from host.currency to expense.currency
    paymentProcessorFeeInHostCurrency = Math.round(hostCurrencyFxRate * paymentProcessorFeeInCollectiveCurrency);
  } else {
    // If manual (add funds or manual reimbursement of an expense)
    hostCurrencyFxRate = await getFxRate(expense.currency, host.currency, expense.incurredAt || expense.createdAt);
    paymentProcessorFeeInCollectiveCurrency = Math.round((1 / hostCurrencyFxRate) * paymentProcessorFeeInHostCurrency);
  }

  // We assume that all expenses are in Collective currency
  // (otherwise, ledger breaks with a triple currency conversion)
  const transaction = {
    netAmountInCollectiveCurrency: -1 * (expense.amount + paymentProcessorFeeInCollectiveCurrency),
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
  };

  transaction.hostCurrencyFxRate = hostCurrencyFxRate;
  transaction.amountInHostCurrency = -Math.round(hostCurrencyFxRate * expense.amount); // amountInHostCurrency is an INTEGER (in cents)
  const user = await models.User.findById(UserId);
  transaction.FromCollectiveId = user.CollectiveId;
  return models.Transaction.createDoubleEntry(transaction);
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
    type: TransactionTypes.DEBIT,
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

/**
 * Gets "ledger"(from the ledger service) transactions and format them
 * to the api transactions
 * @param {Number} legacyId - corresponding id from the opencollective-api Transactions table
 * @param {Array} transactions - array of transactions representing one "legacy" transaction
 * @param {Object} legacyInformation - extra information from corresponding legacy transaction
 * @return {Object} returns a transaction with a similar format of the model Transaction
 */
export function parseLedgerTransactionToApiFormat(legacyId, transactions, legacyInformation) {
  const { AccountId, legacyUuid, VirtualCardCollectiveId, HostCollectiveId, RefundTransactionId } = legacyInformation;
  const creditTransaction = transactions.filter(t => {
    return (
      (t.category === ledgerTransactionCategories.ACCOUNT ||
        t.category === `REFUND: ${ledgerTransactionCategories.ACCOUNT}`) &&
      t.type === 'CREDIT'
    );
  });
  // setting up type, From and to accounts
  const FromAccountId = parseInt(creditTransaction[0].FromAccountId);
  const ToAccountId = parseInt(creditTransaction[0].ToAccountId);
  const type = AccountId === FromAccountId ? 'DEBIT' : 'CREDIT';
  // finding fees, accounts and currency conversion transactions
  // separately
  const platformFeeTransaction = transactions.filter(t => {
    return (
      (t.category === ledgerTransactionCategories.PLATFORM ||
        t.category === `REFUND: ${ledgerTransactionCategories.PLATFORM}`) &&
      t.type === 'DEBIT'
    );
  });
  const paymentFeeTransaction = transactions.filter(t => {
    return (
      (t.category === ledgerTransactionCategories.PAYMENT_PROVIDER ||
        t.category === `REFUND: ${ledgerTransactionCategories.PAYMENT_PROVIDER}`) &&
      t.type === 'DEBIT'
    );
  });
  const hostFeeTransaction = transactions.filter(t => {
    return (
      (t.category === ledgerTransactionCategories.WALLET_PROVIDER ||
        t.category === `REFUND: ${ledgerTransactionCategories.WALLET_PROVIDER}`) &&
      t.type === 'DEBIT'
    );
  });
  const accountTransaction =
    type === 'CREDIT'
      ? creditTransaction
      : transactions.filter(t => {
          return (
            (t.category === ledgerTransactionCategories.ACCOUNT ||
              t.category === `REFUND: ${ledgerTransactionCategories.ACCOUNT}`) &&
            t.type === type
          );
        });
  // setting up currency and amount information
  const hostFeeInHostCurrency = hostFeeTransaction.length > 0 ? hostFeeTransaction[0].amount : 0;
  const platformFeeInHostCurrency = platformFeeTransaction.length > 0 ? platformFeeTransaction[0].amount : 0;
  const paymentProcessorFeeInHostCurrency = paymentFeeTransaction.length > 0 ? paymentFeeTransaction[0].amount : 0;
  let amount = accountTransaction[0].amount;
  let netAmountInCollectiveCurrency =
    amount + hostFeeInHostCurrency + platformFeeInHostCurrency + paymentProcessorFeeInHostCurrency;
  // if type is DEBIT, amount and netAmount are calculated differently
  if (type === 'DEBIT') {
    amount = amount - hostFeeInHostCurrency - platformFeeInHostCurrency - paymentProcessorFeeInHostCurrency;
    netAmountInCollectiveCurrency = accountTransaction[0].amount;
  }
  const currency = accountTransaction[0].forexRateSourceCoin;
  const hostCurrency = accountTransaction[0].forexRateDestinationCoin;
  const forexRate = accountTransaction[0].forexRate;

  const parsedTransaction = {
    id: legacyId,
    type,
    amount,
    currency,
    HostCollectiveId,
    hostCurrency,
    hostFeeInHostCurrency,
    platformFeeInHostCurrency,
    paymentProcessorFeeInHostCurrency,
    hostCurrencyFxRate: forexRate,
    netAmountInCollectiveCurrency: parseInt(netAmountInCollectiveCurrency),
    fromCollective: { id: type === 'DEBIT' ? ToAccountId : FromAccountId },
    collective: { id: type === 'DEBIT' ? FromAccountId : ToAccountId },
    description: accountTransaction[0].description,
    createdAt: accountTransaction[0].createdAt,
    updatedAt: accountTransaction[0].updatedAt,
    uuid: legacyUuid,
    UsingVirtualCardFromCollectiveId: VirtualCardCollectiveId,
    // createdByUser: { type: UserType },
    // privateMessage: { type: GraphQLString },
  };
  // setting refund transaction
  if (RefundTransactionId) {
    parsedTransaction.refundTransaction = {
      id: RefundTransactionId,
    };
  }
  // setting paymentMethod
  if (get(creditTransaction[0], 'fromWallet.PaymentMethodId')) {
    parsedTransaction.paymentMethod = {
      id: parseInt(get(creditTransaction[0], 'fromWallet.PaymentMethodId')),
    };
  }
  return parsedTransaction;
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
  if (tr.type === 'CREDIT' && tr.amount <= 0) return 'amount <= 0';
  if (tr.type === 'DEBIT' && tr.amount >= 0) return 'amount >= 0';
  if (tr.type === 'CREDIT' && tr.netAmountInCollectiveCurrency <= 0) return 'netAmount <= 0';
  if (tr.type === 'DEBIT' && tr.netAmountInCollectiveCurrency >= 0) return 'netAmount >= 0';
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
  const result = await models.Transaction.find({ attributes, where });
  return result.dataValues.total;
}
