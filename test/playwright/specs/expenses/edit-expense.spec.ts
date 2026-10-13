import { expect, scenarioTest } from '../../fixtures';
import { attachReceipt } from '../../helpers/expense-form';
import { expectStoredUpload } from '../../helpers/uploads';

const test = scenarioTest('expense-submission', { inputs: { priorExpense: true }, actor: 'submitter' });

for (const { kind, priorExpenseType, label } of [
  { kind: 'invoice', priorExpenseType: 'INVOICE', label: 'Invoice' },
  { kind: 'reimbursement', priorExpenseType: 'RECEIPT', label: 'Reimbursement' },
] as const) {
  test.describe(`pending ${kind}`, () => {
    test.use({ inputs: { priorExpense: true, priorExpenseType } });

    test('submitter renames it', async ({ page, scenario }) => {
      await page.goto(scenario.expenses.prior.url);
      await expect(page.getByTestId('expense-description')).toHaveText(scenario.expenses.prior.description);
      await expect(page.getByText(`${label} #${scenario.expenses.prior.legacyId}`, { exact: true })).toBeVisible();
      await page.getByTestId('edit-expense-title-btn').click();
      await page.locator('input[name="description"]').fill('New title');
      await page.locator('form').getByRole('button', { name: 'Save' }).click();
      await expect(page.getByTestId('expense-description')).toHaveText('New title');
      await expect(page.getByText(`${label} #${scenario.expenses.prior.legacyId}`, { exact: true })).toBeVisible();
    });

    test('submitter edits its items and switches its reference currency', async ({ page, scenario }) => {
      await page.goto(scenario.expenses.prior.url);
      await expect(page.getByTestId('expense-items-total-amount')).toHaveText('$10.00 USD');
      const items = page.getByTestId('expense-summary-item');
      const receipt = page.getByRole('img', { name: 'Uploaded file preview' });
      await expect(items).toHaveCount(1);
      // The listed item of a reimbursement shows its receipt; an invoice's item has none.
      await expect(items.first().locator(receipt)).toHaveCount(kind === 'reimbursement' ? 1 : 0);

      await page.getByTestId('edit-expense-expenseDetails-btn').click();
      await page.locator('input[name="expenseItems.0.description"]').fill('New item description');

      // A second item of 100 EUR next to the existing $10.
      await page.getByTestId('expense-add-item-btn').click();
      await page.locator('input[name="expenseItems.1.description"]').fill('Item 2 description');
      await page.locator('input[name="expenseItems.1.incurredAt"]').fill('2025-09-29');
      await page.getByTestId('input-expenseItems.1.amount.valueInCents-currency-picker').click();
      await page.getByPlaceholder('Search...').fill('EUR');
      await page.getByPlaceholder('Search...').press('Enter');
      await page.locator('input[name="expenseItems.1.amount.valueInCents"]').fill('100');
      if (kind === 'reimbursement') {
        // The receipt arranged for the first item is still attached; the new item needs its own.
        const edited = page.getByRole('dialog').getByRole('listitem');
        await expectStoredUpload(edited.nth(0).getByRole('link', { name: 'Uploaded file preview' }));
        await attachReceipt(edited.nth(1), 'receipt1.jpg');
      }

      // With two currencies the expense keeps its own until the submitter picks the other one.
      await expect(page.getByTestId('reference-currency-option-USD')).toBeChecked();
      await page.getByTestId('reference-currency-option-EUR').click();
      await expect(page.getByTestId('reference-currency-option-EUR')).toBeChecked();
      // The first item is now converted; saving before its rate arrives fails validation without any message.
      await expect(page.getByRole('button', { name: '1 USD = 1.1 EUR' })).toBeVisible();
      await page.locator('form').getByRole('button', { name: 'Save' }).click();
      await expect(page.getByTestId('toast-notification').filter({ hasText: 'Expense edited' })).toBeVisible();

      await expect(items).toHaveCount(2);
      await expect(items.nth(0).getByTestId('expense-summary-item-description')).toHaveText('New item description');
      // Converted at the environment's fixed exchange rate (1.1); the original amount stays visible.
      await expect(items.nth(0).getByTestId('expense-summary-item-amount')).toContainText('€11.00 EUR');
      await expect(items.nth(0).getByTestId('expense-summary-item-amount')).toContainText('$10.00 USD');
      await expect(items.nth(1).getByTestId('expense-summary-item-description')).toHaveText('Item 2 description');
      await expect(items.nth(1).getByTestId('expense-summary-item-amount')).toContainText('€100.00 EUR');
      await expect(page.getByTestId('expense-items-total-amount')).toHaveText('€111.00 EUR');
      if (kind === 'reimbursement') {
        await expect(items.nth(0).locator(receipt)).toHaveCount(1);
        await expect(items.nth(1).locator(receipt)).toHaveCount(1);
      }
    });
  });
}
