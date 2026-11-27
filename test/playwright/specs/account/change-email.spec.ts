import type { Page } from '@playwright/test';
import { test as visitorTest } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { expectSignedIn, submitSignInEmail } from '../../helpers/auth';
import { emailChangeConfirmation, emailedSignInLink } from '../../helpers/mail';
import { expectConfirmEmailCounted, resetConfirmEmailRateLimit } from '../../helpers/rate-limits';

const test = scenarioTest('individual', { inputs: { otherUser: true }, actor: 'user' });

const emailForm = (page: Page) => page.getByTestId('EditUserEmailForm');

test('user changes their email from the advanced settings and confirms it from the emailed link', async ({
  page,
  scenario,
  mail,
  openBrowserAs,
}) => {
  const { user, other } = scenario.actors;
  const newEmail = mail.address('new-email');
  await page.goto(scenario.urls.advanced);
  const form = emailForm(page);
  const input = form.locator('input[name=email]');
  const confirm = form.getByRole('button', { name: 'Confirm new email' });
  await expect(input).toHaveValue(user.email);

  await input.fill('NotAValidEmail');
  await expect(confirm).toBeDisabled();

  await input.fill(other.email);
  await confirm.click();
  await expect(form).toContainText('A user with that email already exists');

  await input.fill(newEmail);
  await confirm.click();
  await expect(form).toContainText(`An email with a confirmation link has been sent to ${newEmail}`);
  await expect(input).toHaveValue(newEmail);

  const message = await emailChangeConfirmation(mail, { newEmail });
  expect(message.text).toContain(`We need to verify that ${newEmail} is correct by clicking this button:`);
  await resetConfirmEmailRateLimit();
  // Holds the confirmation until its loading state has been seen, so the check cannot race a fast API.
  let releaseConfirmation: () => void;
  const confirmationHeld = new Promise<void>(resolve => (releaseConfirmation = resolve));
  await page.route('**/api/graphql/v2*', async route => {
    if (route.request().postDataJSON()?.operationName === 'ConfirmEmail') {
      await confirmationHeld;
    }
    await route.fallback();
  });
  await page.goto(message.link);
  await expect(page.getByText('Validating your email address...')).toBeVisible();
  releaseConfirmation();
  await expect(page.getByText('Your email has been changed')).toBeVisible();
  await expectConfirmEmailCounted();

  // The new address now signs the same user in, from a browser without their session: they land on their own
  // advanced settings. Test addresses get the emailed link as the form's answer too, so the browser does not wait.
  const visitor = await openBrowserAs(null);
  await visitor.goto(`/signin?next=${scenario.urls.advanced}`);
  await submitSignInEmail(visitor, newEmail);
  await expect(visitor).toHaveURL(scenario.urls.advanced);
  await expectSignedIn(visitor, newEmail);
  await expect(emailForm(visitor).locator('input[name=email]')).toHaveValue(newEmail);
  const signInLink = new URL(await emailedSignInLink(mail, { to: newEmail }), 'http://site');
  expect(signInLink.searchParams.get('next')).toBe(scenario.urls.advanced);
});

test('user re-sends the confirmation of a new email', async ({ page, scenario, mail }) => {
  const newEmail = mail.address('resent');
  await page.goto(scenario.urls.advanced);
  const form = emailForm(page);
  await form.locator('input[name=email]').fill(newEmail);
  await form.getByRole('button', { name: 'Confirm new email' }).click();
  await form.getByRole('button', { name: 'Re-send confirmation' }).click();
  await mail.waitForMessageCount({ to: newEmail, subject: `Confirm your email ${newEmail}`, count: 2 });
});

visitorTest('an invalid email confirmation link is refused', async ({ page }) => {
  await resetConfirmEmailRateLimit();
  await page.goto('/confirm/email/ThisIsDefinitelyNotAValidToken');
  await expect(page.getByText('The confirmation link is invalid or has expired')).toBeVisible();
  await expectConfirmEmailCounted();
});
