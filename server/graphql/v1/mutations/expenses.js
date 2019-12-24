import { get, omit } from 'lodash';
import errors from '../../../lib/errors';
import roles from '../../../constants/roles';
import statuses from '../../../constants/expense_status';
import activities from '../../../constants/activities';
import models from '../../../models';
import paymentProviders from '../../../paymentProviders';
import * as libPayments from '../../../lib/payments';
import { formatCurrency } from '../../../lib/utils';
import { createFromPaidExpense as createTransactionFromPaidExpense } from '../../../lib/transactions';
import { getFxRate } from '../../../lib/currency';
import debugLib from 'debug';
import { canUseFeature } from '../../../lib/user-permissions';
import FEATURE from '../../../constants/feature';
import { FeatureNotAllowedForUser } from '../../errors';

const debug = debugLib('expenses');

/**
 * Only admin of expense.collective or of expense.collective.host can approve/reject expenses
 */
function canUpdateExpenseStatus(remoteUser, expense) {
  if (remoteUser.hasRole([roles.ADMIN], expense.CollectiveId)) {
    return true;
  }
  if (remoteUser.hasRole([roles.ADMIN], expense.collective.HostCollectiveId)) {
    return true;
  }
  return false;
}

/**
 * Only admin of expense.collective.host can mark expenses unpaid
 */
function canMarkExpenseUnpaid(remoteUser, expense) {
  if (remoteUser.hasRole([roles.ADMIN], expense.collective.HostCollectiveId)) {
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
    throw new errors.Unauthorized('You need to be logged in to update the status of an expense');
  } else if (!canUseFeature(remoteUser, FEATURE.EXPENSES)) {
    throw new FeatureNotAllowedForUser();
  }

  if (Object.keys(statuses).indexOf(status) === -1) {
    throw new errors.ValidationFailed('Invalid status, status must be one of ', Object.keys(statuses).join(', '));
  }

  const expense = await models.Expense.findByPk(expenseId, {
    include: [{ model: models.Collective, as: 'collective' }],
  });

  if (!expense) {
    throw new errors.Unauthorized('Expense not found');
  }

  if (!canUpdateExpenseStatus(remoteUser, expense)) {
    throw new errors.Unauthorized("You don't have permission to approve this expense");
  }
  switch (status) {
    case statuses.APPROVED:
      if (expense.status === statuses.PAID) {
        throw new errors.Unauthorized("You can't approve an expense that is already paid");
      }
      break;
    case statuses.REJECTED:
      if (expense.status === statuses.PAID) {
        throw new errors.Unauthorized("You can't reject an expense that is already paid");
      }
      break;
    case statuses.PAID:
      if (expense.status !== statuses.APPROVED) {
        throw new errors.Unauthorized('The expense must be approved before you can set it to paid');
      }
      break;
  }
  const res = await expense.update({ status, lastEditedById: remoteUser.id });
  return res;
}

export async function createExpense(remoteUser, expenseData) {
  if (!remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to create an expense');
  } else if (!canUseFeature(remoteUser, FEATURE.EXPENSES)) {
    throw new FeatureNotAllowedForUser();
  }

  if (!get(expenseData, 'collective.id')) {
    throw new errors.Unauthorized('Missing expense.collective.id');
  }

  // Update remoteUser's paypal email if it has changed
  if (get(expenseData, 'user.paypalEmail') !== remoteUser.paypalEmail) {
    remoteUser.paypalEmail = get(expenseData, 'user.paypalEmail');
    remoteUser.save();
  }
  expenseData.UserId = remoteUser.id;

  const collective = await models.Collective.findByPk(expenseData.collective.id);

  if (expenseData.currency && expenseData.currency !== collective.currency) {
    throw new errors.ValidationFailed(
      `The currency of the expense (${expenseData.currency}) needs to be the same as the currency of the collective (${expenseData.collective.currency})`,
    );
  }

  if (!collective) {
    throw new errors.ValidationFailed('Collective not found');
  }

  if (expenseData.currency && expenseData.currency !== collective.currency) {
    throw new errors.ValidationFailed(
      `The currency of the expense (${expenseData.currency}) needs to be the same as the currency of the collective (${collective.currency})`,
    );
  }

  const expense = await models.Expense.create({
    ...expenseData,
    status: statuses.PENDING,
    CollectiveId: collective.id,
    lastEditedById: expenseData.UserId,
    incurredAt: expenseData.incurredAt || new Date(),
  });

  collective.addUserWithRole(remoteUser, roles.CONTRIBUTOR).catch(e => {
    if (e.name === 'SequelizeUniqueConstraintError') {
      console.log('User ', remoteUser.id, 'is already a contributor');
    } else {
      console.error(e);
    }
  });

  expense.user = remoteUser;
  expense.collective = collective;
  await expense.createActivity(activities.COLLECTIVE_EXPENSE_CREATED);
  return expense;
}

export async function editExpense(remoteUser, expenseData) {
  if (!remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to edit an expense');
  } else if (!canUseFeature(remoteUser, FEATURE.EXPENSES)) {
    throw new FeatureNotAllowedForUser();
  }

  const expense = await models.Expense.findByPk(expenseData.id, {
    include: [{ model: models.Collective, as: 'collective' }],
  });

  if (!expense) {
    throw new errors.Unauthorized('Expense not found');
  }

  if (!canEditExpense(remoteUser, expense)) {
    throw new errors.Unauthorized("You don't have permission to edit this expense");
  }

  if (expenseData.currency && expenseData.currency !== expense.collective.currency) {
    throw new errors.ValidationFailed(
      `The currency of the expense (${expenseData.currency}) needs to be the same as the currency of the collective (${expense.collective.currency})`,
    );
  }

  // When updating amount, attachment or payoutMethod, we reset its status to PENDING
  if (
    expenseData.amount !== expense.amount ||
    expenseData.payoutMethod !== expense.payoutMethod ||
    expenseData.attachment !== expense.attachment
  ) {
    expenseData.status = statuses.PENDING;
  } else {
    // make sure that we don't override the status of the expense.
    delete expenseData.status;
  }

  expenseData.lastEditedById = remoteUser.id;
  await expense.update(expenseData);
  expense.createActivity(activities.COLLECTIVE_EXPENSE_UPDATED);
  return expense;
}

export async function deleteExpense(remoteUser, expenseId) {
  if (!remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to delete an expense');
  } else if (!canUseFeature(remoteUser, FEATURE.EXPENSES)) {
    throw new FeatureNotAllowedForUser();
  }

  const expense = await models.Expense.findByPk(expenseId, {
    include: [{ model: models.Collective, as: 'collective' }],
  });

  if (!expense) {
    throw new errors.NotFound('Expense not found');
  }

  if (!canEditExpense(remoteUser, expense)) {
    throw new errors.Unauthorized("You don't have permission to delete this expense");
  }

  if (expense.status !== statuses.REJECTED) {
    throw new errors.Unauthorized('Only rejected expense can be deleted');
  }

  const res = await expense.destroy();
  return res;
}

/** Helper that finishes the process of paying an expense */
async function markExpenseAsPaid(expense) {
  debug('update expense status to PAID', expense.id);
  const updatedExpense = await expense.update({ status: statuses.PAID });
  await expense.createActivity(activities.COLLECTIVE_EXPENSE_PAID);
  return updatedExpense;
}

async function createTransactions(host, expense, fees = {}) {
  debug('marking expense as paid and creating transactions in the ledger', expense.id);
  return await createTransactionFromPaidExpense(
    host,
    null,
    expense,
    null,
    expense.UserId,
    fees.paymentProcessorFeeInHostCurrency,
    fees.hostFeeInHostCurrency,
    fees.platformFeeInHostCurrency,
  );
}

async function payExpenseWithPayPal(remoteUser, expense, host, paymentMethod, fees = {}) {
  debug('payExpenseWithPayPal', expense.id);
  try {
    const paymentResponse = await paymentProviders[expense.payoutMethod].types['adaptive'].pay(
      expense.collective,
      expense,
      expense.paypalEmail,
      paymentMethod.token,
    );
    await createTransactionFromPaidExpense(
      host,
      paymentMethod,
      expense,
      paymentResponse,
      expense.UserId,
      fees.paymentProcessorFeeInHostCurrency,
      fees.hostFeeInHostCurrency,
      fees.platformFeeInHostCurrency,
    );
    expense.setPaid(remoteUser.id);
    await paymentMethod.updateBalance();
  } catch (err) {
    debug('paypal> error', JSON.stringify(err, null, '  '));
    if (
      err.message.indexOf('The total amount of all payments exceeds the maximum total amount for all payments') !== -1
    ) {
      throw new errors.BadRequest(
        'Not enough funds in your existing Paypal preapproval. Please refill your PayPal payment balance.',
      );
    } else {
      throw new errors.BadRequest(err.message);
    }
  }
}

/**
 * Pay an expense based on the payout method defined in the Expense object
 * @PRE: fees { id, paymentProcessorFeeInCollectiveCurrency, hostFeeInCollectiveCurrency, platformFeeInCollectiveCurrency }
 * Note: some payout methods like PayPal will automatically define `paymentProcessorFeeInCollectiveCurrency`
 */
export async function payExpense(remoteUser, args) {
  const expenseId = args.id;
  const fees = omit(args, ['id', 'forceManual']);

  if (!remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to pay an expense');
  } else if (!canUseFeature(remoteUser, FEATURE.EXPENSES)) {
    throw new FeatureNotAllowedForUser();
  }
  const expense = await models.Expense.findByPk(expenseId, {
    include: [{ model: models.Collective, as: 'collective' }],
  });
  if (!expense) {
    throw new errors.Unauthorized('Expense not found');
  }
  if (expense.status === statuses.PAID) {
    throw new errors.Unauthorized('Expense has already been paid');
  }
  if (expense.status !== statuses.APPROVED) {
    throw new errors.Unauthorized(`Expense needs to be approved. Current status of the expense: ${expense.status}.`);
  }
  if (!remoteUser.isAdmin(expense.collective.HostCollectiveId)) {
    throw new errors.Unauthorized("You don't have permission to pay this expense");
  }
  const host = await expense.collective.getHostCollective();

  if (expense.payoutMethod === 'donation') {
    throw new Error('"In kind" donations are not supported anymore');
  }

  const balance = await expense.collective.getBalance();

  if (expense.amount > balance) {
    throw new errors.Unauthorized(
      `You don't have enough funds to pay this expense. Current balance: ${formatCurrency(
        balance,
        expense.collective.currency,
      )}, Expense amount: ${formatCurrency(expense.amount, expense.collective.currency)}`,
    );
  }

  const fxrate = await getFxRate(expense.collective.currency, host.currency);
  const feesInHostCurrency = {};
  if (expense.payoutMethod === 'paypal' && !args.forceManual) {
    fees.paymentProcessorFeeInCollectiveCurrency = await paymentProviders[expense.payoutMethod].types['adaptive'].fees({
      amount: expense.amount,
      currency: expense.collective.currency,
      host,
    });
  }

  feesInHostCurrency.paymentProcessorFeeInHostCurrency = Math.round(
    fxrate * (fees.paymentProcessorFeeInCollectiveCurrency || 0),
  );
  feesInHostCurrency.hostFeeInHostCurrency = Math.round(fxrate * (fees.hostFeeInCollectiveCurrency || 0));
  feesInHostCurrency.platformFeeInHostCurrency = Math.round(fxrate * (fees.platformFeeInCollectiveCurrency || 0));

  if (!fees.paymentProcessorFeeInCollectiveCurrency) {
    fees.paymentProcessorFeeInCollectiveCurrency = 0;
  }

  if (expense.amount + fees.paymentProcessorFeeInCollectiveCurrency > balance) {
    throw new Error(
      `You don't have enough funds to cover for the fees of this payment method. Current balance: ${formatCurrency(
        balance,
        expense.collective.currency,
      )}, Expense amount: ${formatCurrency(expense.amount, expense.collective.currency)}, Estimated ${
        expense.payoutMethod
      } fees: ${formatCurrency(fees.paymentProcessorFeeInCollectiveCurrency, expense.collective.currency)}`,
    );
  }
  if (expense.payoutMethod === 'paypal') {
    expense.paypalEmail = await expense.getPaypalEmail();
    const paymentMethod = await host.getPaymentMethod({
      service: expense.payoutMethod,
    });
    // If the expense has been filed with the same paypal email than the host paypal
    // then we simply mark the expense as paid
    if (expense.paypalEmail === paymentMethod.name) {
      feesInHostCurrency.paymentProcessorFeeInHostCurrency = 0;
      await createTransactions(host, expense, feesInHostCurrency);
    } else if (args.forceManual) {
      await createTransactions(host, expense, feesInHostCurrency);
    } else {
      await payExpenseWithPayPal(remoteUser, expense, host, paymentMethod, feesInHostCurrency);
    }
  }

  // note: we need to check for manual and other for legacy reasons
  if (expense.payoutMethod === 'manual' || expense.payoutMethod === 'other') {
    await createTransactions(host, expense, feesInHostCurrency);
  }

  return markExpenseAsPaid(expense);
}

export async function markExpenseAsUnpaid(remoteUser, ExpenseId, processorFeeRefunded) {
  if (!remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to unpay an expense');
  } else if (!canUseFeature(remoteUser, FEATURE.EXPENSES)) {
    throw new FeatureNotAllowedForUser();
  }

  const expense = await models.Expense.findByPk(ExpenseId, {
    include: [
      { model: models.Collective, as: 'collective' },
      { model: models.User, as: 'User' },
    ],
  });

  if (!expense) {
    throw new errors.NotFound('No expense found');
  }

  if (!canMarkExpenseUnpaid(remoteUser, expense)) {
    throw new errors.Unauthorized("You don't have permission to mark this expense as unpaid");
  }

  if (expense.status !== statuses.PAID) {
    throw new errors.Unauthorized('Expense has not been paid yet');
  }

  if (expense.payoutMethod !== 'other') {
    throw new errors.Unauthorized('Only expenses with "other" payout method can be marked as unpaid');
  }

  const transaction = await models.Transaction.findOne({
    where: { ExpenseId },
    include: [{ model: models.Expense }],
  });

  const paymentProcessorFeeInHostCurrency = processorFeeRefunded ? transaction.paymentProcessorFeeInHostCurrency : 0;
  const refundedTransaction = await libPayments.createRefundTransaction(
    transaction,
    paymentProcessorFeeInHostCurrency,
    null,
    expense.User,
  );
  await libPayments.associateTransactionRefundId(transaction, refundedTransaction);

  return expense.update({ status: statuses.APPROVED, lastEditedById: remoteUser.id });
}
