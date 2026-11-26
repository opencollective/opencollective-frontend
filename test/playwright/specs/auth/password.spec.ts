import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import {
  completeTwoFactorPrompt,
  expectSignedIn,
  newTotpSecret,
  submitSignInEmail,
  totpCode,
} from '../../helpers/auth';
import { emailedResetPasswordLink } from '../../helpers/mail';
import { toast } from '../../helpers/notifications';

const PASSWORD = 'qwerty123456!@#amazing!';
const TOO_WEAK = 'Password is too weak. Try to use more characters or use a password manager to generate a strong one.';

const test = scenarioTest('individual', { inputs: {}, actor: 'user' });

const passwordError = (page: Page) => page.getByTestId('password-error');

/** Signs in from the sign-in form of the current page with the account's password: a wrong one first. */
async function signInWithPassword(page: Page, { email, password }: { email: string; password: string }) {
  await submitSignInEmail(page, email);
  // The form renders a hidden password field early for password managers: wait for the visible one.
  const passwordInput = page.locator('input[name="password"]:visible');
  await passwordInput.fill('WRONG');
  await page.getByTestId('signin-btn').click();
  await expect(toast(page, 'Invalid password')).toBeVisible();
  await passwordInput.fill(password);
  await page.getByTestId('signin-btn').click();
}

test('user without a password sets one from the security settings, rated as they type', async ({ page, scenario }) => {
  await page.goto(scenario.urls.userSecurity);
  await expect(
    page.getByText("Setting a password is optional but can be useful if you're using a password manager."),
  ).toBeVisible();
  const submit = page.getByRole('button', { name: 'Set Password' });
  await expect(submit).toBeDisabled();

  const input = page.locator('input#new-password');
  const strength = page.getByTestId('password-strength-bar');
  for (const [password, rating] of [
    ['.', 'too short'],
    ['12345678', 'Weak'],
    ['qwerty', 'Weak'],
    ['qwerty123456', 'Weak'],
  ]) {
    await input.fill(password);
    await expect(strength).toContainText(rating);
  }
  await submit.click();
  await expect(passwordError(page)).toContainText(TOO_WEAK);

  for (const [password, rating] of [
    ['fairPasswd', 'Fair'],
    ['g00dPasswd!', 'Good'],
    [PASSWORD, 'Strong'],
  ]) {
    await input.fill(password);
    await expect(strength).toContainText(rating);
  }
  await submit.click();
  await expect(toast(page, 'Password successfully set')).toBeVisible();
});

test.describe('with a password', () => {
  test.use({ inputs: { password: PASSWORD } });

  test('user changes their password, which must differ, be strong and follow the current one', async ({
    page,
    scenario,
  }) => {
    await page.goto(scenario.urls.userSecurity);
    const submit = page.getByRole('button', { name: 'Update Password' });
    const current = page.locator('input[name="current-password"]');
    const next = page.locator('input#new-password');
    await expect(submit).toBeDisabled();
    await current.fill('nope');
    await expect(submit).toBeDisabled();

    await next.fill('nope');
    await submit.click();
    await expect(passwordError(page)).toContainText("New password can't be the same as current password");

    await next.fill('12345678');
    await submit.click();
    await expect(passwordError(page)).toContainText(TOO_WEAK);

    await next.fill(`${PASSWORD}"edited'😊`);
    await submit.click();
    await expect(passwordError(page)).toContainText('Invalid current password');

    await current.fill(PASSWORD);
    await submit.click();
    await expect(toast(page, 'Password successfully updated')).toBeVisible();
  });

  test.describe('signed out', () => {
    test.use({ actor: null });

    test('user signs in with their password on /signin, and again from a protected page after signing out', async ({
      page,
      scenario,
    }) => {
      const { user } = scenario.actors;
      await page.goto('/signin');
      await signInWithPassword(page, { email: user.email, password: PASSWORD });
      await expect(page.getByTestId('menu-item-overview')).toBeVisible();
      await expectSignedIn(page, user.email);

      await page.getByTestId('user-menu-trigger').click();
      await page.getByTestId('logout').click();
      await expect(page.getByTestId('user-menu-trigger')).toBeHidden();

      await page.goto(scenario.urls.userSecurity);
      await signInWithPassword(page, { email: user.email, password: PASSWORD });
      await expect(page.getByRole('button', { name: 'Update Password' })).toBeVisible();
      await expectSignedIn(page, user.email);
    });

    test('user resets a forgotten password from the emailed link and is signed in', async ({
      page,
      scenario,
      mail,
    }) => {
      const { user } = scenario.actors;
      await page.goto('/signin');
      await submitSignInEmail(page, user.email);
      await page.getByTestId('signin-secondary-action-btn').filter({ hasText: 'Reset my password' }).click();
      await expect(page.getByText('Your reset password email is on its way')).toBeVisible();
      await expect(page.getByText(`We've sent it to ${user.email}`)).toBeVisible();

      await page.goto(await emailedResetPasswordLink(mail, { to: user.email }));
      const form = page.getByTestId('resetPassword-form');
      await expect(page.getByRole('heading', { level: 1, name: 'Reset Password' })).toBeVisible();
      await expect(form).toContainText(user.email);
      await expect(form).toContainText(user.name);

      const input = page.locator('input#new-password:visible');
      await input.fill('azerty123');
      await form.getByRole('button', { name: 'Continue' }).click();
      await expect(form).toContainText('Password is too weak');

      await input.fill('strongNewP@ssword<>?');
      await form.getByRole('button', { name: 'Continue' }).click();
      await expect(page.getByTestId('reset-password-success-page')).toContainText('Your password was updated.');
      await expectSignedIn(page, user.email);
    });
  });
});

test.describe('with a password and two-factor authentication', () => {
  const secret = newTotpSecret();
  test.use({ inputs: { password: PASSWORD, twoFactorSecret: secret }, actor: null });

  test('password sign-in asks for the authenticator code, refusing a wrong one', async ({ page, scenario }) => {
    const { user } = scenario.actors;
    await page.goto(`/signin?next=${scenario.urls.info}`);
    await submitSignInEmail(page, user.email);
    await page.locator('input[name="password"]:visible').fill(PASSWORD);
    await page.getByTestId('signin-btn').click();
    await completeTwoFactorPrompt(page, '123456');
    await expect(toast(page, 'Two-factor authentication code failed. Please try again')).toBeVisible();
    await completeTwoFactorPrompt(page, totpCode(secret));
    await expect(page.locator('input[name="name"]')).toHaveValue(user.name);
    await expectSignedIn(page, user.email);
  });
});
