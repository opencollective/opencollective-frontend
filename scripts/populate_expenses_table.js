const app = require('../index');
const config = require('config');
const constants = require('../server/constants/transactions');
const models = app.set('models');

/*
 * tested with:
 *
 * - npm run db:copy:prod
 * - PG_DATABASE=opencollective_prod_snapshot npm run db:migrate:dev
 * - PG_DATABASE=opencollective_prod_snapshot node scripts/populate_expenses_table.js
 */

// Updates a transaction row, given an expense
const updateTransaction = (expense, transaction) => {
  transaction.type = constants.type.EXPENSE;
  transaction.ExpenseId = expense.id;
  return transaction.save();
};

// Creates an Expense row, given a transaction
const createExpense = transaction => {
  console.log("Processing transaction id: ", transaction.id);

  const expense = {
    UserId: transaction.UserId,
    GroupId: transaction.GroupId,
    currency: transaction.currency,
    amount: -transaction.amount*100,
    category: transaction.tags && transaction.tags[0],
    title: transaction.description,
    status: getStatus(transaction),
    payoutMethod: transaction.payoutMethod || 'manual',
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    deletedAt: transaction.deletedAt,
    incurredAt: transaction.createdAt,
    lastEditedById: getLastEditedBy(transaction)
  };

  return models.Expense.create(expense)
    .then(expense => updateTransaction(expense, transaction));
};

function getStatus(tx) {
  if (tx.status === 'REIMBURSED') {
    return 'PAID';
  }
  if (tx.approvedAt && !tx.approved) {
    return 'REJECTED';
  }
  if (tx.approvedAt && tx.approved) {
    return 'APPROVED';
  }
  return 'PENDING';
}

function getLastEditedBy(tx) {
  const status = getStatus(tx);
  switch (status) {
    case 'PENDING':
      return tx.UserId;
    case 'APPROVED':
    case 'REJECTED':
      // this is incorrect but better than nothing (don't know who approved)
      console.warn(`WARN: Defaulting lastEditedById to ${tx.UserId} for expense created from tx ${tx.id}`);
      return tx.UserId;
    case 'PAID':
      if (tx.paidby) {
        return tx.paidby;
      }
      if (tx.PaymentMethod && tx.PaymentMethod.UserId) {
        return tx.PaymentMethod.UserId;
      }
      console.warn(`WARN: Defaulting lastEditedById to ${tx.UserId} for expense created from tx ${tx.id}`);
      // this is incorrect but better than nothing (don't know who paid manually)
      return tx.UserId;
    default:
      throw new AssertionError(`unrecognized status ${status}`);
  }
}

// Get all transactions
models.Transaction.findAll({
  where: {
    amount: { $lt: 0 },
    ExpenseId: null // this ensures that we don't reprocess a transaction
  },
  order: 'id',
  include: {
    model: models.PaymentMethod,
    paranoid: false
  }
})
.map(transaction => createExpense(transaction))
.catch(err => console.log('err', err))
.then(() => console.log('Done!'))
.then(() => process.exit());
