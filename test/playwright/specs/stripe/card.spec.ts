import { randomUUID } from 'crypto';

import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import { isolationProbe } from '../../helpers/attempt';
import {
  chooseNewPaymentMethod,
  contribute,
  expectContributionStatus,
  fillTestCard,
  goToPaymentStep,
  submitPaymentStep,
} from '../../helpers/stripe';

const test = scenarioTest('stripe-contribution', { inputs: { host: 'e2e-host' }, actor: null });

/** A unique address of a guest contributor, never a real inbox. */
const guestEmail = () => `guest-${randomUUID().slice(0, 12)}@guest.com`;

test.describe('Contribute with a card (Stripe Payment Element)', { tag: STRIPE_TAG }, () => {
  test('guest pays with a new card and the contribution is recorded as completed', async ({ page, scenario }) => {
    await goToPaymentStep(page, scenario.urls.donate, guestEmail());
    await fillTestCard(await chooseNewPaymentMethod(page));
    const contribution = await contribute(page);
    await expectContributionStatus(scenario.actors.collectiveAdmin, contribution, /^PAID$/);

    await page.goto(scenario.urls.transactions);
    const transaction = page.getByTestId('transaction-item').first();
    // The title is cut short: the credit line names both parties in full
    await expect(transaction).toContainText('Financial contribution to');
    await expect(transaction).toContainText(`Credit from Guest to ${scenario.accounts.collective.name}`);
    await expect(transaction).toContainText('Completed');
  });

  test.describe('signed in', () => {
    test.use({ actor: 'contributor' });

    test('user pays with a new card, then again with the card saved by the first payment', async ({
      page,
      scenario,
    }, testInfo) => {
      await goToPaymentStep(page, scenario.urls.donate);
      await fillTestCard(await chooseNewPaymentMethod(page));
      await expectContributionStatus(scenario.actors.collectiveAdmin, await contribute(page), /^PAID$/);
      isolationProbe(
        testInfo,
        'leave a paid contribution, a Stripe customer and a saved card behind; the retry pays from a new contributor',
      );

      const saved = page.getByTestId('PaymentMethodList').getByText('VISA **** 4242');
      await goToPaymentStep(page, scenario.urls.donate);
      await saved.click();
      await expectContributionStatus(scenario.actors.collectiveAdmin, await contribute(page), /^PAID$/);

      await page.goto(scenario.urls.orders);
      await expect(page.getByTestId('order-PAID')).toHaveCount(2);
      await page.goto(scenario.urls.transactions);
      await expect(page.getByTestId('transaction-item')).toHaveCount(2);
    });
  });
});

test.describe('Redirect after a card contribution', { tag: STRIPE_TAG }, () => {
  test.use({ inputs: { host: 'e2e-eur-host' } });

  test.beforeEach(async ({ page }) => {
    // The destinations are outside the product: answer them locally instead of loading the real sites.
    for (const origin of ['https://opencollective.com', 'https://google.com']) {
      await page.route(`${origin}/**`, route => route.fulfill({ contentType: 'text/html', body: '<p>Arrived</p>' }));
    }
  });

  test('goes to a trusted redirect URL once paid', async ({ page, scenario }) => {
    await goToPaymentStep(page, `${scenario.urls.donate}?redirect=https://opencollective.com`, guestEmail());
    await fillTestCard(await chooseNewPaymentMethod(page));
    await submitPaymentStep(page, async () => new URL(page.url()).origin === 'https://opencollective.com');
  });

  test('warns before leaving for an untrusted redirect URL once paid', async ({ page, scenario, baseURL }) => {
    await goToPaymentStep(page, `${scenario.urls.donate}?redirect=https://google.com`, guestEmail());
    await fillTestCard(await chooseNewPaymentMethod(page));
    await submitPaymentStep(page, async () => new URL(page.url()).pathname === '/external-redirect');
    expect(new URL(page.url()).origin).toBe(new URL(baseURL).origin);
    await expect(page.getByText('Your request is currently being redirected to https://google.com')).toBeVisible();
  });
});
