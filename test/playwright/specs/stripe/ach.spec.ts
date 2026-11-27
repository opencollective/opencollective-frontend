import { randomUUID } from 'crypto';

import type { Frame, FrameLocator, Page } from '@playwright/test';

import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import {
  chooseNewPaymentMethod,
  choosePaymentMethodType,
  contribute,
  expectContributionStatus,
  goToPaymentStep,
  stripeOverlayFrame,
} from '../../helpers/stripe';

const test = scenarioTest('stripe-contribution', { inputs: { host: 'e2e-host' }, actor: null });

/**
 * Links Stripe's test bank account ("Success" at "Test (Non-OAuth)") through the Financial Connections overlay
 * of the Payment Element. Stripe may first offer Link (sign up, or save the account), which the journey skips.
 */
async function linkTestBankAccount(page: Page, element: FrameLocator, name?: string) {
  await choosePaymentMethodType(element, 'us_bank_account');
  if (name) {
    await element.locator('#payment-nameInput').fill(name);
  }
  // Stripe may ignore a click on the bank while its search is still initializing: click until the overlay opens.
  const bank = element.getByRole('menuitem', { name: 'Test (Non-OAuth)' });
  let overlay: Frame;
  await expect(async () => {
    await bank.click();
    overlay = await stripeOverlayFrame(page, '[data-testid="agree-button"]', 10_000);
  }).toPass({ timeout: 60_000 });
  await overlay.locator('[data-testid="agree-button"]').click();
  const account = overlay.locator('[data-testid="success"]');
  const asGuest = overlay.getByRole('button', { name: 'Continue as guest' });
  await expect(account.or(asGuest).first()).toBeVisible({ timeout: 30_000 });
  if (await asGuest.isVisible()) {
    await asGuest.click();
  }
  await account.click();
  await overlay.locator('[data-testid="select-button"]').click();
  const done = overlay.locator('[data-testid="done-button"]');
  const withoutSaving = overlay.getByRole('button', { name: 'Finish without saving' });
  await expect(done.or(withoutSaving).first()).toBeVisible({ timeout: 30_000 });
  if (await withoutSaving.isVisible()) {
    await withoutSaving.click();
  }
  await done.click();
  // Back in the Payment Element, which now shows the linked account
  await expect(element.getByText('6789')).toBeVisible({ timeout: 30_000 });
}

test.describe('Contribute with a US bank account (ACH, Stripe Payment Element)', { tag: STRIPE_TAG }, () => {
  test('guest links a bank account and the contribution is processing or paid', async ({ page, scenario }) => {
    await goToPaymentStep(page, scenario.urls.donate, `guest-${randomUUID().slice(0, 12)}@guest.com`);
    await linkTestBankAccount(page, await chooseNewPaymentMethod(page), 'guest user');
    const contribution = await contribute(page);
    await expectContributionStatus(scenario.actors.collectiveAdmin, contribution, /^(PROCESSING|PAID)$/);
  });

  test.describe('signed in', () => {
    test.use({ actor: 'contributor' });

    test('user links a bank account, then contributes again with the account it saved', async ({ page, scenario }) => {
      await goToPaymentStep(page, scenario.urls.donate);
      await linkTestBankAccount(page, await chooseNewPaymentMethod(page));
      const first = await contribute(page);
      await expectContributionStatus(scenario.actors.collectiveAdmin, first, /^(PROCESSING|PAID)$/);

      // The account is saved when Stripe reports it attached to the contributor (a webhook)
      const saved = page.getByTestId('PaymentMethodList').getByText('ACH STRIPE TEST BANK ****6789');
      await expect(async () => {
        await goToPaymentStep(page, scenario.urls.donate);
        await expect(saved).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 60_000 });
      await saved.click();
      await contribute(page);
    });
  });
});
