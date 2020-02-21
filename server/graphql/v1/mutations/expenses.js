import { get, omit, pick, flatten } from 'lodash';
import errors from '../../../lib/errors';
import roles from '../../../constants/roles';
import expenseType from '../../../constants/expense_type';
import statuses from '../../../constants/expense_status';
import activities from '../../../constants/activities';
import models, { sequelize } from '../../../models';
import paymentProviders from '../../../paymentProviders';
import * as libPayments from '../../../lib/payments';
import { formatCurrency } from '../../../lib/utils';
import { floatAmountToCents } from '../../../lib/math';
import { createFromPaidExpense as createTransactionFromPaidExpense } from '../../../lib/transactions';
import { getFxRate } from '../../../lib/currency';
import debugLib from 'debug';
import { canUseFeature } from '../../../lib/user-permissions';
import FEATURE from '../../../constants/feature';
import { FeatureNotAllowedForUser, ValidationFailed } from '../../errors';
import { PayoutMethodTypes } from '../../../models/PayoutMethod';
import { types as collectiveTypes } from '../../../constants/collectives';

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
  if (expense.status === statuses.PAID) {
    return false;
  } else if (remoteUser.id === expense.UserId) {
    return true;
  } else if (remoteUser.isAdmin(expense.FromCollectiveId)) {
    return true;
  } else {
    return canUpdateExpenseStatus(remoteUser, expense);
  }
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

/** Compute the total amount of expense from attachments */
const getTotalAmountFromAttachments = attachments => {
  if (!attachments) {
    return 0;
  } else {
    return attachments.reduce((total, attachment) => {
      return total + attachment.amount;
    }, 0);
  }
};

/** Check expense's attachments values, throw if something's wrong */
const checkExpenseAttachments = (expenseData, attachments) => {
  // Check the number of attachments
  if (!attachments || attachments.length === 0) {
    throw new ValidationFailed({ message: 'Your expense needs to have at least one attachment' });
  } else if (attachments.length > 100) {
    throw new ValidationFailed({ message: 'Expenses cannot have more than 100 attachments' });
  }

  // Check amounts
  const sumAttachments = getTotalAmountFromAttachments(attachments);
  if (sumAttachments !== expenseData.amount) {
    throw new ValidationFailed({
      message: `The sum of all attachments must be equal to the total expense's amount. Expense's total is ${expenseData.amount}, but the total of attachments was ${sumAttachments}.`,
    });
  } else if (!sumAttachments) {
    throw new ValidationFailed({
      message: `The sum of all attachments must be above 0`,
    });
  }

  // If expense is a receipt (not an invoice) then files must be attached
  if (expenseData.type === expenseType.RECEIPT) {
    const hasMissingFiles = attachments.some(a => !a.url);
    if (hasMissingFiles) {
      throw new ValidationFailed({
        message: 'Some attachments are missing a file',
      });
    }
  }
};

const EXPENSE_EDITABLE_FIELDS = ['amount', 'description', 'category', 'type', 'privateMessage', 'invoiceInfo'];

const getPaypalPaymentMethodFromExpenseData = async (expenseData, remoteUser, fromCollective, dbTransaction) => {
  if (expenseData.PayoutMethod) {
    if (expenseData.PayoutMethod.id) {
      const pm = await models.PayoutMethod.findByPk(expenseData.PayoutMethod.id);
      if (!pm || !remoteUser.isAdmin(pm.CollectiveId)) {
        throw new Error("This payout method does not exist or you don't have the permission to use it");
      } else if (pm.CollectiveId !== fromCollective.id) {
        throw new Error('This payout method cannot be used for this collective');
      }
      return pm;
    } else {
      return models.PayoutMethod.getOrCreateFromData(
        expenseData.PayoutMethod,
        remoteUser,
        fromCollective,
        dbTransaction,
      );
    }
  } else if (expenseData.payoutMethod === 'paypal') {
    // @deprecated - Should use `PayoutMethod` argument
    if (get(expenseData, 'user.paypalEmail')) {
      return models.PayoutMethod.getOrCreateFromData(
        { type: PayoutMethodTypes.PAYPAL, data: { email: get(expenseData, 'user.paypalEmail') } },
        remoteUser,
        fromCollective,
        dbTransaction,
      );
    } else {
      const paypalPms = await models.PayoutMethod.scope('paypal').findAll({
        where: { CollectiveId: fromCollective.id },
      });
      if (paypalPms.length === 0) {
        throw new ValidationFailed({ message: 'No PayPal payout method configured for this account' });
      } else if (paypalPms.length > 1) {
        // Make sure we're not linking to a wrong PayPal account
        throw new ValidationFailed({
          message: 'Multiple PayPal payout method found for this account. Please select the one you want to use.',
        });
      } else {
        return paypalPms[0];
      }
    }
  } else {
    return null;
  }
};

export async function createExpense(remoteUser, expenseData) {
  if (!remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to create an expense');
  } else if (!canUseFeature(remoteUser, FEATURE.EXPENSES)) {
    throw new FeatureNotAllowedForUser();
  }

  if (!get(expenseData, 'collective.id')) {
    throw new errors.Unauthorized('Missing expense.collective.id');
  }

  let attachmentsData = expenseData.attachments;
  if (expenseData.attachment && expenseData.attachments) {
    throw new ValidationFailed({ message: 'Fields "attachment" and "attachments" are exclusive, please use only one' });
  } else if (expenseData.attachment) {
    // @deprecated Convert legacy attachment param to new format
    attachmentsData = [{ amount: expenseData.amount, url: expenseData.attachment }];
  }

  checkExpenseAttachments(expenseData, attachmentsData);

  const collective = await models.Collective.findByPk(expenseData.collective.id);
  if (!collective) {
    throw new errors.ValidationFailed('Collective not found');
  } else if (![collectiveTypes.COLLECTIVE, collectiveTypes.EVENT].includes(collective.type)) {
    throw new errors.ValidationFailed('Expenses can only be submitted to collectives and events');
  }

  // For now we only add expenses from user's collectives
  const fromCollective = await remoteUser.getCollective();

  const expense = await sequelize.transaction(async t => {
    // Get or create payout method
    const payoutMethod = await getPaypalPaymentMethodFromExpenseData(expenseData, remoteUser, fromCollective, t);

    // Create expense
    const createdExpense = await models.Expense.create(
      {
        ...pick(expenseData, EXPENSE_EDITABLE_FIELDS),
        currency: collective.currency,
        status: statuses.PENDING,
        CollectiveId: collective.id,
        FromCollectiveId: fromCollective.id,
        lastEditedById: remoteUser.id,
        UserId: remoteUser.id,
        incurredAt: expenseData.incurredAt || new Date(),
        PayoutMethodId: payoutMethod && payoutMethod.id,
        legacyPayoutMethod: models.Expense.getLegacyPayoutMethodTypeFromPayoutMethod(payoutMethod),
        amount: expenseData.amount || getTotalAmountFromAttachments(attachmentsData),
      },
      { transaction: t },
    );

    // Create attachments
    createdExpense.attachments = await Promise.all(
      attachmentsData.map(attachmentData => {
        return models.ExpenseAttachment.createFromData(attachmentData, remoteUser, createdExpense, t);
      }),
    );

    return createdExpense;
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

/** Returns true if the expense should by put back to PENDING after this update */
export const changesRequireStatusUpdate = (expense, newExpenseData, hasAttachmentsChanges, hasPayoutChanges) => {
  const updatedValues = { ...expense.dataValues, ...newExpenseData };
  return hasAttachmentsChanges || updatedValues.amount !== expense.amount || hasPayoutChanges;
};

/** Returns infos about the changes made to attachments */
export const getAttachmentsChanges = async (expense, expenseData) => {
  let attachmentsData = expenseData.attachments;
  let attachmentsDiff = [[], [], []];
  let hasAttachmentsChanges = false;
  if (expenseData.attachment && expenseData.attachments) {
    throw new ValidationFailed({ message: 'Fields "attachment" and "attachments" are exclusive, please use only one' });
  } else if (expenseData.attachment) {
    // Convert legacy attachment param to new format
    attachmentsData = [{ amount: expenseData.amount || expense.amount, url: expenseData.attachment }];
  }

  if (attachmentsData) {
    const baseAttachments = await models.ExpenseAttachment.findAll({ where: { ExpenseId: expense.id } });
    attachmentsDiff = models.ExpenseAttachment.diffDBEntries(baseAttachments, attachmentsData);
    hasAttachmentsChanges = flatten(attachmentsDiff).length > 0;
  }

  return [hasAttachmentsChanges, attachmentsData, attachmentsDiff];
};

export async function editExpense(remoteUser, expenseData) {
  if (!remoteUser) {
    throw new errors.Unauthorized('You need to be logged in to edit an expense');
  } else if (!canUseFeature(remoteUser, FEATURE.EXPENSES)) {
    throw new FeatureNotAllowedForUser();
  } else if (expenseData.payoutMethod && expenseData.PayoutMethod) {
    throw new Error('payoutMethod and PayoutMethod are exclusive, please use only one');
  }

  const expense = await models.Expense.findByPk(expenseData.id, {
    include: [
      { model: models.Collective, as: 'collective' },
      { model: models.Collective, as: 'fromCollective' },
      { model: models.PayoutMethod },
    ],
  });

  if (!expense) {
    throw new errors.Unauthorized('Expense not found');
  } else if (!canEditExpense(remoteUser, expense)) {
    throw new errors.Unauthorized("You don't have permission to edit this expense");
  }

  const cleanExpenseData = pick(expenseData, EXPENSE_EDITABLE_FIELDS);
  const fromCollective = expense.fromCollective;
  let payoutMethod = await expense.getPayoutMethod();
  const updatedExpense = await sequelize.transaction(async t => {
    // Update payout method if we get new data from one of the param for it
    if (
      (expenseData.payoutMethod !== undefined && expenseData.payoutMethod !== expense.legacyPayoutMethod) ||
      (expenseData.PayoutMethod !== undefined && expenseData.PayoutMethod.id !== expense.PayoutMethodId)
    ) {
      payoutMethod = await getPaypalPaymentMethodFromExpenseData(expenseData, remoteUser, fromCollective, t);
    }

    // Update attachments
    const [hasAttachmentsChanges, attachmentsData, attachmentsDiff] = await getAttachmentsChanges(expense, expenseData);
    if (hasAttachmentsChanges) {
      checkExpenseAttachments({ ...expense.dataValues, ...cleanExpenseData }, attachmentsData);
      const [newAttachmentsData, oldAttachments, attachmentsToUpdate] = attachmentsDiff;
      await Promise.all([
        // Delete
        ...oldAttachments.map(attachment => {
          return attachment.destroy({ transaction: t });
        }),
        // Create
        ...newAttachmentsData.map(attachmentData => {
          return models.ExpenseAttachment.createFromData(attachmentData, remoteUser, expense, t);
        }),
        // Update
        ...attachmentsToUpdate.map(data => {
          return models.ExpenseAttachment.updateFromData(data, t);
        }),
      ]);
    }

    // Update expense
    // When updating amount, attachment or payoutMethod, we reset its status to PENDING
    const PayoutMethodId = payoutMethod ? payoutMethod.id : null;
    const shouldUpdateStatus = changesRequireStatusUpdate(
      expense,
      expenseData,
      hasAttachmentsChanges,
      PayoutMethodId !== expense.PayoutMethodId,
    );

    return expense.update(
      {
        ...cleanExpenseData,
        lastEditedById: remoteUser.id,
        incurredAt: expenseData.incurredAt || new Date(),
        status: shouldUpdateStatus ? 'PENDING' : expense.status,
        PayoutMethodId: PayoutMethodId,
        legacyPayoutMethod: models.Expense.getLegacyPayoutMethodTypeFromPayoutMethod(payoutMethod),
      },
      { transaction: t },
    );
  });

  updatedExpense.createActivity(activities.COLLECTIVE_EXPENSE_UPDATED);
  return updatedExpense;
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
async function markExpenseAsPaid(expense, userId) {
  debug('update expense status to PAID', expense.id);
  await expense.setPaid(userId);
  await expense.createActivity(activities.COLLECTIVE_EXPENSE_PAID);
  return expense;
}

async function createTransactions(host, expense, fees = {}, data) {
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
    data,
  );
}

async function payExpenseWithPayPal(remoteUser, expense, host, paymentMethod, toPaypalEmail, fees = {}) {
  debug('payExpenseWithPayPal', expense.id);
  try {
    const paymentResponse = await paymentProviders.paypal.types['adaptive'].pay(
      expense.collective,
      expense,
      toPaypalEmail,
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

async function payExpenseWithTransferwise(host, payoutMethod, expense, fees) {
  debug('payExpenseWithTransferwise', expense.id);
  const [connectedAccount] = await host.getConnectedAccounts({
    where: { service: 'transferwise', deletedAt: null },
  });

  if (!connectedAccount) {
    throw new Error('Host is not connected to Transferwise');
  }

  const data = await paymentProviders.transferwise.payExpense(connectedAccount, payoutMethod, expense);
  return createTransactions(host, expense, fees, data);
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
  if (expense.status === statuses.PROCESSING) {
    throw new errors.Unauthorized(
      'Expense is currently being processed, this means someone already started the payment process',
    );
  }
  if (expense.status !== statuses.APPROVED) {
    throw new errors.Unauthorized(`Expense needs to be approved. Current status of the expense: ${expense.status}.`);
  }
  if (!remoteUser.isAdmin(expense.collective.HostCollectiveId)) {
    throw new errors.Unauthorized("You don't have permission to pay this expense");
  }
  const host = await expense.collective.getHostCollective();

  if (expense.legacyPayoutMethod === 'donation') {
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

  const feesInHostCurrency = {};
  const fxrate = await getFxRate(expense.collective.currency, host.currency);
  const payoutMethod = await expense.getPayoutMethod();
  const payoutMethodType = payoutMethod ? payoutMethod.type : expense.getPayoutMethodTypeFromLegacy();

  if (payoutMethodType === PayoutMethodTypes.BANK_ACCOUNT) {
    const [connectedAccount] = await host.getConnectedAccounts({
      where: { service: 'transferwise', deletedAt: null },
    });
    if (!connectedAccount) {
      throw new Error('Host is not connected to Transferwise');
    }
    const quote = await paymentProviders.transferwise.getTemporaryQuote(connectedAccount, payoutMethod, expense);
    // Notice this is the FX rate between Host and Collective, that's why we use `fxrate`.
    fees.paymentProcessorFeeInCollectiveCurrency = floatAmountToCents(quote.fee / fxrate);
  } else if (payoutMethodType === PayoutMethodTypes.PAYPAL && !args.forceManual) {
    fees.paymentProcessorFeeInCollectiveCurrency = await paymentProviders.paypal.types['adaptive'].fees({
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
      )}, Expense amount: ${formatCurrency(
        expense.amount,
        expense.collective.currency,
      )}, Estimated ${payoutMethodType} fees: ${formatCurrency(
        fees.paymentProcessorFeeInCollectiveCurrency,
        expense.collective.currency,
      )}`,
    );
  }

  // Pay expense based on chosen payout method
  if (payoutMethodType === PayoutMethodTypes.PAYPAL) {
    const paypalEmail = payoutMethod.data.email;
    let paypalPaymentMethod = null;
    try {
      paypalPaymentMethod = await host.getPaymentMethod({ service: 'paypal' });
    } catch {
      // ignore missing paypal payment method
    }
    // If the expense has been filed with the same paypal email than the host paypal
    // then we simply mark the expense as paid
    if (paypalPaymentMethod && paypalEmail === paypalPaymentMethod.name) {
      feesInHostCurrency.paymentProcessorFeeInHostCurrency = 0;
      await createTransactions(host, expense, feesInHostCurrency);
    } else if (args.forceManual) {
      await createTransactions(host, expense, feesInHostCurrency);
    } else if (paypalPaymentMethod) {
      await payExpenseWithPayPal(remoteUser, expense, host, paypalPaymentMethod, paypalEmail, feesInHostCurrency);
    } else {
      throw new Error('No Paypal account linked, please reconnect Paypal or pay manually');
    }
  } else if (payoutMethodType === PayoutMethodTypes.BANK_ACCOUNT) {
    await payExpenseWithTransferwise(host, payoutMethod, expense, feesInHostCurrency);
    await expense.setProcessing(remoteUser.id);
    // Early return, we'll only mark as Paid when the transaction completes.
    return;
  } else if (expense.legacyPayoutMethod === 'manual' || expense.legacyPayoutMethod === 'other') {
    // note: we need to check for manual and other for legacy reasons
    await createTransactions(host, expense, feesInHostCurrency);
  }

  return markExpenseAsPaid(expense, remoteUser.id);
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
      { model: models.PayoutMethod },
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

  if (expense.legacyPayoutMethod !== 'other') {
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
