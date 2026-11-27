import { expect, scenarioTest } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';

/**
 * `hostAdmin` is the only admin of the hosted `collective`, hence its one core contributor; `submitter` has no role
 * on it.
 */
const test = scenarioTest('expense-submission', { inputs: {}, actor: 'hostAdmin' });

test('Collective admin drafts, publishes and edits a restricted update that outsiders cannot read', async ({
  page,
  scenario,
  openBrowserAs,
}, testInfo) => {
  const { collective } = scenario.accounts;
  const title = `New update ${collective.slug}`;
  const update = page.getByTestId('update');
  const header = update.locator('header');

  await page.goto(`/dashboard/${collective.slug}/updates/new`);
  await page.getByTestId('update-title').fill(title);
  const editor = page.getByTestId('update-content-editor').locator('trix-editor');
  await editor.fill('This is some bold HTML');
  // Selecting everything right after filling can select nothing yet; select and embolden again until it holds.
  const bold = page.getByTestId('update-content-editor').locator('trix-toolbar .trix-button--icon-bold');
  await expect(async () => {
    if ((await editor.locator('strong').count()) === 0) {
      await editor.press('ControlOrMeta+a');
      await bold.click();
    }
    await expect(editor.locator('strong')).toHaveText('This is some bold HTML', { timeout: 2_000 });
  }).toPass();
  await page.getByTestId('update-save-draft-btn').click();
  await expect(header.locator('h1')).toHaveText(title);
  await expect(header).toContainText('Draft');
  await expect(update.locator('strong')).toHaveText('This is some bold HTML');

  await page.getByTestId('update-edit-btn').click();
  await page.getByTestId('update-type-select').click();
  await page.getByTestId('update-type-private').click();
  await page.getByTestId('update-publish-btn').click();
  const audience = page.getByTestId('update-audience-breakdown');
  await expect(audience).toContainText('Your Update will be sent to a total of 1 emails');
  await expect(audience).toContainText('1 core contributor');
  await page.getByTestId('confirmation-modal-continue').click();
  await expect(header).toContainText('Published (Restricted)');
  await expect(header).not.toContainText('Draft');
  isolationProbe(testInfo, 'leave a published restricted update behind and retry on a Collective without updates.');

  // A published update can still be edited.
  await page.getByTestId('update-edit-btn').click();
  await page.getByTestId('update-title').fill(`${title} edited`);
  await page.getByTestId('update-save-btn').click();
  await expect(header.locator('h1')).toHaveText(`${title} edited`);
  await expect(header).toContainText('Published (Restricted)');

  const outsider = await openBrowserAs('submitter');
  await outsider.goto(`/${collective.slug}/updates`);
  await outsider
    .getByTestId('updateTitle')
    .filter({ hasText: `${title} edited` })
    .click();
  await expect(outsider.getByTestId('mesgBox')).toHaveText(`Contribute to ${collective.name} to see this Update`);
  await expect(outsider.getByText('This is some bold HTML')).toHaveCount(0);
});
