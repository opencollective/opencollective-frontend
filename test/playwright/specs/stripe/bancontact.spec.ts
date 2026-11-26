import { randomUUID } from 'crypto';

import type { Page } from '@playwright/test';

import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import {
  chooseNewPaymentMethod,
  choosePaymentMethodType,
  contributionOnSuccessPage,
  expectContributionStatus,
  goToPaymentStep,
} from '../../helpers/stripe';

const test = scenarioTest('stripe-contribution', { inputs: { host: 'e2e-eur-host' }, actor: null });

/** Pays by Bancontact: Stripe redirects to its test authorization page, which comes back to the flow. */
async function payWithBancontact(page: Page, name?: string) {
  const element = await chooseNewPaymentMethod(page);
  await choosePaymentMethodType(element, 'bancontact');
  if (name) {
    await element.locator('#payment-nameInput').fill(name);
  }
  await page.getByTestId('cf-next-step').click();
  await page.getByRole('link', { name: 'Authorize Test Payment' }).click();
}

test.describe('Contribute with Bancontact (Stripe Payment Element)', { tag: STRIPE_TAG }, () => {
  test('guest authorizes a Bancontact payment and the contribution is paid', async ({ page, scenario }) => {
    await goToPaymentStep(page, scenario.urls.donate, `guest-${randomUUID().slice(0, 12)}@guest.com`);
    await payWithBancontact(page, 'guest user');
    const contribution = await contributionOnSuccessPage(page);
    await expectContributionStatus(scenario.actors.collectiveAdmin, contribution, /^PAID$/);

    await page.goto(scenario.urls.orders);
    const listed = page.getByTestId('order-PAID').first();
    await expect(listed).toContainText(`Financial contribution to ${scenario.accounts.collective.name}`);
    await expect(listed).toContainText('Paid');
  });

  test.describe('signed in', () => {
    test.use({ actor: 'contributor' });

    test('user authorizes a Bancontact payment and the contribution is paid', async ({ page, scenario }) => {
      await goToPaymentStep(page, scenario.urls.donate);
      await payWithBancontact(page);
      const contribution = await contributionOnSuccessPage(page);
      await expectContributionStatus(scenario.actors.collectiveAdmin, contribution, /^PAID$/);

      await page.goto(scenario.urls.orders);
      const listed = page.getByTestId('order-PAID').first();
      await expect(listed).toContainText(`Financial contribution to ${scenario.accounts.collective.name}`);
      await expect(listed).toContainText('Paid');
    });
  });
});
