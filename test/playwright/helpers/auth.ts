import { expect, type Page } from '@playwright/test';
import { generateSecret, generateSync } from 'otplib';

/**
 * A new authenticator-app secret, in the shape the product stores (64 bytes, base32). Pass it to a recipe's
 * `twoFactorSecret` and compute codes from it with `totpCode`, as the user's authenticator app would.
 */
export const newTotpSecret = () => generateSecret({ length: 64 });

/** The current code of the authenticator app holding `secret`. */
export const totpCode = (secret: string) => generateSync({ secret, algorithm: 'sha1', strategy: 'totp' });

/** Answers the two-factor authentication prompt with an authenticator code. */
export async function completeTwoFactorPrompt(page: Page, code: string) {
  await page.locator('[id="2fa-code-input"]').fill(code);
  await page.getByRole('button', { name: 'Verify' }).click();
}

/** Submits the sign-in form with an email address (a password form or a redirect follows). */
export async function submitSignInEmail(page: Page, email: string) {
  await page.locator('input[name=email]').fill(email);
  await page.getByTestId('signin-btn').click();
}

/**
 * The top bar shows a signed-in user; with `email`, the profile menu shows it's this one.
 * The menu is closed again afterwards.
 */
export async function expectSignedIn(page: Page, email?: string) {
  const trigger = page.getByTestId('user-menu-trigger');
  await expect(trigger).toBeVisible();
  if (email) {
    await trigger.click();
    await expect(page.getByTestId('user-menu')).toContainText(email);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('user-menu')).toBeHidden();
  }
}
