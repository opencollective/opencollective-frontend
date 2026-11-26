import type { Page } from '@playwright/test';
import { test as visitorTest } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { emailChangeConfirmation } from '../../helpers/mail';
import { expectConfirmEmailCounted, resetConfirmEmailRateLimit } from '../../helpers/rate-limits';

const test = scenarioTest('individual', { inputs: { otherUser: true }, actor: 'user' });

const emailForm = (page: Page) => page.getByTestId('EditUserEmailForm');

test('user changes their email from the advanced settings and confirms it from the emailed link', async ({
  page,
  scenario,
  mail,
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
  await page.goto(message.link);
  await expect(page.getByText('Your email has been changed')).toBeVisible();
  await expectConfirmEmailCounted();
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
