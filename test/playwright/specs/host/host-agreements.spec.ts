import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';
import { toast } from '../../helpers/notifications';

// `collective` has a pending expense; `collective2` has no agreement and serves as a filter that matches nothing.
const test = scenarioTest('fiscal-host', {
  inputs: { pendingExpense: true, secondCollective: true },
  actor: 'hostAdmin',
});

test('host admin creates, edits, filters and deletes an agreement, which expenses of the Collective show', async ({
  page,
  scenario,
}, testInfo) => {
  const { host, collective, collective2 } = scenario.accounts;
  const drawer = page.getByTestId('agreement-drawer');
  const rows = page.getByTestId('agreements-table').locator('tbody tr');
  await page.goto(scenario.urls.agreements);
  await expect(page.getByTestId('zero-results-message')).toContainText('No agreements');

  // Create: an empty form is refused, then the agreement is saved.
  await page.getByTestId('btn-new-agreement').click();
  const form = page.getByTestId('agreement-form');
  await page.getByRole('button', { name: 'Create Agreement' }).click();
  await expect(form.getByTestId('InputField-account')).toContainText('This field is required');
  await expect(form.getByTestId('InputField-title')).toContainText('This field is required');
  await form.locator('#input-account').fill(collective.slug);
  await page.locator(`[role=option][value="${collective.slug}"]`).click();
  await form.locator('#input-title').fill('Unlimited potatoes');
  await form.locator('#input-expiresAt').fill('2062-11-06');
  await form
    .locator('#input-notes')
    .fill('This group can expense an unlimited number of potatoes\n\nNo restrictions whatsoever.');
  await page.getByRole('button', { name: 'Create Agreement' }).click();
  await expect(toast(page, 'Agreement created')).toBeVisible();
  await expect(drawer).toHaveCount(0);
  isolationProbe(testInfo, 'leave an agreement behind and retry on a new host.');

  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(collective.name);
  await expect(rows.first()).toContainText('Unlimited potatoes');
  await expect(rows.first()).toContainText('Nov 6, 2062');

  // The drawer shows it all, and edits it.
  await rows.first().locator('td:nth-child(2)').click();
  await expect(drawer).toContainText(collective.name);
  await expect(drawer).toContainText('Unlimited potatoes');
  await expect(drawer).toContainText('November 6, 2062');
  await expect(drawer).toContainText('This group can expense an unlimited number of potatoes');
  await drawer.getByTestId('btn-edit-agreement').click();
  await form.locator('#input-title').fill('Unlimited potatoes (updated)');
  await form.locator('#input-expiresAt').fill('2062-11-07');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(toast(page, 'Agreement updated')).toBeVisible();
  await expect(drawer).toContainText('Unlimited potatoes (updated)');
  await expect(drawer).toContainText('November 7, 2062');
  await page.getByTestId('close-drawer-btn').click();
  await expect(drawer).toHaveCount(0);
  await expect(rows.first()).toContainText('Unlimited potatoes (updated)');
  await expect(rows.first()).toContainText('Nov 7, 2062');

  // Filtering by another Collective finds nothing, until the filter is reset.
  await page.getByTestId('filter-account').click();
  await page.getByTestId('combo-select-input').fill(collective2.slug);
  await page.getByTestId('combo-select-option').filter({ hasText: collective2.name }).click();
  await page.getByTestId('apply-filter').click();
  await expect(page.getByTestId('zero-results-message')).toContainText('No matching agreements');
  await page.getByTestId('zero-results-message').getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.getByTestId('agreements-table')).toContainText('Unlimited potatoes (updated)');

  // An expense of the Collective counts its agreements, and links to them.
  await page.getByTestId('menu-item-Outgoing Money').click();
  await page.getByTestId('menu-item-pay-disbursements').click();
  // The list starts with expenses ready to pay; this one is still pending.
  await page.getByRole('button', { name: 'All', exact: true }).click();
  const expense = page.getByTestId(`expense-container-${scenario.expenses.pending.legacyId}`);
  await expense.getByTestId('expense-title').click();
  await expect(page.getByTestId('expense-drawer')).toBeVisible();
  const summary = page.getByTestId('expense-summary-collective');
  await expect(summary).toContainText('Host Agreements: 1');
  await summary.locator(`a[href="/dashboard/${host.slug}/host-agreements?account=${collective.slug}"]`).click();

  // Delete it.
  await rows.filter({ hasText: 'Unlimited potatoes (updated)' }).locator('td:nth-child(2)').click();
  await drawer.getByTestId('more-actions-delete-expense-btn').click();
  await expect(page.getByText('This will permanently delete the agreement and all its attachments')).toBeVisible();
  await page.getByTestId('confirmation-modal-continue').click();
  await expect(toast(page, 'Agreement deleted successfully')).toBeVisible();
  await expect(drawer).toHaveCount(0);
  await expect(page.getByTestId('zero-results-message')).toContainText('No matching agreements');
});
