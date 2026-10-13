import { expect, scenarioTest } from '../../fixtures';

const test = scenarioTest('expense-submission', { inputs: {}, actor: null });

test('logged-out visitor is asked to sign in before submitting an expense', async ({ page, scenario }) => {
  await page.goto(scenario.urls.newExpense);
  await expect(page.getByTestId('signIn-form')).toBeVisible();
});

test('logged-out visitor reaches sign-in from the Submit Expense button of a Collective', async ({
  page,
  scenario,
}) => {
  await page.goto(scenario.urls.collective);
  await expect(page.getByTestId('collective-title')).toHaveText(scenario.accounts.collective.name);
  await page.getByTestId('submit-expense-button').click();
  await expect(page.getByTestId('signIn-form')).toBeVisible();
});
