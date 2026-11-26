import { expect, scenarioTest } from '../../fixtures';

// A Collective that has raised money: one $1 monthly contribution, charged once.
const test = scenarioTest('recurring-contribution', { inputs: {}, actor: null });

test('visitor searches for a Collective and sees what it raised', async ({ page, scenario }) => {
  const { collective } = scenario.accounts;
  await page.goto('/search');
  const banner = page.getByTestId('search-banner');
  await expect(banner.locator('form')).toHaveAttribute('action', '/search');
  // Without a search term, accounts are sorted by activity.
  await expect(page.locator('#sort-filter').locator('xpath=ancestor::*[@data-cy="select"][1]')).toContainText(
    'Activity',
  );
  const input = banner.getByPlaceholder('Search by name, handle, tag, description...');
  await input.fill(collective.slug);
  await input.press('Enter');

  await expect(page).toHaveURL(new RegExp(`[?&]q=${collective.slug}`));
  const card = page.getByTestId('collective-card').filter({ has: page.locator(`a[href="/${collective.slug}"]`) });
  await expect(card).toHaveCount(1);
  await expect(card.getByTestId('caption')).toContainText('$1 Money raised');
});
