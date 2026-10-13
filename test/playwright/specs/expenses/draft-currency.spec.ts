import { expect, scenarioTest } from '../../fixtures';
import { addPayoutMethod, chooseExpenseType } from '../../helpers/expense-form';

const test = scenarioTest('expense-draft-invite', {
  inputs: {
    description: 'Recurring-like USD draft',
    currency: 'USD',
    items: [{ description: 'Consulting', amount: 12500 }],
  },
  actor: 'payeeAdmin',
});

test('invited Organization submits a USD draft with a EUR payout method and the expense stays in USD', async ({
  page,
  scenario,
}) => {
  await page.goto(scenario.urls.draft);
  await expect(page.getByText('You have been invited to submit an expense')).toBeVisible();
  await page.getByText('Continue submission').click();

  // A saved payout method becomes the selected one; its currency differs from the draft's.
  await addPayoutMethod(page, {
    name: `Euro account ${scenario.accounts.payee.slug}`,
    currency: 'EUR',
    details: 'A euro bank account',
    save: true,
  });
  await chooseExpenseType(page, 'invoice', { attachInvoice: true });

  const items = page.locator('#EXPENSE_ITEMS');
  const itemCurrency = items.getByTestId('input-expenseItems.0.amount.valueInCents-currency-picker');
  await expect(itemCurrency).toContainText('USD');
  await expect(itemCurrency).not.toContainText('EUR');
  await items.locator('input[name="expenseItems.0.incurredAt"]').fill('2025-09-29');
  await expect(page.locator('#SUMMARY')).toContainText('$125.00 USD');

  await page.locator('form').getByRole('button', { name: 'Submit Expense' }).click();
  await expect(page.getByText('has been submitted successfully!')).toBeVisible();

  // The submitted expense keeps the requested currency.
  await page.goto(scenario.expenses.draft.url);
  await expect(page.getByTestId('expense-status-msg')).toHaveText('Pending');
  await expect(page.getByTestId('expense-items-total-amount')).toHaveText('$125.00 USD');
});
