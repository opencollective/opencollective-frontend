import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';

const test = scenarioTest('expense-management', {
  inputs: { expense: { description: 'Expense for E2E tests', items: [{ description: 'Some stuff', amount: 1000 }] } },
  actor: 'admin',
});

/** Writes both expense policies of a Collective on its dashboard policies page, which must be open. */
async function writeExpensePolicies(page: Page, policies: { invoice: string; reimbursement: string }) {
  const invoice = page.getByTestId('invoice-expense-policy-input').locator('trix-editor');
  const reimbursement = page.getByTestId('receipt-expense-policy-input').locator('trix-editor');
  // Policies belong to this attempt's Collective: nothing was written before the admin does.
  await expect(invoice).toHaveText('');
  await expect(reimbursement).toHaveText('');
  await invoice.fill(policies.invoice);
  await reimbursement.fill(policies.reimbursement);
  await page.getByTestId('submit-policy-btn').click();
  await expect(
    page.getByTestId('toast-notification').filter({ hasText: 'Policies updated successfully' }),
  ).toBeVisible();
}

test('Collective admin writes expense policies in the dashboard and submitters see them on the expense form', async ({
  page,
  scenario,
}, testInfo) => {
  const { collective } = scenario.accounts;
  const policies = {
    invoice: `Invoice policy of ${collective.slug}`,
    reimbursement: `Reimbursement policy of ${collective.slug}`,
  };
  await page.goto(scenario.expenses.pending.url);
  await page.getByTestId('go-to-dashboard-btn').click();
  await page.getByTestId('menu-item-Settings').click();
  await page.getByTestId('menu-item-policies').click();
  await writeExpensePolicies(page, policies);
  if (process.env.PLAYWRIGHT_ISOLATION_PROBE === '1' && testInfo.retry === 0) {
    throw new Error(
      'Intentional isolation probe: leave a Collective with saved policies behind and retry with one that has none.',
    );
  }

  await page.goto(scenario.expenses.pending.url);
  await page.getByTestId('submit-expense-button').click();
  await expect(page.getByTestId('collective-invoice-policy')).toContainText(policies.invoice);
  await page.locator('#TYPE_OF_EXPENSE').getByRole('radio', { name: 'Reimbursement' }).click();
  await expect(page.getByTestId('collective-receipt-policy')).toContainText(policies.reimbursement);
  await expect(page.getByTestId('collective-invoice-policy')).toHaveCount(0);
});

test.describe('Collective with a Project', () => {
  test.use({ inputs: { project: true } });

  test('expense form of a Project shows the expense policy of its parent Collective', async ({ page, scenario }) => {
    const { collective } = scenario.accounts;
    const policies = {
      invoice: `Invoice policy of ${collective.slug}`,
      reimbursement: `Reimbursement policy of ${collective.slug}`,
    };
    await page.goto(scenario.urls.policies);
    await writeExpensePolicies(page, policies);

    await page.goto(scenario.urls.projectNewExpense);
    await expect(page.getByTestId('collective-invoice-policy')).toContainText(policies.invoice);
  });
});
