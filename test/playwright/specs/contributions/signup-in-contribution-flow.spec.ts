import { randomUUID } from 'crypto';
import path from 'path';

import type { Locator, Page, TestInfo } from '@playwright/test';
import * as cheerio from 'cheerio';

import { expect, scenarioTest } from '../../fixtures';
import { resetSignupRateLimits } from '../../helpers/rate-limits';

// A Collective of its own to contribute to, for a visitor who is not signed in
const test = scenarioTest('contribution-flow', { inputs: {}, actor: null });

/** Attached to the report; also written to `PW_SCREENSHOTS_DIR` when set (e.g. to illustrate a pull request). */
const capture = async (page: Page, testInfo: TestInfo, name: string, target?: Locator) => {
  const body = await (target ?? page).screenshot({ animations: 'disabled' });
  await testInfo.attach(name, { body, contentType: 'image/png' });
  if (process.env.PW_SCREENSHOTS_DIR) {
    await (target ?? page).screenshot({
      path: path.join(process.env.PW_SCREENSHOTS_DIR, `${name}.png`),
      animations: 'disabled',
    });
  }
};

/**
 * A visitor creates their account from the contribution flow: the email is verified with a code shown in place
 * (REST `/api/users/signup` and `/api/users/verify-email`), so the visitor never leaves the flow and contributes
 * with the new profile, named as entered in the form.
 */
test('visitor creates an account with an emailed code without leaving the contribution flow', async ({
  page,
  scenario,
  mail,
}, testInfo) => {
  const email = mail.address('contributor');
  const suffix = randomUUID().slice(0, 8);
  const name = `Playwright Contributor ${suffix}`;
  const content = page.getByTestId('cf-content');
  await page.setViewportSize({ width: 1280, height: 900 });

  // 1. Contribution details, then the profile step
  await page.goto(scenario.urls.donate);
  await expect(page.getByTestId('cf-next-step')).toBeVisible();
  await capture(page, testInfo, '1-contribution-details');
  await page.getByTestId('cf-next-step').click();
  await page.getByTestId('cf-profile-signin-btn').click();
  await content.getByRole('button', { name: 'Create an account' }).click();

  // 2. The sign-up form, inside the flow
  await content.locator('input[name=name]').fill(name);
  await content.locator('input[name=email]').fill(email);
  await content.getByTestId('checkbox-tosOptIn').getByTestId('custom-checkbox').click();
  await capture(page, testInfo, '2-signup-form');

  // 3. A network failure shows an error and leaves the form usable
  await page.route('**/api/users/signup', route => route.abort('failed'));
  await content.locator('button[type=submit]').click();
  const toast = page.getByTestId('toast-notification').filter({ hasText: 'A network error occurred' });
  await expect(toast).toBeVisible();
  await capture(page, testInfo, '3-network-error');
  await toast.hover();
  await toast.getByTestId('dismiss-toast-btn').click();
  await expect(toast).toBeHidden();
  await page.unroute('**/api/users/signup');

  // 4. The retry goes through: the code step replaces the form, still in the flow
  await resetSignupRateLimits();
  await content.locator('button[type=submit]').click();
  const codeForm = page.getByTestId('signup-code-form');
  await expect(codeForm).toContainText(`Enter the code sent to ${email}.`);
  await expect(content.getByRole('button', { name: 'Go back to contribute as a guest' })).toBeVisible();
  await capture(page, testInfo, '4-code-step');

  // 5. The code from the email signs the visitor in
  const message = await mail.waitForMessage({ to: email, subject: 'Email Confirmation' });
  const otp = cheerio.load(message.html)('h3 > span').text().trim();
  await codeForm.locator('input[data-slot="input-otp"]').fill(otp);

  // 6. Back in the flow, contributing as the new profile, with the name and a slug derived from it
  const picker = page.getByTestId('contribute-profile-picker');
  await expect(page.getByText('Contribute as')).toBeVisible();
  await expect(picker).toContainText(name);
  await expect(picker).toContainText(`@playwright-contributor-${suffix}`);
  await expect(page).toHaveURL(new RegExp(`${scenario.urls.donate}/profile`));
  await capture(page, testInfo, '5-contribute-as-new-profile');
});
