import * as constants from '../constants';
import {type} from '../constants/transactions';
import models from '../models';
import errors from '../lib/errors';
import { getFxRate } from '../lib/currency';

/**
 * Export transactions as CSV
 * @param {*} transactions 
 */
export function exportTransactions(transactions) {
  const attributes = ['id', 'createdAt', 'GroupId', 'amount', 'currency', 'description', 'netAmountInGroupCurrency', 'txnCurrency', 'txnCurrencyFxRate', 'paymentProcessorFeeInTxnCurrency', 'hostFeeInTxnCurrency', 'platformFeeInTxnCurrency', 'netAmountInTxnCurrency' ];
  const lines = [];
  const groupids = transactions.map(t => t.GroupId);

  const getColumnName = (attr) => {
    if (attr === 'GroupId') return 'collective';
    else return attr;
  }

  lines.push(`"${attributes.map(getColumnName).join('","')}"`); // Header
  return models.Group.findAll({ attributes: ['id', 'slug'], where: { id: { $in: groupids }}})
    .then(groups => {
      const groupsById = {};
      groups.map(g => {
        groupsById[g.id] = g.dataValues;
      });
      const getLine = (transaction) => {
        const cols = [];
        attributes.map(attr => {
          let value;
          if (attr === 'GroupId') {
            value = groupsById[transaction[attr]].slug;
          } else {
            value = transaction[attr];
          }
          cols.push(`${value}`.replace(/\"/g,"\""));
        });
        return `"${cols.join('","')}"`;
      }

      transactions.map(t => {
        lines.push(getLine(t));
      })

      return lines.join('\n');
    })
}

export function createFromPaidExpense(host, paymentMethod, expense, paymentResponses, preapprovalDetails, UserId) {
  const txnCurrency = host.currency;
  let createPaymentResponse, executePaymentResponse;
  let fxrate;
  let paymentProcessorFeeInGroupCurrency = 0;
  let paymentProcessorFeeInTxnCurrency = 0;
  let getFxRatePromise;

  // If PayPal
  if (paymentResponses) {

    createPaymentResponse = paymentResponses.createPaymentResponse;
    executePaymentResponse = paymentResponses.executePaymentResponse;

    const currencyConversion = createPaymentResponse.defaultFundingPlan.currencyConversion;
    fxrate = 1 / currencyConversion.exchangeRate; // paypal returns a float from host.currency to expense.currency, need to reverse that
    const senderFees = createPaymentResponse.defaultFundingPlan.senderFees;
    paymentProcessorFeeInGroupCurrency = senderFees.amount * 100; // paypal sends this in float
    paymentProcessorFeeInTxnCurrency = fxrate * paymentProcessorFeeInGroupCurrency;

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

    getFxRatePromise = Promise.resolve(fxrate);
  } else {
    // If manual (add funds or manual reimbursement of an expense)
    getFxRatePromise = getFxRate(expense.currency, host.currency, expense.incurredAt || expense.createdAt);
  }

  // We assume that all expenses are in Group currency
  // (otherwise, ledger breaks with a triple currency conversion)
  const transaction = {
    netAmountInGroupCurrency: -1 * (expense.amount + paymentProcessorFeeInGroupCurrency),
    txnCurrency,
    paymentProcessorFeeInTxnCurrency,
    ExpenseId: expense.id,
    type: type.EXPENSE,
    amount: -expense.amount,
    currency: expense.currency,
    description: expense.title,
    UserId,
    GroupId: expense.GroupId,
    HostId: host.id
  };

  return getFxRatePromise(transaction)
    .then(fxrate => {
      transaction.txnCurrencyFxRate = fxrate;
      transaction.amountInTxnCurrency = -Math.round(fxrate * expense.amount); // amountInTxnCurrency is an INTEGER (in cents)
      return transaction;
    })
    .then(transaction => models.Transaction.create(transaction))
    .tap(t => paymentMethod ? t.setPaymentMethod(paymentMethod) : null)
    .then(t => createPaidExpenseActivity(t, paymentResponses, preapprovalDetails));
}

function createPaidExpenseActivity(transaction, paymentResponses, preapprovalDetails) {
  const payload = {
    type: constants.activities.GROUP_EXPENSE_PAID,
    UserId: transaction.UserId,
    GroupId: transaction.GroupId,
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
    .then(() => transaction.getGroup())
    .tap(group => payload.data.group = group.minimal)
    .then(() => models.Activity.create(payload));
}
