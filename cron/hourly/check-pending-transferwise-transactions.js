#!/usr/bin/env node
import '../../server/env';

import models from '../../server/models';
import statuses from '../../server/constants/expense_status';
import * as transferwiseLib from '../../server/lib/transferwise';
import activities from '../../server/constants/activities';
import { PayoutMethodTypes } from '../../server/models/PayoutMethod';

async function processExpense(expense) {
  console.log(`\nProcessing expense #${expense.id}...`);
  const host = await expense.collective.getHostCollective();
  if (!host) {
    throw new Error(`Could not find the host embursing the expense.`);
  }
  const [connectedAccount] = await host.getConnectedAccounts({
    where: { service: 'transferwise', deletedAt: null },
  });
  if (!connectedAccount) {
    throw new Error(`Host is not connected to Transferwise.`);
  }
  const [transaction] = expense.Transactions;
  if (!transaction) {
    throw new Error(`Could not find any transactions associated with expense.`);
  }
  const transfer = await transferwiseLib.getTransfer(connectedAccount.token, transaction.data.transfer.id);
  if (transfer.status === 'processing') {
    console.warn(`Transfer is still being processed, nothing to do but wait.`);
  } else if (transfer.status === 'outgoing_payment_sent') {
    console.log(`Transfer sent, marking expense as paid.`);
    await expense.setPaid(expense.lastEditedById);
    await expense.createActivity(activities.COLLECTIVE_EXPENSE_PAID);
  } else if (transfer.status === 'funds_refunded') {
    console.warn(`Transfer ${transfer.status}, setting status to Error and deleting existing transactions.`);
    await models.Transaction.destroy({ where: { ExpenseId: expense.id } });
    await expense.setError(expense.lastEditedById);
  }
}
/**
 * Updates the status of expenses being processed through Transferwise.
 */
export async function run() {
  const expenses = await models.Expense.findAll({
    where: { status: statuses.PROCESSING, deletedAt: null },
    include: [
      { model: models.Collective, as: 'collective' },
      { model: models.Transaction },
      { model: models.PayoutMethod, as: 'PayoutMethod', where: { type: PayoutMethodTypes.BANK_ACCOUNT } },
    ],
  });
  console.log(`There are ${expenses.length} pending Transferwise transactions...`);

  for (const expense of expenses) {
    await processExpense(expense).catch(console.error);
  }
}

if (require.main === module) {
  run()
    .then(() => {
      process.exit(0);
    })
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
}
