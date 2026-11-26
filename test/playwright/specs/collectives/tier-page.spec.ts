import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';
import { typeInBold } from '../../helpers/rich-text';

// The admin of a hosted Collective on the page of its `backer` tier.
const test = scenarioTest('collective-admin', { inputs: {}, actor: 'admin' });

test('admin edits the name and descriptions of a tier from its page', async ({ page, scenario }, testInfo) => {
  await page.goto(scenario.urls.backerTier);

  await page.getByTestId('InlineEditField-Trigger-name').click();
  await page.getByTestId('InlineEditField-Textarea-name').fill('Plant potatoes on the moon');
  const save = page.getByTestId('InlineEditField-Btn-Save');
  await save.click();
  await expect(page.getByTestId('TierName')).toContainText('Plant potatoes on the moon');
  // One field is edited at a time: each editor closes once its change is saved.
  await expect(save).toHaveCount(0);
  isolationProbe(testInfo, 'leave a renamed tier and retry on a Collective with the default tiers.');

  await page.getByTestId('InlineEditField-Add-description').click();
  await page.getByTestId('InlineEditField-Textarea-description').fill("Let's do dis!");
  await save.click();
  await expect(page.getByTestId('shortDescription')).toContainText("Let's do dis!");
  await expect(save).toHaveCount(0);

  await page.getByTestId('Btn-Add-longDescription').click();
  await typeInBold(page.getByTestId('RichTextEditor').locator('trix-editor'), 'Hello world!');
  await save.click();
  await expect(page.getByTestId('longDescription').locator('strong')).toHaveText('Hello world!');

  // All three edits were saved.
  await page.reload();
  await expect(page.getByTestId('TierName')).toContainText('Plant potatoes on the moon');
  await expect(page.getByTestId('shortDescription')).toContainText("Let's do dis!");
  await expect(page.getByTestId('longDescription').locator('strong')).toHaveText('Hello world!');
});

test('"Contribute" on a tier page opens the contribution flow of that tier', async ({ page, scenario }) => {
  await page.goto(scenario.urls.backerTier);
  await page.locator('[data-cy="ContributeBtn"]:visible').click();
  await expect(page).toHaveURL(`${scenario.urls.backerTier}/checkout`);
});

test.describe('logged out', () => {
  test.use({ actor: null });

  for (const route of ['contribute', 'tiers']) {
    test(`the ways to contribute are served at /<collective>/${route}`, async ({ page, scenario, baseURL }) => {
      const { collective } = scenario.accounts;
      await page.goto(`/${collective.slug}/${route}`);
      await expect(page).toHaveTitle(`Contribute to ${collective.name} - Open Collective`);
      // The legacy route points search engines to the current one.
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        `${baseURL}/${collective.slug}/contribute`,
      );
    });
  }
});
