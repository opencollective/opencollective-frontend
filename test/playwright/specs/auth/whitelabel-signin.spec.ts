import { expect, test } from '@playwright/test';

/**
 * The frontend knows `http://local.opencollective:3000` as a white-label domain outside production
 * (`lib/constants/whitelabel-providers.ts`); `local.crooked` is a domain it doesn't know. Both resolve to the
 * local frontend in this browser only, as Cypress's `hosts` option did, so no system DNS change is needed.
 */
test.use({
  launchOptions: { args: ['--host-resolver-rules=MAP local.opencollective 127.0.0.1, MAP local.crooked 127.0.0.1'] },
});

const port = (baseURL: string) => new URL(baseURL).port || '80';

test('sign-in page is not served on an unknown domain', async ({ page, baseURL }) => {
  await page.goto(`http://local.crooked:${port(baseURL)}/signin`);
  await expect(page.getByText('This page is not available on this domain')).toBeVisible();
});

test('platform sign-in warns about a redirection to an untrusted domain', async ({ page, baseURL }) => {
  await page.goto(`/signin?next=${encodeURIComponent(`http://local.crooked:${port(baseURL)}`)}`);
  await expect(
    page.getByText("You've been requested to log-in to Open Collective by an untrusted domain"),
  ).toBeVisible();
});

test('sign-in on a white-label domain redirects to the platform, coming back afterwards', async ({ page, baseURL }) => {
  const whitelabel = `http://local.opencollective:${port(baseURL)}`;
  await page.goto(`${whitelabel}/signin`);
  await expect(page).toHaveURL(url => url.origin === new URL(baseURL).origin && url.pathname === '/signin');
  expect(new URL(page.url()).searchParams.get('next')).toMatch(new RegExp(`^${whitelabel}/?$`));
});
