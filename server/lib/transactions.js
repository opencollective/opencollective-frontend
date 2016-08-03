const constants = require('../constants');

const expenseType = require('../constants/transactions').type.EXPENSE;

module.exports = app => {

  const errors = app.errors;
  const models = app.set('models');

  function createFromPaidExpense(payoutMethod, paymentMethod, expense, paymentResponse, preapprovalDetails, UserId) {
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
      status: 'REIMBURSED',
      reimbursedAt: new Date(),
      UserId,
      GroupId: expense.GroupId,
      payoutMethod
      // end TODO remove #postmigration
    })
    .tap(t => paymentMethod ? t.setPaymentMethod(paymentMethod) : null)
    .then(t => createNewTransactionActivity(t, paymentResponse, preapprovalDetails));
  }

  function createNewTransactionActivity(transaction, paymentResponse, preapprovalDetails) {
    const payload = {
      type: constants.activities.GROUP_TRANSACTION_PAID,
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
      .tap(user => payload.data.user = user.info)
      .then(() => transaction.getGroup())
      .tap(group => payload.data.group = group.info)
      .then(() => models.Activity.create(payload));
  }

  return {
    createFromPaidExpense
  };
};
