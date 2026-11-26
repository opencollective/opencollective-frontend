import { expect, scenarioTest } from '../../fixtures';

// The profile rounds amounts to whole units: €5,140 in all
const CONTRIBUTIONS = [200000, 150000, 164000];
const EXPENSES = ['Conference travel', 'Printed flyers', 'Hosting bill'];

const test = scenarioTest('user-profile', {
  inputs: { adminSince: '2016-08-15', contributions: CONTRIBUTIONS, expenses: EXPENSES },
  actor: null,
});

test('a user profile is never indexed by search engines', async ({ page, scenario }) => {
  await page.goto(scenario.urls.profile);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'none');
});

test('visitor reads the roles of a user, filtered by kind of contribution', async ({ page, scenario }) => {
  await page.goto(scenario.urls.profile);
  await page.locator('a[href="#category-CONTRIBUTIONS"]').click();
  await expect(page).toHaveURL(/#category-CONTRIBUTIONS$/);

  const since = page.getByTestId('contribution-date-since');
  await page.getByTestId('filter-button core').click();
  await expect(page.getByTestId('collective-contribution')).toHaveCount(1);
  await expect(since.first()).toContainText('Admin since');
  await expect(since.first()).toContainText('August 2016');

  await page.getByTestId('filter-button financial').click();
  await expect(since.first()).toContainText('Financial Contributor since');
  const amount = page.getByTestId('amount-contributed').first();
  await expect(amount).toContainText('Amount contributed');
  await expect(amount).toContainText('€5,140');
});

test('visitor switches the budget of a user between expenses and contributions', async ({ page, scenario }) => {
  await page.goto(scenario.urls.profile);
  await expect(page.getByTestId('collective-page-main')).toBeVisible();
  const budget = page.locator('#section-budget');
  await budget.scrollIntoViewIfNeeded();
  const items = budget.getByTestId('single-budget-item');

  // Mixed by default, latest three
  await expect(budget.getByTestId('filter-button all')).toHaveAttribute('data-selected', 'true');
  await expect(items).toHaveCount(3);

  await budget.getByTestId('filter-button expenses').click();
  await expect(budget.getByRole('link', { name: 'View all expenses' })).toHaveAttribute(
    'href',
    `${scenario.urls.profile}/submitted-expenses`,
  );
  await expect(items).toHaveCount(3);
  await expect(budget.locator('[data-cy^=expense-container-]')).toHaveCount(3);

  await budget.getByTestId('filter-button transactions').click();
  await expect(budget.getByRole('link', { name: 'View all contributions' })).toHaveAttribute(
    'href',
    `${scenario.urls.profile}/transactions?kind=ADDED_FUNDS&kind=CONTRIBUTION&kind=PLATFORM_TIP`,
  );
  await expect(items).toHaveCount(3);
  await expect(budget.getByTestId('transaction-item')).toHaveCount(3);
});
