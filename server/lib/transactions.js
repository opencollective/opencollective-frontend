import * as constants from '../constants';
import {type} from '../constants/transactions';
import models from '../models';
import errors from '../lib/errors';

const expenseType = type.EXPENSE;

export function createFromPaidExpense(paymentMethod, expense, paymentResponse, preapprovalDetails, UserId) {
  if (paymentResponse) {
    switch (paymentResponse.paymentExecStatus) {
      case 'COMPLETED':
        break;

      case 'CREATED':
        /*
         * When we don't provide a preapprovalKey (paymentMethod.token) to payServices['paypal'](),
         * it creates a payKey that we can use to redirect the user to PayPal.com to manually approve that payment
         * TODO We should handle that case on the frontend
         */
        throw new errors.BadRequest(`Please approve this payment manually on ${paymentResponse.paymentApprovalUrl}`);

      default:
        throw new errors.ServerError(`controllers.expenses.pay: Unknown error while trying to create transaction for expense ${expense.id}`);
    }
  }

  return models.Transaction.create({
    // TODO expense currency might be different from group currency, how to convert?
    netAmountInGroupCurrency: -expense.amount,
    ExpenseId: expense.id,
    // TODO remove #postmigration, info redundant with joined tables?
    type: expenseType,
    amount: -expense.amount/100,
    currency: expense.currency,
    description: expense.title,
    UserId,
    GroupId: expense.GroupId,
    // end TODO remove #postmigration
  })
  .tap(t => paymentMethod ? t.setPaymentMethod(paymentMethod) : null)
  .then(t => createPaidExpenseActivity(t, paymentResponse, preapprovalDetails));
}

function createPaidExpenseActivity(transaction, paymentResponse, preapprovalDetails) {
  const payload = {
    type: constants.activities.GROUP_EXPENSE_PAID,
    UserId: transaction.UserId,
    GroupId: transaction.GroupId,
    TransactionId: transaction.id,
    data: {
      transaction: transaction.info
    }
  };
  if (paymentResponse) {
    payload.data.paymentResponse = paymentResponse;
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
