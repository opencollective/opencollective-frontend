import path from 'path';

import { expect, scenarioTest } from '../../fixtures';
import type { CollectiveScenario } from '../../fixtures/transport';
import { queryAs } from '../../helpers/api';
import { isolationProbe } from '../../helpers/attempt';
import { toast } from '../../helpers/notifications';
import { typeInBold } from '../../helpers/rich-text';

const files = path.join(__dirname, '../../fixtures/files');
const socialLinks = [
  { type: 'TWITTER', url: 'https://x.com/testCollective' },
  { type: 'GITHUB', url: 'https://github.com/testCollective' },
  { type: 'WEBSITE', url: 'https://opencollective.com/testCollective' },
];

// The admin of a hosted Collective with the default tiers, signed in on its public page.
const test = scenarioTest('collective-admin', { inputs: { socialLinks }, actor: 'admin' });

test('visitors see the hero, tiers and team of a hosted Collective, which search engines may index', async ({
  page,
  scenario,
}) => {
  await page.goto(scenario.urls.collective);
  await expect(page.getByTestId('collective-title')).toHaveText(scenario.accounts.collective.name);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

  for (const [index, link] of socialLinks.entries()) {
    await expect(page.getByTestId(`social-link-${index}`)).toHaveAttribute('href', link.url);
  }
  await expect(page.getByTestId('fiscalHostName').first()).toContainText(scenario.accounts.host.name);

  const contribute = page.locator('#section-contribute');
  await expect(contribute).toContainText('Custom contribution');
  await expect(contribute).toContainText('Make a custom one-time or recurring contribution.');
  await expect(contribute).toContainText('Become a backer for $5.00 per month and support us');
  await expect(contribute).toContainText('Become a sponsor for $100.00 per month and support us');
  await expect(
    contribute.locator(`a[href="/${scenario.accounts.collective.slug}/contribute"]`, {
      hasText: 'All ways to contribute',
    }),
  ).toBeVisible();
  // Only the admin is offered to create tiers and events from the page.
  await expect(page.getByTestId('create-contribute-tier')).toBeVisible();
  await expect(page.getByTestId('create-event')).toBeVisible();

  // The admin is the only contributor so far.
  const contributors = page.getByTestId('ContributorsGrid_ContributorCard');
  await expect(contributors).toHaveCount(1);
  await expect(contributors.locator(`a[href="/${scenario.actors.admin.slug}"]`).first()).toBeVisible();
  await expect(contributors).toContainText('Admin');
});

test('admin changes the avatar, page color and cover of the Collective', async ({ page, scenario }, testInfo) => {
  await page.goto(scenario.urls.collective);
  await expect(page.getByTestId('collective-title')).toBeVisible();

  // An image below the minimum resolution is refused, then a valid one is previewed and saved.
  const invalidResolution = 'Image resolution needs to be between 200x200 and 3000x3000';
  await page.getByTestId('heroAvatarDropzone').setInputFiles(path.join(files, 'small-15x15.jpg'));
  await expect(toast(page, invalidResolution)).toBeVisible();
  await page.getByTestId('heroAvatarDropzone').setInputFiles(path.join(files, 'gophercon.jpg'));
  await expect(toast(page, invalidResolution)).toHaveCount(0);
  await expect(page.getByTestId('collective-avatar-image-preview')).toHaveAttribute('src', /.+/);
  await page.getByTestId('heroAvatarDropzoneSave').click();
  await expect(page.getByTestId('heroAvatarDropzoneSave')).toHaveCount(0);
  isolationProbe(testInfo, 'leave a Collective with a new avatar and retry on a Collective without one.');

  await page.getByTestId('edit-collective-display-features').getByTestId('edit-main-color-btn').click();
  const colorPicker = page.getByTestId('collective-color-picker-card');
  await colorPicker.getByTestId('collective-color-picker-options-btn').first().click();
  await page.getByTestId('collective-color-picker-save-btn').click();
  await expect(colorPicker).toHaveCount(0);

  await page.getByTestId('edit-collective-display-features').getByTestId('edit-cover-btn').click();
  await page.getByTestId('heroBackgroundDropzone').setInputFiles(path.join(files, 'gopherBack.png'));
  await expect(page.getByTestId('collective-background-image-styledBackground').locator('img')).toHaveAttribute(
    'src',
    /.+/,
  );
  await page.getByTestId('heroBackgroundDropzoneSave').click();
  await expect(page.getByTestId('heroBackgroundDropzoneSave')).toHaveCount(0);

  // The logo, the cover (in a mask) and the color (a tint) are hard to tell apart on the page: read the saved
  // account instead.
  const { account } = await queryAs<{
    account: {
      imageUrl: string | null;
      backgroundImageUrl: string | null;
      settings: { collectivePage?: { primaryColor?: string } };
    };
  }>(
    scenario.actors.admin,
    'query CollectiveLook($slug: String) { account(slug: $slug) { imageUrl backgroundImageUrl settings } }',
    { slug: scenario.accounts.collective.slug },
  );
  expect(account.imageUrl).toBeTruthy();
  expect(account.backgroundImageUrl).toBeTruthy();
  expect(account.settings.collectivePage?.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
});

test('admin publishes an update from the Collective page and finds it in the updates list', async ({
  page,
  scenario,
}) => {
  await page.goto(scenario.urls.collective);
  await page.getByTestId('create-new-update-btn').click();
  await page.getByTestId('update-title').fill('Sample Update');
  await page.getByTestId('update-content-editor').locator('trix-editor').fill('Hello World');
  await page.getByTestId('update-publish-btn').click();
  await expect(page).toHaveURL(new RegExp(`/${scenario.accounts.collective.slug}/updates/`));

  await page.goto(scenario.urls.collective);
  await page.getByTestId('view-all-updates-btn').click();
  await expect(page.getByTestId('updatesList')).toHaveCount(1);
  await expect(page.getByTestId('updatesList')).toContainText('Sample Update');
});

test('admin writes a rich description with a video', async ({ page, scenario }) => {
  await page.goto(scenario.urls.collective);
  const about = page.locator('#section-about');
  await about.getByRole('button', { name: 'Add description' }).click();

  await typeInBold(about.getByTestId('RichTextEditor').locator('trix-editor'), 'Hello world!');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await about.getByTestId('RichTextEditor').locator('button[data-trix-action=x-video-dialog-open]').click();
  await page.locator('input[name="video-url"]').fill('https://www.youtube.com/watch?v=2oyhlad64-s');
  await page.getByTestId('add-video-submit').click();
  await page.getByTestId('InlineEditField-Btn-Save').click();

  const description = page.getByTestId('longDescription');
  const expectSaved = async () => {
    await expect(description.locator('strong').first()).toContainText('Hello world!');
    await expect(description.locator('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/2oyhlad64-s?showinfo=0',
    );
  };
  await expectSaved();
  await page.reload();
  await expectSaved();
});

test.describe('Collective in euros with financial activity', () => {
  test.use({
    actor: null,
    inputs: { currency: 'EUR', organization: true, history: { contribution: 1000, expense: 500 } },
  });

  test('visitor reads the contributors and the budget of the Collective', async ({ page, scenario: graph }) => {
    const scenario = graph as CollectiveScenario;
    const { organization } = scenario.accounts;
    await page.goto(scenario.urls.collective);

    // The Organization contributed €10 and the admin is a core contributor: both kinds can be filtered.
    const filters = page.getByTestId('Contributors').getByTestId('filters');
    await expect(filters.getByTestId('filter-button all')).toBeVisible();
    await expect(filters.getByTestId('filter-button core')).toBeVisible();
    await expect(filters.getByTestId('filter-button financial')).toBeVisible();
    await expect(
      page
        .getByTestId('ContributorsGrid_ContributorCard')
        .filter({ has: page.locator(`a[href="/${organization.slug}"]`) }),
    ).toContainText('€10 EUR');

    // The latest transaction is the contribution received.
    const budget = page.getByTestId('section-budget');
    const latest = budget.getByTestId('transaction-item').getByTestId('transaction-amount').first();
    await expect(latest.getByTestId('transaction-sign')).toHaveText('+');
    await expect(latest).toContainText('€10.00');

    await budget.getByTestId('filter-button expenses').click();
    await expect(budget.getByTestId('view-all-expenses-link')).toBeVisible();
    await budget.getByTestId('filter-button transactions').click();
    await expect(budget.getByTestId('view-all-transactions-link')).toBeVisible();
  });
});
