import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';

const test = scenarioTest('fiscal-host', { inputs: {}, actor: 'hostAdmin' });

async function createCategory(page: Page, { code, name, friendlyName }: Record<string, string>) {
  await page.getByRole('button', { name: 'Create category' }).click();
  await page.getByTestId('InputField-code').locator('input').fill(code);
  await page.getByTestId('InputField-name').locator('input').fill(name);
  await page.getByTestId('InputField-friendlyName').locator('input').fill(friendlyName);
  await page.getByTestId('create-category-button').click();
  await expect(page.getByTestId('create-category-button')).toHaveCount(0);
}

async function orderBy(page: Page, current: string, next: string) {
  await page.getByRole('combobox').filter({ hasText: current }).click();
  await page.getByRole('option', { name: next }).click();
  await expect(page.getByRole('combobox').filter({ hasText: next })).toBeVisible();
}

test('host admin creates, searches, sorts and deletes accounting categories', async ({ page, scenario }, testInfo) => {
  await page.goto(scenario.urls.chartOfAccounts);
  await createCategory(page, { code: '007', name: 'Workspace', friendlyName: 'Workspace Expenses' });
  isolationProbe(testInfo, 'leave an accounting category behind and retry on a new host.');
  await createCategory(page, { code: '008', name: 'Contractors', friendlyName: 'Contractor Expenses' });
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(page.getByText('Workspace Expenses')).toBeVisible();
  await expect(page.getByText('Contractor Expenses')).toBeVisible();

  // Search by code, name and friendly name.
  const search = page.getByTestId('admin-panel-container').locator('input');
  for (const [term, found, hidden] of [
    ['007', 'Workspace Expenses', 'Contractor Expenses'],
    ['Workspace', 'Workspace Expenses', 'Contractor Expenses'],
    ['Contractor Expenses', 'Contractor Expenses', 'Workspace Expenses'],
  ]) {
    await search.fill(term);
    await expect(page.getByText(found)).toBeVisible();
    await expect(page.getByText(hidden)).toHaveCount(0);
  }
  await search.fill('009');
  await expect(page.getByText('No chart of accounts')).toBeVisible();
  await search.fill('');
  await expect(rows).toHaveCount(2);

  // Sorting by code, then by name.
  await expect(rows.nth(0)).toContainText('007');
  await expect(rows.nth(1)).toContainText('008');
  await orderBy(page, 'Code ascending', 'Code descending');
  await expect(rows.nth(0)).toContainText('008');
  await expect(rows.nth(1)).toContainText('007');
  await orderBy(page, 'Code descending', 'Name ascending');
  await expect(page).toHaveURL(/orderBy=NAME/);
  await expect(rows.nth(0)).toContainText('Contractors');
  await expect(rows.nth(1)).toContainText('Workspace');
  await orderBy(page, 'Name ascending', 'Name descending');
  await expect(rows.nth(0)).toContainText('Workspace');
  await expect(rows.nth(1)).toContainText('Contractors');

  // The drawer shows the category, which can be deleted from there.
  await rows.nth(0).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toContainText('Accounting code');
  await expect(drawer).toContainText('007');
  await expect(drawer).toContainText('Category name');
  await expect(drawer).toContainText('Applies to');
  await drawer.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByTestId('confirmation-modal-continue').click();
  await expect(rows).toHaveCount(1);
  await expect(rows.nth(0)).toContainText('008');
});
