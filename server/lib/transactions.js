import * as constants from '../constants';
import {type} from '../constants/transactions';
import models from '../models';
import errors from '../lib/errors';

const expenseType = type.EXPENSE;

export function createFromPaidExpense(paymentMethod, expense, paymentResponses, preapprovalDetails, UserId) {
  let createPaymentResponse, executePaymentResponse;

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
  }

  const senderFees = createPaymentResponse.defaultFundingPlan.senderFees;

  const txnCurrency = senderFees.code;
  const fees = senderFees.amount*100 // paypal sends this in float


  return models.Transaction.create({
    netAmountInGroupCurrency: -expense.amount + fees,
    amountInTxnCurrency: -expense.amount,
    paymentProcessorFeeInTxnCurrency: fees,
    txnCurrency,
    txnCurrencyFxRate: 1,
    ExpenseId: expense.id,
    type: expenseType,
    amount: -expense.amount,
    currency: expense.currency,
    description: expense.title,
    UserId,
    GroupId: expense.GroupId,
  })
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
