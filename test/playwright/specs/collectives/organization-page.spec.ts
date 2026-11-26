import { expect, scenarioTest } from '../../fixtures';

// A visitor on the page of an Organization run by `admin`.
const test = scenarioTest('collective-admin', { inputs: { organization: true }, actor: null });

test('a new Organization shows its team, no transactions, and is hidden from search engines', async ({
  page,
  scenario,
}) => {
  await page.goto(scenario.urls.organization);
  await expect(page.getByTestId('collective-title')).toHaveText(scenario.accounts.organization.name);
  // Organizations are only indexed once they have some financial activity.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'none');
  const team = page.getByTestId('section-our-team');
  await expect(team).toContainText('Our team');
  await expect(team.locator(`a[href="/${scenario.actors.admin.slug}"]`).first()).toBeVisible();
  await expect(page.locator('#section-transactions')).toHaveCount(0);
});

test.describe('with financial activity', () => {
  test.use({ inputs: { organization: true, history: { contribution: 50000, expense: 2500 } } });

  test('visitor filters the transactions of the Organization by expenses and contributions', async ({
    page,
    scenario,
  }) => {
    const { collective, organization } = scenario.accounts;
    await page.goto(scenario.urls.organization);
    const transactions = page.locator('#section-transactions');
    await expect(transactions.getByTestId('transaction-item').first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    // The Organization was paid for an expense...
    await transactions.getByTestId('filter-button expenses').click();
    await expect(transactions.getByTestId('transaction-item')).toHaveCount(1);
    await expect(transactions.getByTestId('transaction-sign').first()).toHaveText('+');
    await expect(transactions.getByTestId('transaction-amount').first()).toContainText('$25.00');

    // ...and contributed to the Collective.
    await transactions.getByTestId('filter-button contributions').click();
    const contribution = transactions.getByTestId('transaction-item');
    await expect(contribution).toHaveCount(1);
    await expect(contribution.getByTestId('transaction-sign')).toHaveText('-');
    await expect(contribution.locator(`a[href="/${collective.slug}"]`).first()).toBeVisible();
    await expect(contribution.locator(`a[href="/${organization.slug}"]`).first()).toBeVisible();
    await expect(contribution.getByTestId('transaction-description')).toContainText('Financial contribution to');
    await expect(contribution.getByTestId('transaction-amount')).toContainText('$500.00');
    await expect(contribution.getByTestId('transaction-amount')).toContainText('USD');
  });
});
