import { expect, scenarioTest } from '../../fixtures';

// A host with financial activity (it added funds to `collective`) and two hosted Collectives.
const test = scenarioTest('fiscal-host', { inputs: { collectiveBalance: 10000, secondCollective: true }, actor: null });

test('visitor sees the host profile with its hosted Collectives and team', async ({ page, scenario }) => {
  const { host, collective, collective2 } = scenario.accounts;
  await page.goto(scenario.urls.hostProfile);
  await expect(page.getByTestId('collective-title')).toContainText(host.name);
  // A host with financial activity may be indexed by search engines.
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

  const contributions = page.getByTestId('Contributions');
  await expect(page.getByText('We are fiscally hosting 2 Collectives')).toBeVisible();
  await page.getByTestId('filter-button host').click();
  await expect(contributions).toContainText(collective.name);
  await expect(contributions).toContainText(collective2.name);

  const team = page.getByTestId('section-our-team');
  await expect(team.getByRole('link', { name: scenario.actors.hostAdmin.name })).toBeVisible();
  await expect(team).toContainText('Admin');
});
