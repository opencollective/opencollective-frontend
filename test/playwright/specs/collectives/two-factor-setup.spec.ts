import { generateSync } from 'otplib';

import { expect, scenarioTest } from '../../fixtures';

// A user without two-factor authentication, in their security settings.
const test = scenarioTest('collective-admin', { inputs: {}, actor: 'admin' });

test('user adds an authenticator app, refusing a wrong code first', async ({ page, scenario }) => {
  await page.goto(scenario.urls.userSecurity);
  await page.getByRole('button', { name: 'Add authenticator' }).click();
  await expect(page.getByTestId('qr-code')).toBeVisible();
  const secret = (await page.getByTestId('manual-entry-2fa-token').textContent()).trim();

  const code = page.getByTestId('add-two-factor-auth-totp-code-field');
  await code.fill('123456');
  await page.getByTestId('add-two-factor-auth-totp-code-button').click();
  await expect(page.getByTestId('InputField-twoFactorAuthenticatorCode')).toContainText('Invalid code');

  // The code of the authenticator app holding the secret is accepted.
  await code.fill(generateSync({ secret, algorithm: 'sha1', strategy: 'totp' }));
  await page.getByTestId('add-two-factor-auth-totp-code-button').click();
  await expect(page.getByTestId('recovery-codes-container').locator('> *')).toHaveCount(6);
  await page.getByTestId('add-two-factor-auth-confirm-recovery-codes-button').click();
  await page.getByTestId('confirmation-modal-continue').click();
  await expect(page.getByTestId('authenticator-2fa-method')).toBeVisible();
});
