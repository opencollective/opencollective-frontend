import { expect, test } from '@playwright/test';

/**
 * Fresh-environment smoke (ticket 02).
 *
 * One independent Chromium journey through the real frontend/API/database.
 * No mutable prerequisites, no inbox cleanup, no shared session: safe to run
 * alone, in any order, and concurrently with future independent journeys.
 *
 * Mirrors the fastest Cypress coverage (00-i18n, ~2s) to prove the launcher,
 * semantic readiness, and browser contract without importing Cypress helpers.
 */
test.describe('Playwright smoke', () => {
  test('homepage loads and switches language', async ({ page }) => {
    await page.goto('/');

    // Real frontend + API/database: homepage renders and language control is ready.
    await expect(page.getByTestId('language-switcher')).toBeVisible();

    await page.getByTestId('language-switcher').click();
    await page.getByTestId('language-option').filter({ hasText: 'French' }).click();

    // `Collectif` is the French translation of `Collective` and does not exist
    // in English, so it proves the locale switch applied (same oracle as Cypress).
    await expect(page.getByText('Collectif').first()).toBeVisible();
  });
});
