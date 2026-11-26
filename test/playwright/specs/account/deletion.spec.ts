import { expect, scenarioTest, test } from '../../fixtures';

const userTest = scenarioTest('individual', { inputs: {}, actor: 'user' });

test('Collective admin deletes their Collective from the advanced settings', async ({ page, scenario }) => {
  await page.goto(`/dashboard/${scenario.account.slug}/advanced`);
  await page.getByRole('button', { name: 'Delete this Collective' }).click();
  await page.getByTestId('delete').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your collective has been deleted.' })).toBeVisible();
  expect(new URL(page.url()).search).toBe('?type=COLLECTIVE');
});

userTest('user deletes their own account from the advanced settings', async ({ page, scenario }) => {
  await page.goto(scenario.urls.advanced);
  await page.getByRole('button', { name: 'Delete this account' }).click();
  await page.getByTestId('delete').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your account has been deleted.' })).toBeVisible();
  expect(new URL(page.url()).search).toBe('?type=USER');
});
