import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { downloadPdf } from '../../helpers/downloads';

const test = scenarioTest('expense-management', {
  inputs: { expense: { description: 'Expense for E2E tests', items: [{ description: 'Some stuff', amount: 1000 }] } },
  actor: 'admin',
});

/** Confirms the open "unapprove" or "reject" dialog with the reason the admin gives. */
async function confirmWithReason(page: Page, reason: string) {
  await page.getByTestId('confirm-action-text').locator('trix-editor').fill(reason);
  await page.getByTestId('confirm-action-button').click();
}

test('Collective admin approves, unapproves and rejects an expense, leaving a comment for each reversal', async ({
  page,
  scenario,
}, testInfo) => {
  await page.goto(scenario.expenses.pending.url);
  const status = page.getByTestId('expense-status-msg');
  const comments = page.getByTestId('comment-body');
  await expect(status).toHaveText('Pending');
  // The comment form comes with the loaded discussion: nobody has commented yet.
  await expect(page.getByTestId('comment-form')).toBeVisible();
  await expect(comments).toHaveCount(0);

  await page.getByTestId('approve-button').click();
  await expect(status).toHaveText('Approved');
  await page.getByTestId('unapprove-button').click();
  await confirmWithReason(page, 'Unapproved once');
  await expect(status).toHaveText('Pending');
  await expect(comments.filter({ hasText: 'Unapproved once' })).toBeVisible();
  if (process.env.PLAYWRIGHT_ISOLATION_PROBE === '1' && testInfo.retry === 0) {
    throw new Error(
      'Intentional isolation probe: leave an unapproved, commented expense behind and retry with a fresh one.',
    );
  }

  await page.getByTestId('approve-button').click();
  await expect(status).toHaveText('Approved');
  await page.getByTestId('unapprove-button').click();
  await confirmWithReason(page, 'Unapproved twice');
  await expect(status).toHaveText('Pending');
  await expect(comments.filter({ hasText: 'Unapproved twice' })).toBeVisible();

  await page.getByTestId('reject-button').click();
  await confirmWithReason(page, 'Rejected once');
  await expect(status).toHaveText('Rejected');
  await expect(comments.filter({ hasText: 'Rejected once' })).toBeVisible();
  await expect(comments).toHaveCount(3);
});

test('Collective admin deletes a rejected expense, which is then no longer available', async ({ page, scenario }) => {
  const expense = scenario.expenses.pending;
  // The expense is listed for its Collective until it is deleted.
  await page.goto(scenario.urls.expenses);
  await expect(page.getByTestId(`expense-container-${expense.legacyId}`)).toContainText(expense.description);

  await page.goto(expense.url);
  await page.getByTestId('reject-button').click();
  await confirmWithReason(page, 'rejected!');
  await expect(page.getByTestId('expense-status-msg')).toHaveText('Rejected');

  await page.getByTestId('more-actions').click();
  await page.getByTestId('more-actions-delete-expense-btn').click();
  await page.getByTestId('confirmation-modal-continue').click();
  await expect(page).toHaveURL(scenario.urls.expenses);
  // It was the Collective's only expense: once loaded, the list says it has none to show.
  await expect(page.getByTestId('zero-expense-message')).toBeVisible();
  await expect(page.getByTestId(`expense-container-${expense.legacyId}`)).toHaveCount(0);

  await page.goto(expense.url);
  await expect(page.getByTestId('error-page')).toContainText('Page not found');
});

test('Collective admin downloads the generated invoice of an expense as a PDF', async ({
  page,
  scenario,
}, testInfo) => {
  const expense = scenario.expenses.pending;
  const { collective } = scenario.accounts;
  await page.goto(expense.url);
  const { filename, text } = await downloadPdf(
    page.getByRole('button', { name: 'Download generated invoice' }),
    testInfo,
  );
  expect(filename).toMatch(
    new RegExp(`^Expense-${expense.legacyId}-${collective.slug}-invoice-\\d{4}-\\d{2}-\\d{2}\\.pdf$`),
  );
  expect(text).toContain(`Expense #${expense.legacyId}: ${expense.description}`);
  expect(text).toContain(`Collective: ${collective.name}`);
  // The payee, the host billed, the single item and the total, as the PDF service rendered them.
  expect(text).toContain(`From\n${scenario.actors.admin.name}`);
  expect(text).toContain(`Bill to\n${scenario.accounts.host.name}`);
  expect(text).toContain('Some stuff USD $10.00 $0.00 $10.00');
  expect(text).toContain('Total USD $10.00');
  if (process.env.PLAYWRIGHT_ISOLATION_PROBE === '1' && testInfo.retry === 0) {
    throw new Error(
      'Intentional isolation probe: leave a downloaded invoice behind and retry with a fresh expense and download path.',
    );
  }
});
