import { readFileSync } from 'fs';
import path from 'path';

import { expect, type Page, type Route, test } from '@playwright/test';

import { toast } from '../../helpers/notifications';

/**
 * The help page searches the external docs index through the frontend's `/api/docs/search` route. As in Cypress,
 * that route is stubbed in the browser: the journeys never reach the docs index.
 */
const searchResults = readFileSync(path.join(__dirname, '../../fixtures/files/docs-search-results.json'), 'utf8');

/** Searches "collective" from the help page, answering the docs search with `answer`; returns the results popup. */
async function searchDocs(page: Page, answer: (route: Route) => Promise<void>) {
  const searched = new Promise<void>(resolve =>
    page.route('/api/docs/search?*', async route => {
      await answer(route);
      resolve();
    }),
  );
  await page.goto('/help');
  const input = page.getByTestId('search-input').locator('input');
  await input.click();
  const popup = page.getByTestId('search-result-popup');
  await expect(popup).toContainText('Type something to search');
  await input.fill('collective');
  await searched;
  return popup;
}

test('visitor searches the docs from the help page and gets the matching sections', async ({ page }) => {
  const popup = await searchDocs(page, route =>
    route.fulfill({ contentType: 'application/json', body: searchResults }),
  );
  await expect(popup.getByTestId('search-result-link')).toHaveCount(10);
});

test('visitor is told when the docs have nothing for the search', async ({ page }) => {
  const popup = await searchDocs(page, route => route.fulfill({ json: { items: [] } }));
  await expect(popup).toContainText('No results found for collective. Please type another keyword.');
  await expect(popup.getByTestId('search-result-link')).toHaveCount(0);
});

test('visitor is told when the docs search fails', async ({ page }) => {
  const popup = await searchDocs(page, route => route.abort('failed'));
  await expect(toast(page, 'Oops! There was an unexpected error.')).toHaveAttribute('data-variant', 'error');
  await expect(popup).toContainText('No results found for collective. Please type another keyword.');
  await expect(popup.getByTestId('search-result-link')).toHaveCount(0);
});
