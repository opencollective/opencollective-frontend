import type { Page } from '@playwright/test';
import { test as visitorTest } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import type { IndividualScenario } from '../../fixtures/transport';
import {
  completeTwoFactorPrompt,
  expectSignedIn,
  newTotpSecret,
  submitSignInEmail,
  totpCode,
} from '../../helpers/auth';
import { toast } from '../../helpers/notifications';

/**
 * A user who signs in through the form. Recipe emails match the API's local test-account shortcut, which
 * answers the form with the sign-in link instead of only emailing it.
 */
const test = scenarioTest('individual', { inputs: { loginTokens: true }, actor: null });

const expectTokenRejected = async (page: Page) => {
  await expect(page.getByText('Sign In failed: Token rejected.')).toBeVisible();
  await expect(page.getByText('You can ask for a new sign in link using the form below.')).toBeVisible();
  await expect(page.locator('input[name=email]')).toBeVisible();
};

test('test account signs in with the email form and lands on the requested page', async ({ page, scenario }) => {
  const { user } = scenario.actors;
  await page.goto(`/signin?next=${scenario.urls.profile}`);
  await submitSignInEmail(page, user.email);
  await expect(page.getByTestId('collective-title')).toHaveText(user.name);
  await expect(page).toHaveURL(scenario.urls.profile);
  await expectSignedIn(page, user.email);
});

test('signing in with the form on /signin?next=/signin does not loop and opens the dashboard', async ({
  page,
  scenario,
}) => {
  await page.goto('/signin?next=/signin');
  await submitSignInEmail(page, scenario.actors.user.email);
  await expect(page).toHaveURL(/\/dashboard(\/|$)/);
  await expectSignedIn(page);
});

for (const [label, encode] of [
  ['plain', (path: string) => path],
  ['URL-encoded', (path: string) => encodeURIComponent(path)],
] as const) {
  test(`a valid sign-in link signs in and redirects to a ${label} next path`, async ({ page, scenario: graph }) => {
    const scenario = graph as IndividualScenario;
    await page.goto(`/signin/${scenario.loginTokens.valid}?next=${encode(scenario.urls.profile)}`);
    await expect(page).toHaveURL(scenario.urls.profile);
    await expectSignedIn(page, scenario.actors.user.email);
  });
}

visitorTest('an invalid sign-in token is rejected and the form is offered again', async ({ page }) => {
  await page.goto('/signin?token=InvalidToken');
  await expectTokenRejected(page);
  await expect(page.getByText('Sign in or create a personal account to continue')).toBeVisible();
});

test('an expired sign-in token is rejected and the form is offered again', async ({ page, scenario: graph }) => {
  const scenario = graph as IndividualScenario;
  await page.goto(`/signin?token=${scenario.loginTokens.expired}`);
  await expectTokenRejected(page);
});

test.describe('already signed in', () => {
  test.use({ actor: 'user' });

  for (const kind of ['invalid', 'expired'] as const) {
    test(`an ${kind} token keeps the current session and follows next`, async ({ page, scenario: graph }) => {
      const scenario = graph as IndividualScenario;
      const token = kind === 'invalid' ? 'InvalidToken' : scenario.loginTokens.expired;
      await page.goto(`/signin?token=${token}&next=${scenario.urls.profile}`);
      await expect(page).toHaveURL(scenario.urls.profile);
      await expectSignedIn(page, scenario.actors.user.email);
    });
  }
});

visitorTest('the email field trims surrounding spaces and keeps the form submittable', async ({ page }) => {
  await page.goto('/signin');
  await page.locator('input[name=email]').pressSequentially('  user@opencollective.com  ');
  await expect(page.locator('input[name=email]')).toHaveValue('user@opencollective.com');
  await expect(page.locator('button[type=submit]')).toBeEnabled();
});

test.describe('with two-factor authentication', () => {
  const secret = newTotpSecret();
  test.use({ inputs: { twoFactorSecret: secret } });

  test('a wrong code is refused, then the authenticator code signs in and redirects', async ({ page, scenario }) => {
    const { user } = scenario.actors;
    await page.goto(`/signin?next=${scenario.urls.profile}`);
    await submitSignInEmail(page, user.email);
    await completeTwoFactorPrompt(page, '123456');
    await expect(toast(page, 'Two-factor authentication code failed. Please try again')).toBeVisible();
    await completeTwoFactorPrompt(page, totpCode(secret));
    await expect(page).toHaveURL(scenario.urls.profile);
    await expectSignedIn(page, user.email);
  });
});
