import { expect, test } from '../fixtures';
import { isolationProbe } from '../helpers/attempt';

test('Account admin edits and persists its public profile', async ({ page, scenario }, testInfo) => {
  await page.goto(scenario.urls.info);
  await expect(page.locator('input[name="name"]')).toHaveValue(scenario.account.name);
  const name = `${scenario.account.name} edited`;
  const description = `Profile of ${scenario.account.slug}`;
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="description"]').fill(description);
  await page.getByTestId('save').click();
  await page.getByTestId('public-profile-link').click();
  await expect(page.getByTestId('collective-title')).toHaveText(name);
  await expect(page.getByText(description, { exact: true })).toBeVisible();
  isolationProbe(testInfo, 'leave the first attempt mutated and retry in a replacement worker.');
  await page.reload();
  await expect(page.getByTestId('collective-title')).toHaveText(name);
});
