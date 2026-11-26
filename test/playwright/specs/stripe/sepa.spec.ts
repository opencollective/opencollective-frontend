import { randomUUID } from 'crypto';

import type { FrameLocator, Page } from '@playwright/test';

import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import {
  chooseNewPaymentMethod,
  choosePaymentMethodType,
  contribute,
  expectContributionStatus,
  goToPaymentStep,
} from '../../helpers/stripe';

const test = scenarioTest('stripe-contribution', { inputs: { host: 'e2e-eur-host' }, actor: null });

/** Stripe's test IBAN whose debits succeed. */
async function fillSepaDebit(element: FrameLocator, name?: string) {
  await choosePaymentMethodType(element, 'sepa_debit');
  await element.locator('#payment-ibanInput').fill('FR1420041010050500013M02606');
  if (name) {
    await element.locator('#payment-nameInput').fill(name);
  }
  // Stripe may show the country twice (with the IBAN and in the billing address), and shows the second one
  // depending on the first: France in every country field it shows, until they all hold
  const countries = element.locator('#payment-countryInput').filter({ visible: true });
  await expect(async () => {
    for (const country of await countries.all()) {
      await country.selectOption('FR', { timeout: 2_000 });
    }
    for (const country of await countries.all()) {
      await expect(country).toHaveValue('FR', { timeout: 2_000 });
    }
  }).toPass({ timeout: 30_000 });
  await element.locator('#payment-addressLine1Input').fill('Street');
  await element.locator('#payment-postalCodeInput').fill('01562');
  await element.locator('#payment-localityInput').fill('Paris');
}

/** The contribution is listed as paid on the Collective's contributions page. */
async function expectPaidOnContributionsPage(page: Page, url: string, collectiveName: string) {
  await page.goto(url);
  const contribution = page.getByTestId('order-PAID').first();
  await expect(contribution).toContainText(`Financial contribution to ${collectiveName}`);
  await expect(contribution).toContainText('Paid');
}

test.describe('Contribute with a SEPA debit (Stripe Payment Element)', { tag: STRIPE_TAG }, () => {
  test('guest pays by SEPA debit and the contribution is paid', async ({ page, scenario }) => {
    await goToPaymentStep(page, scenario.urls.donate, `guest-${randomUUID().slice(0, 12)}@guest.com`);
    await fillSepaDebit(await chooseNewPaymentMethod(page), 'guest user');
    const contribution = await contribute(page);
    await expectContributionStatus(scenario.actors.collectiveAdmin, contribution, /^PAID$/);
    await expectPaidOnContributionsPage(page, scenario.urls.orders, scenario.accounts.collective.name);
  });

  test.describe('signed in', () => {
    test.use({ actor: 'contributor' });

    test('user pays by SEPA debit, then contributes again with the saved mandate', async ({ page, scenario }) => {
      await goToPaymentStep(page, scenario.urls.donate);
      await fillSepaDebit(await chooseNewPaymentMethod(page));
      const first = await contribute(page);
      await expectContributionStatus(scenario.actors.collectiveAdmin, first, /^PAID$/);

      // The debit is saved when Stripe reports it attached to the contributor (a webhook)
      const saved = page.getByTestId('PaymentMethodList').getByText('SEPA 20041 ****2606');
      await expect(async () => {
        await goToPaymentStep(page, scenario.urls.donate);
        await expect(saved).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 60_000 });
      await saved.click();
      await contribute(page);
    });
  });
});
