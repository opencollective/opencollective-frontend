import { expect, test as visitor } from '@playwright/test';

import { test as signedIn } from '../../fixtures';

const missingSlug = 'a-collective-that-does-not-exist';

visitor('logged-out visitor of a missing page is offered to search for it', async ({ page }) => {
  await page.goto(`/${missingSlug}`);
  await expect(page.getByTestId('not-found')).toContainText('Page not found');
  const search = page.getByRole('link', { name: `Search for ${missingSlug}` });
  await search.click();
  await expect(page).toHaveURL(`/search?q=${missingSlug}`);
});

// The recipe's Account is unused: only its signed-in user matters.
signedIn('signed-in user stays signed in on a missing page', async ({ page, scenario }) => {
  await page.goto(`/${missingSlug}`);
  await expect(page.getByTestId('not-found')).toContainText('Page not found');
  await page.getByTestId('user-menu-trigger').click();
  await expect(page.getByTestId('user-menu')).toContainText(scenario.user.email);
});
