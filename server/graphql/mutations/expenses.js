import errors from '../../lib/errors';
import roles from '../../constants/roles';
import statuses from '../../constants/expense_status';
import models from '../../models';
import paymentProviders from '../../paymentProviders';
import { formatCurrency } from '../../lib/utils';
import paypalAdaptive from '../../paymentProviders/paypal/adaptiveGateway';
import { createFromPaidExpense as createTransactionFromPaidExpense } from '../../lib/transactions';

/**
 * Only admin of expense.collective or of expense.collective.host can approve/reject expenses
 */
function canUpdateExpenseStatus(remoteUser, expense) {
  if (remoteUser.hasRole([roles.HOST, roles.ADMIN], expense.CollectiveId)) {
    return true;
  }
  if (remoteUser.hasRole([roles.HOST, roles.ADMIN], expense.collective.HostCollectiveId)) {
    return true;
  }
  return false;
}

/**
 * Only the author or an admin of the collective or collective.host can edit an expense when it hasn't been paid yet
 */
function canEditExpense(remoteUser, expense) {
  if (expense.status === statuses.PAID) return false;
  if (remoteUser.id === expense.UserId) {
    return true;
  }
  return canUpdateExpenseStatus(remoteUser, expense);
}

export async function updateExpenseStatus(remoteUser, expenseId, status) {
  if (!remoteUser) {
    throw new errors.Unauthorized("You need to be logged in to update the status of an expense");
  }

  const expense = await models.Expense.findById(expenseId, { include: [ { model: models.Collective, as: 'collective' } ] });

  if (!expense) {
    throw new errors.Unauthorized("Expense not found");
  }

  if (!canUpdateExpenseStatus(remoteUser, expense)) {
    throw new errors.Unauthorized("You don't have permission to approve this expense");
  }

  const res = await expense.update({ status });
  return res;
}

export async function createExpense(remoteUser, expenseData) {
  if (!expenseData.collective || !expenseData.collective.id) {
    throw new errors.Unauthorized("Missing expense.collective.id");
  }

  if (remoteUser) {
    expenseData.UserId = remoteUser.id;
  } else {
    if (!expenseData.user || !expenseData.user.email) {
      throw new errors.Unauthorized("Missing expense.user.email");
    }
    const user = await models.User.findOrCreateByEmail(expenseData.user.email, expenseData.user);
    expenseData.UserId = user.id;
  }

  const collective = await models.Collective.findById(expenseData.collective.id);

  if (expenseData.currency && expenseData.currency !== collective.currency) {
    throw new errors.ValidationFailed(`The currency of the expense (${expenseData.currency}) needs to be the same as the currency of the collective (${expenseData.collective.currency})`);
  }

  if (!collective) {
    throw new errors.ValidationFailed("Collective not found");
  }

  if (expenseData.currency && expenseData.currency !== collective.currency) {
    throw new errors.ValidationFailed(`The currency of the expense (${expenseData.currency}) needs to be the same as the currency of the collective (${collective.currency})`);
  }

  const expense = await models.Expense.create({
    ...expenseData,
    status: statuses.PENDING,
    CollectiveId: collective.id,
    lastEditedById: expenseData.UserId,
    incurredAt: expenseData.incurredAt || new Date
  });

  return expense;
}

export async function editExpense(remoteUser, expenseData) {
  if (!remoteUser) {
    throw new errors.Unauthorized("You need to be logged in to edit an expense");
  }

  const expense = await models.Expense.findById(expenseData.id, { include: [ { model: models.Collective, as: 'collective' } ] });

  if (!expense) {
    throw new errors.Unauthorized("Expense not found");
  }

  if (!canEditExpense(remoteUser, expense)) {
    throw new errors.Unauthorized("You don't have permission to edit this expense");
  }

  if (expenseData.currency && expenseData.currency !== expense.collective.currency) {
    throw new errors.ValidationFailed(`The currency of the expense (${expenseData.currency}) needs to be the same as the currency of the collective (${expense.collective.currency})`);
  }

  // When updating amount, attachment or payoutMethod, we reset its status to PENDING
  if (expenseData.amount !== expense.amount
    || expenseData.payoutMethod !== expense.payoutMethod
    || expenseData.attachment !== expense.attachment) {

    expenseData.status = statuses.PENDING;
  }

  const res = await expense.update(expenseData);
  return res;
}

export async function deleteExpense(remoteUser, expenseId) {
  if (!remoteUser) {
    throw new errors.Unauthorized("You need to be logged in to delete an expense");
  }

  const expense = await models.Expense.findById(expenseId, { include: [ { model: models.Collective, as: 'collective' } ] });

  if (!expense) {
    throw new errors.Unauthorized("Expense not found");
  }

  if (!canEditExpense(remoteUser, expense)) {
    throw new errors.Unauthorized("You don't have permission to delete this expense");
  }

  const res = await expense.destroy();
  return res;
}

export async function payExpense(remoteUser, expenseId) {
  if (!remoteUser) {
    throw new errors.Unauthorized("You need to be logged in to pay an expense");
  }

  const expense = await models.Expense.findById(expenseId, { include: [ { model: models.Collective, as: 'collective' } ] });

  if (!expense) {
    throw new errors.Unauthorized("Expense not found");
  }

  if (expense.status === statuses.PAID) {
    throw new errors.Unauthorized("Expense has already been paid");
  }
  
  if (expense.status !== statuses.APPROVED) {
    throw new errors.Unauthorized(`Expense needs to be approved. Current status of the expense: ${expense.status}.`);
  }

  if (!canUpdateExpenseStatus(remoteUser, expense)) {
    throw new errors.Unauthorized("You don't have permission to pay this expense");
  }

  const balance = await expense.collective.getBalance();

  if (expense.amount > balance) {
    throw new errors.Unauthorized(`You don't have enough funds to pay this expense. Current balance: ${formatCurrency(balance, expense.collective.currency)}, Expense amount: ${formatCurrency(expense.amount, expense.collective.currency)}`);
  }

  const host = await expense.collective.getHostCollective();

  const paymentProcessFees = paymentProviders[expense.payoutMethod] ? await paymentProviders[expense.payoutMethod].types['adaptive'].fees({
    amount: expense.amount,
    currency: expense.collective.currency,
    host
  }) : 0;
  if ((expense.amount + paymentProcessFees) > balance) {
    throw new Error(`You don't have enough funds to cover for the fees of this payment method. Current balance: ${formatCurrency(balance, expense.collective.currency)}, Expense amount: ${formatCurrency(expense.amount, expense.collective.currency)}, Estimated ${expense.payoutMethod} fees: ${formatCurrency(paymentProcessFees, expense.collective.currency)}`);
  }

  if (expense.payoutMethod === 'paypal') {
    const paypalEmail = await expense.getPaypalEmail();
    const paymentMethod = await host.getPaymentMethod({ service: expense.payoutMethod });

    try {
      const paymentResponse = await paymentProviders[expense.payoutMethod].types['adaptive'].pay(expense.collective, expense, paypalEmail, paymentMethod.token);
      const preapprovalDetailsResponse = await paypalAdaptive.preapprovalDetails(paymentMethod.token);
      await createTransactionFromPaidExpense(host, paymentMethod, expense, paymentResponse, preapprovalDetailsResponse, expense.UserId);
      expense.setPaid(remoteUser.id);
    } catch (err) {
      if (err.message.indexOf('The total amount of all payments exceeds the maximum total amount for all payments') !==-1) {
        return new errors.BadRequest(`Not enough funds in your existing Paypal preapproval. Please refill your PayPal payment balance.`);
      } else {
        return new errors.BadRequest(err.message)
      }
    }
  }

  // note: we need to check for manual and other for legacy reasons
  if (expense.payoutMethod === 'manual' || expense.payoutMethod === 'other') {
    await createTransactionFromPaidExpense(host, null, expense, null, null, expense.UserId);
  }

  const updatedExpense = await expense.update({ status: statuses.PAID });
  return updatedExpense;
}