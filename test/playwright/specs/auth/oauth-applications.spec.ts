import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import type { IndividualScenario } from '../../fixtures/transport';
import { completeTwoFactorPrompt, newTotpSecret, totpCode } from '../../helpers/auth';
import { toast } from '../../helpers/notifications';

const test = scenarioTest('individual', { inputs: {}, actor: 'user' });

/** Fills the new-application form and submits it; a 2FA prompt or the new app's settings follow. */
async function submitNewApp(page: Page, { name, redirectUri }: { name: string; redirectUri: string }) {
  await page.getByTestId('create-app-btn').click();
  const modal = page.getByTestId('create-oauth-app-modal');
  await modal.locator('input[name=name]').fill(name);
  await modal.locator('textarea[name=description]').fill('A very accurate description');
  await modal.locator('input[name=redirectUri]').fill(redirectUri);
  await modal.locator('button[type=submit]').click();
}

/** Back from an app's settings to the list, which shows `name`. */
async function backToList(page: Page, name: string) {
  await page.getByTestId('go-back-link').click();
  await expect(page.getByTestId('oauth-apps-list')).toContainText(name);
}

const openSettings = (page: Page, name: string) =>
  page.getByTestId('oauth-app').filter({ hasText: name }).getByRole('link', { name: 'Settings' }).click();

test('developer creates, edits and lists OAuth applications, and reveals the client secret', async ({
  page,
  scenario,
}) => {
  await page.goto(scenario.urls.forDevelopers);
  await expect(page.getByTestId('oauth-apps-list')).toContainText("You don't have any apps yet");

  await submitNewApp(page, { name: 'My first App', redirectUri: 'https://example.com/callback' });
  await expect(toast(page, 'Application "My first App" created')).toBeVisible();
  await expect(page.getByTestId('oauth-app-settings').locator('h3')).toHaveText('My first App');
  await backToList(page, 'My first App');

  await openSettings(page, 'My first App');
  const settings = page.getByTestId('oauth-app-settings');
  await settings.locator('input[name=name]').fill('My first App (edited)');
  await settings.locator('textarea[name=description]').fill('A very accurate description (edited)');
  await settings.locator('input[name=redirectUri]').fill('https://example2.com/callback');
  await settings.locator('button[type=submit]').click();
  await expect(toast(page, 'Application "My first App (edited)" updated')).toBeVisible();
  await backToList(page, 'My first App (edited)');

  await submitNewApp(page, { name: 'My second App', redirectUri: 'http://localhost:3000/pricing' });
  await expect(toast(page, 'Application "My second App" created')).toBeVisible();
  await page.getByTestId('go-back-link').click();
  // Newest first
  const apps = page.getByTestId('oauth-app');
  await expect(apps).toHaveCount(2);
  await expect(apps.first()).toContainText('My second App');
  await expect(apps.last()).toContainText('My first App (edited)');

  await openSettings(page, 'My second App');
  await expect(page.getByTestId('oauth-app-client-id')).not.toBeEmpty();
  await expect(page.getByTestId('unhidden-secret')).toHaveCount(0);
  await page.getByTestId('show-secret-btn').click();
  await expect(page.getByTestId('unhidden-secret')).not.toBeEmpty();
});

test.describe('with two-factor authentication', () => {
  const secret = newTotpSecret();
  test.use({ inputs: { twoFactorSecret: secret } });

  test('creating an application asks for the authenticator code', async ({ page, scenario }) => {
    const name = 'My App created with 2FA enabled';
    await page.goto(scenario.urls.forDevelopers);
    await submitNewApp(page, { name, redirectUri: 'https://example.com/callback' });
    await completeTwoFactorPrompt(page, totpCode(secret));
    await expect(toast(page, `Application "${name}" created`)).toBeVisible();
    await expect(page.getByTestId('oauth-app-settings').locator('h3')).toHaveText(name);
    await backToList(page, name);
  });
});

/**
 * The application's own callback, on its own server: the browser gets a stub page there. Cypress used the
 * platform's /pricing page instead. Leaving that page while it still prefetched other routes left the authorized
 * apps section opened next on a loading state that never ended, in 2 of ~10 runs and 8 of 12 repeated attempts;
 * the section's GraphQL query was never sent.
 */
const CALLBACK = 'https://oauth-client.example/callback';

test.describe('with an OAuth application', () => {
  test.use({ inputs: { oauthApplication: { name: 'Playwright OAuth client', redirectUri: CALLBACK } } });

  test('user authorizes an application, which gets a token, then revokes it from the dashboard', async ({
    page,
    scenario: graph,
    baseURL,
  }) => {
    const scenario = graph as IndividualScenario;
    const { application } = scenario;
    await page.route(`${CALLBACK}?*`, route =>
      route.fulfill({ contentType: 'text/html', body: '<p>Playwright OAuth client: callback received</p>' }),
    );
    await page.goto(`/oauth/authorize?client_id=${application.clientId}&response_type=code&state=hello_world`);
    await expect(page.getByText(application.name).first()).toBeVisible();
    await page.getByRole('button', { name: 'Authorize' }).click();

    // Redirected to the application's callback with a code and the state it passed
    await expect(page).toHaveURL(url => url.href.startsWith(`${CALLBACK}?`));
    await expect(page.getByText('callback received')).toBeVisible();
    const callback = new URL(page.url());
    expect(callback.searchParams.get('state')).toBe('hello_world');
    const code = callback.searchParams.get('code');
    expect(code).toHaveLength(64);

    // The application, a server of its own, exchanges the code for a token
    const response = await fetch(new URL('/api/oauth/token', baseURL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        /* eslint-disable camelcase */
        grant_type: 'authorization_code',
        code,
        client_id: application.clientId,
        client_secret: application.clientSecret,
        redirect_uri: CALLBACK,
        /* eslint-enable camelcase */
      }),
      signal: AbortSignal.timeout(30_000),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty('access_token');

    await page.goto(scenario.urls.authorizedApps);
    const connected = page.getByTestId('connected-oauth-app');
    await expect(connected).toHaveCount(1);
    await expect(connected).toContainText(application.name);
    await page.getByTestId('oauth-app-revoke-btn').click();
    await expect(toast(page, `Authorization for ${application.name} revoked`)).toBeVisible();
    await expect(connected).toHaveCount(0);
    await expect(page.getByText('No Authorized App yet')).toBeVisible();
  });
});
