import * as constants from '../constants';
import {type} from '../constants/transactions';
import models from '../models';
import errors from '../lib/errors';
import { getFxRate } from '../lib/currency';
import { exportToCSV } from '../lib/utils';
import Promise from 'bluebird';

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
      CollectiveId: { $in: collectiveids },
      createdAt: { $gte: startDate, $lt: endDate }
    },
    order: [ ['createdAt', 'DESC' ]]
  };
  if (options.limit) query.limit = options.limit;
  if (options.include) query.include = options.include.map(model => models[model]);
  return models.Transaction.findAll(query);
}

export function createFromPaidExpense(host, paymentMethod, expense, paymentResponses, preapprovalDetails, UserId) {
  const hostCurrency = host.currency;
  let createPaymentResponse, executePaymentResponse;
  let fxrate;
  let paymentProcessorFeeInCollectiveCurrency = 0;
  let paymentProcessorFeeInHostCurrency = 0;
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
        throw new errors.ServerError(`controllers.expenses.pay: Unknown error while trying to create transaction for expense ${expense.id}`);
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
    paymentProcessorFeeInHostCurrency,
    ExpenseId: expense.id,
    type: type.EXPENSE,
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
    .then(transaction => models.Transaction.createDoubleEntry(transaction))
    .then(t => createPaidExpenseActivity(t, paymentResponses, preapprovalDetails));
}

function createPaidExpenseActivity(transaction, paymentResponses, preapprovalDetails) {
  const payload = {
    type: constants.activities.COLLECTIVE_EXPENSE_PAID,
    UserId: transaction.CreatedByUserId,
    CollectiveId: transaction.CollectiveId,
    TransactionId: transaction.id,
    data: {
      transaction: transaction.info
    }
  };
  if (paymentResponses) {
    payload.data.paymentResponses = paymentResponses;
  }
  if (preapprovalDetails) {
    payload.data.preapprovalDetails = preapprovalDetails;
  }
  return transaction.getUser()
    .tap(user => payload.data.user = user.minimal)
    .then(() => transaction.getCollective())
    .tap(collective => payload.data.collective = collective.minimal)
    .then(() => models.Activity.create(payload));
}
