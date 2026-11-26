import { expect, scenarioTest } from '../../fixtures';
import type { ContributionScenario } from '../../fixtures/transport';
import { downloadPdf } from '../../helpers/downloads';

// A hosted Collective with one $1 monthly contribution from `contributor`, charged once.
const test = scenarioTest('recurring-contribution', { inputs: {}, actor: null });

test('search engines may index the transactions of a Collective, not of a person', async ({ page, scenario }) => {
  const robots = page.locator('meta[name="robots"]');

  await page.goto(`/${scenario.accounts.collective.slug}/transactions`);
  await expect(page.getByTestId('transactions-page-content')).toBeVisible();
  await expect(robots).toHaveCount(0);
  await expect(page.getByTestId('download-csv')).toBeVisible();

  await page.goto(`/${scenario.actors.contributor.slug}/transactions`);
  await expect(page.getByTestId('transactions-page-content')).toBeVisible();
  await expect(robots).toHaveAttribute('content', 'none');
});

test.describe('signed in as the Collective admin', () => {
  test.use({ actor: 'hostAdmin' });

  test('downloads the receipt of a contribution', async ({ page, scenario: graph }, testInfo) => {
    const scenario = graph as ContributionScenario;
    const { host, collective } = scenario.accounts;
    await page.goto(`/${collective.slug}/transactions`);
    await page.getByTestId('transaction-details').filter({ hasText: 'View Details' }).first().click();

    const { filename, text } = await downloadPdf(
      page.getByTestId('download-transaction-receipt-btn').first(),
      testInfo,
    );
    expect(filename).toMatch(new RegExp(`^${collective.slug}_\\d{4}-\\d{2}-\\d{2}_[0-9a-f-]+\\.pdf$`));
    expect(text).toContain(host.name); // Bill from
    expect(text).toContain(scenario.actors.contributor.name); // Bill to
    expect(text).toContain(`Contribution #${scenario.contribution.legacyId}`);
    expect(text).toContain(`Reference: ${host.slug}_`);
    expect(text).toContain(`Monthly financial contribution to ${collective.name}`);
    expect(text).toContain('TOTAL USD $1.00');
  });
});
