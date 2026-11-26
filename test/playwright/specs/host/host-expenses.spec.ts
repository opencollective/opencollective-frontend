import type { Locator, Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';

// A pending $10 invoice on a Collective holding $100 that the host added.
const test = scenarioTest('fiscal-host', {
  inputs: { pendingExpense: true, collectiveBalance: 10000 },
  actor: 'hostAdmin',
});

/** As the host admin, approves the expense on its own page. */
async function approveOnExpensePage(page: Page, url: string) {
  await page.goto(url);
  await expect(page.getByTestId('expense-status-msg')).toHaveText('Pending');
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(page.getByTestId('expense-status-msg')).toHaveText('Approved');
}

/** Asks for the approved expense to be approved again, from the host's list of expenses to pay. */
async function requestReApproval(page: Page, expense: Locator) {
  await expense.getByTestId('request-re-approval-button').click();
  await page.getByRole('button', { name: 'Confirm and request re-approval' }).click();
  await expect(expense.getByTestId('expense-status-msg')).toContainText('Pending');
}

test('host admin approves, pays and un-pays an expense, requesting re-approval along the way', async ({
  page,
  scenario,
}, testInfo) => {
  const pending = scenario.expenses.pending;
  const toPay = `${scenario.urls.payDisbursements}?sort[field]=CREATED_AT&sort[direction]=DESC&status=ALL`;
  const expense = page.getByTestId(`expense-container-${pending.legacyId}`);

  await approveOnExpensePage(page, pending.url);
  await page.goto(toPay);
  await requestReApproval(page, expense);
  isolationProbe(testInfo, 'leave an expense sent back for approval behind and retry with a new one.');

  await approveOnExpensePage(page, pending.url);
  await page.goto(toPay);
  await expense.getByTestId('pay-button').click();
  const payModal = page.getByTestId('pay-expense-modal');
  // The payee's "Other" payout method can only be paid manually: the dialog offers no other way.
  await payModal.getByTestId('expense-amount-paid').fill('10.00');
  await payModal.getByTestId('mark-as-paid-button').click();
  const adminStatus = expense.getByTestId('admin-expense-status-msg');
  await expect(adminStatus).toContainText('Paid');

  await adminStatus.click();
  await page.getByTestId('mark-as-unpaid-button').click();
  await page.getByTestId('mark-expense-as-unpaid-modal').getByTestId('confirmation-modal-continue').click();
  await expect(adminStatus).toContainText('Approved');
  // The status menu stays open over the list (Cypress clicked through it with `force`): close it like a user.
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('mark-as-unpaid-button')).toBeHidden();

  await requestReApproval(page, expense);
});
