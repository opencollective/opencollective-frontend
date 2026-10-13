import { expect, scenarioTest } from '../../fixtures';

const test = scenarioTest('expense-submission', { inputs: { priorExpense: true }, actor: 'submitter' });

test('submitter renames their pending expense', async ({ page, scenario }) => {
  await page.goto(scenario.expenses.prior.url);
  await expect(page.getByTestId('expense-description')).toHaveText(scenario.expenses.prior.description);
  await page.getByTestId('edit-expense-title-btn').click();
  await page.locator('input[name="description"]').fill('New title');
  await page.locator('form').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('expense-description')).toHaveText('New title');
});

test('submitter edits the items of their pending expense and switches its reference currency', async ({
  page,
  scenario,
}) => {
  await page.goto(scenario.expenses.prior.url);
  await expect(page.getByTestId('expense-items-total-amount')).toHaveText('$10.00 USD');
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

  // With two currencies the expense keeps its own until the submitter picks the other one.
  await expect(page.getByTestId('reference-currency-option-USD')).toBeChecked();
  await page.getByTestId('reference-currency-option-EUR').click();
  await expect(page.getByTestId('reference-currency-option-EUR')).toBeChecked();
  // The first item is now converted; saving before its rate arrives fails validation without any message.
  await expect(page.getByRole('button', { name: '1 USD = 1.1 EUR' })).toBeVisible();
  await page.locator('form').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('toast-notification').filter({ hasText: 'Expense edited' })).toBeVisible();

  const items = page.getByTestId('expense-summary-item');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0).getByTestId('expense-summary-item-description')).toHaveText('New item description');
  // Converted at the environment's fixed exchange rate (1.1); the original amount stays visible.
  await expect(items.nth(0).getByTestId('expense-summary-item-amount')).toContainText('€11.00 EUR');
  await expect(items.nth(0).getByTestId('expense-summary-item-amount')).toContainText('$10.00 USD');
  await expect(items.nth(1).getByTestId('expense-summary-item-description')).toHaveText('Item 2 description');
  await expect(items.nth(1).getByTestId('expense-summary-item-amount')).toContainText('€100.00 EUR');
  await expect(page.getByTestId('expense-items-total-amount')).toHaveText('€111.00 EUR');
});
