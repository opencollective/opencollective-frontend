import type { Locator } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';

const listedExpenses = 12;
const test = scenarioTest('expense-management', { inputs: { listedExpenses }, actor: null });

/** The numbers of the `Listed expense <n>` the list shows. */
const listedNumbers = async (expenses: Locator) =>
  (await expenses.allTextContents()).map(text => Number(text.match(/Listed expense (\d+)/)?.[1]));

test('visitor pages through the expenses of a Collective', async ({ page, scenario }) => {
  const expenses = page.locator('[data-cy^="expense-container-"]');
  const pagination = page.getByTestId('pagination-item');
  const pageButton = (number: number) => pagination.getByRole('button', { name: String(number), exact: true });
  await page.goto(scenario.urls.expenses);
  await expect(expenses).toHaveCount(10);
  await expect(pageButton(2)).toBeVisible();
  await expect(pageButton(3)).toHaveCount(0);
  const firstPage = await listedNumbers(expenses);

  await pageButton(2).click();
  await expect(pageButton(2)).toHaveAttribute('aria-current', 'page');
  await expect(expenses).toHaveCount(listedExpenses - 10);
  const secondPage = await listedNumbers(expenses);
  // Every expense is listed exactly once across both pages.
  expect([...firstPage, ...secondPage].sort((a, b) => a - b)).toEqual(
    Array.from({ length: listedExpenses }, (_, index) => index + 1),
  );
});
