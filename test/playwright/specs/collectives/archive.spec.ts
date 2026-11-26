import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';

// The admin of a hosted Collective and of an Organization, in their advanced settings.
const test = scenarioTest('collective-admin', { inputs: { organization: true }, actor: 'admin' });

test('admin archives an Organization, then unarchives it', async ({ page, scenario }, testInfo) => {
  await page.goto(scenario.urls.organizationAdvanced);
  await page.getByRole('button', { name: 'Archive this Organization' }).click();
  await page.getByTestId('action').click();
  await expect(page.getByText('This organization has been archived')).toBeVisible();
  isolationProbe(testInfo, 'leave an archived Organization and retry with an active one.');

  await page.getByRole('button', { name: 'Unarchive this Organization' }).click();
  await page.getByTestId('action').click();
  // Archiving is offered again once the Organization is active.
  await expect(page.getByRole('button', { name: 'Archive this Organization' })).toBeVisible();
});

test('an archived Collective says so and no longer accepts expenses', async ({ page, scenario }) => {
  const { collective } = scenario.accounts;
  await page.goto(scenario.urls.advanced);
  await page.getByRole('button', { name: 'Archive this Collective' }).click();
  await page.getByTestId('action').click();
  await expect(page.getByText('This collective has been archived')).toBeVisible();

  await page.goto(scenario.urls.collective);
  await expect(page.getByRole('heading', { name: `${collective.name} has been archived.` })).toBeVisible();
  await page.goto(`/${collective.slug}/expenses/new`);
  await expect(page.getByText('Access denied')).toBeVisible();
});
