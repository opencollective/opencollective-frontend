#!/usr/bin/env node
import '../server/env';

/*
 * This script finds all expenses that are paid and don't have a transaction
 */

console.log('This script is being deprecated.');
console.log('To re-enable it, remove this message with a Pull Request explaining the use case.');
process.exit();

/*

import models, { sequelize } from '../server/models';
import { createFromPaidExpense as createTransactionFromPaidExpense } from '../server/lib/transactions';

const done = err => {
  if (err) console.log('err', err);
  console.log('done!');
  process.exit();
};

const expensesFixed = [];

function run() {
  // Find all expenses that are paid, with payout method 'manual' or 'other'
  // and don't have an entry in the Transactions table.
  return sequelize
    .query(
      `
    SELECT
      e.id AS id
    FROM "Expenses" e
    LEFT JOIN "Transactions" t ON t."ExpenseId" = e.id
    WHERE
      e.status ILIKE 'paid'
      AND t.id IS NULL
      AND e."deletedAt" IS NULL
      AND (e."payoutMethod" ILIKE 'other' OR e."payoutMethod" ILIKE 'manual')
    ORDER BY "ExpenseId" DESC, e."updatedAt"
    `,
      { type: sequelize.QueryTypes.SELECT },
    )
    .then(expenses => {
      console.log('Expenses found', expenses.length);
      return expenses;
    })
    .each(expenseId => {
      let expense;
      return models.Expense.findOne({
        where: {
          id: expenseId.id,
        },
        include: [
          {
            model: models.Collective,
            as: 'collective',
          },
        ],
      })
        .then(e => {
          expense = e;
          return e.collective.getHostCollective();
        })
        .then(host => createTransactionFromPaidExpense(host, null, expense, null, expense.UserId))
        .then(() => expensesFixed.push(expenseId));
    })
    .then(() => console.log('Expenses fixed: ', expensesFixed.length))
    .then(() => done())
    .catch(done);
}

run();

*/
