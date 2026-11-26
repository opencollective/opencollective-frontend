import type { Page } from '@playwright/test';

import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import type { StripeContributionScenario } from '../../fixtures/transport';
import { attemptTag } from '../../helpers/attempt';
import { toast } from '../../helpers/notifications';
import {
  completeThreeDSecure,
  contribute,
  contributionOnSuccessPage,
  expectContributionStatus,
  fillCardElement,
  newCardElement,
  stripeElement,
  TEST_CARDS,
} from '../../helpers/stripe';

/**
 * Card contributions on a host that did not opt in to the Stripe Payment Element (`opensource`): the payment
 * step shows Stripe's card element, live in test mode. The payments are synchronous: the success page is the
 * outcome, no webhook decides it.
 */
const test = scenarioTest('stripe-contribution', { inputs: { host: 'opensource' }, actor: 'contributor' });

/** Goes from the details step (already open) through the profile step, filling the legal name when asked. */
async function goThroughProfile(page: Page, legalName?: string) {
  await page.getByTestId('cf-next-step').click();
  await expect(page.getByText('Contribute as')).toBeVisible();
  if (legalName) {
    await page.getByTestId('input-legalName').fill(legalName);
  }
  await page.getByTestId('cf-next-step').click();
  await expect(page.getByTestId('PaymentMethodList')).toBeVisible();
}

const submit = (page: Page, label: string) => page.getByTestId('cf-next-step').filter({ hasText: label });
const success = (page: Page) => page.getByTestId('order-success');

test.describe('Contribute with a card (Stripe card element)', { tag: STRIPE_TAG }, () => {
  test('new user contributes a custom yearly amount with a new card, then again with the card it saved', async ({
    page,
    scenario,
  }) => {
    const { collective } = scenario.accounts;
    await page.goto(scenario.urls.donate);
    await page.getByTestId('amount-picker-btn-other').click();
    await page.locator('input[name=custom-amount]').fill('1337');
    await page.locator('#interval button', { hasText: 'Yearly' }).click();
    await expect(page.getByTestId('progress-step-details')).toContainText('$1,337.00 USD / yr.');
    await goThroughProfile(page, 'Very Legal Name');

    // A first payment method: the card form, saved for later unless unchecked
    const card = await newCardElement(page);
    await expect(page.locator('input[type=checkbox][name=save]')).toBeChecked();

    // An incomplete card is refused before anything is sent
    await fillCardElement(card, '4242', { complete: false });
    await submit(page, 'Contribute $1,337').click();
    await expect(page.getByText('Credit card ZIP code and CVC are required')).toBeVisible();

    await fillCardElement(card);
    const first = await contribute(page);
    await expect(success(page)).toContainText('$1,337.00 USD / year');
    await expect(success(page)).toContainText(`You are now supporting ${collective.name}.`);
    await expectContributionStatus(scenario.actors.collectiveAdmin, first, /^ACTIVE$/);

    // Back on the payment step, the saved card comes first and is picked
    await page.goBack();
    const savedCard = page.locator('#PaymentMethod label').first();
    await expect(savedCard).toContainText('VISA ****');
    await expect(savedCard.locator('input[type=radio]')).toBeChecked();
    const second = await contribute(page);
    expect(second).not.toBe(first);
    await expectContributionStatus(scenario.actors.collectiveAdmin, second, /^ACTIVE$/);
  });

  test('new user contributes as an Organization created in the flow', async ({ page, scenario }) => {
    const organizationName = `Organization ${attemptTag(scenario.attempt)}`;
    await page.goto(scenario.urls.donate);
    await page.locator('#amount button', { hasText: '$20' }).click();
    await page.getByTestId('cf-next-step').click();

    await page.getByTestId('contribute-profile-picker').click();
    // An entry of the picker that opens a form rather than being picked: aria-disabled, but clickable
    await page.getByTestId('select-option').filter({ hasText: 'Create Organization' }).click({ force: true });
    const form = page.getByTestId('create-collective-mini-form');
    await form.locator('input[name=name]').fill(organizationName);
    await form.locator('input[name=website]').fill('https://example.com');
    await form.locator('button[type=submit]').click();
    await expect(page.getByTestId('contribute-profile-picker')).toContainText(organizationName);
    await expect(page.getByTestId('progress-step-profile')).toContainText(organizationName);

    await page.getByTestId('cf-next-step').click();
    await fillCardElement(await newCardElement(page));
    await expect(submit(page, 'Contribute $20')).toBeVisible();
    await contribute(page);
    await expect(success(page)).toContainText('$20.00 USD');
    await expect(success(page)).toContainText(`You are now supporting ${scenario.accounts.collective.name}.`);
  });

  test('a declined card shows the error from Stripe', async ({ page, scenario }) => {
    await page.goto(scenario.urls.donate);
    await goThroughProfile(page);
    await fillCardElement(await newCardElement(page), TEST_CARDS.declined);
    await page.getByTestId('cf-next-step').click();
    await expect(page.getByTestId('contribution-flow-error')).toContainText('Your card was declined.');
  });

  test('a card asking for 3D Secure is charged once authenticated, not when authentication fails', async ({
    page,
    scenario,
  }) => {
    // Amount and interval forced by the URL
    await page.goto(`${scenario.urls.donate}/42/year`);
    await goThroughProfile(page);
    await expect(page.getByTestId('progress-step-details')).toContainText('$42.00 USD / yr.');
    const card = await newCardElement(page);
    await fillCardElement(card, TEST_CARDS.threeDSecure);

    await submit(page, 'Contribute $42').click();
    await completeThreeDSecure(page, false);
    await expect(page.getByText('We are unable to authenticate your payment method.')).toBeVisible({
      timeout: 30_000,
    });

    // A new card token: the failed one cannot be used again
    await fillCardElement(card, TEST_CARDS.threeDSecure);
    await submit(page, 'Contribute $42').click();
    await completeThreeDSecure(page, true);
    const contribution = await contributionOnSuccessPage(page);
    await expect(success(page)).toContainText('$42.00 USD / year');
    await expect(success(page)).toContainText(`You are now supporting ${scenario.accounts.collective.name}.`);
    await expectContributionStatus(scenario.actors.collectiveAdmin, contribution, /^ACTIVE$/);
  });

  test('a contribution waiting for 3D Secure is confirmed on its confirmation page', async ({ page, scenario }) => {
    // What the email asking to confirm a payment links to, when a recurring charge needs authentication
    await page.goto(scenario.urls.donate);
    await goThroughProfile(page);
    await fillCardElement(await newCardElement(page), TEST_CARDS.alwaysAuthenticate);
    const created = page.waitForResponse(
      response =>
        response.url().includes('/api/graphql/v2') && response.request().postData()?.includes('"CreateOrder"'),
    );
    await submit(page, 'Contribute $20').click();
    const { data } = await (await created).json();
    const orderId = data.createOrder.order.legacyId;

    // Leave the flow without authenticating, then confirm from the dedicated page
    await page.goto(`/orders/${orderId}/confirm`);
    await completeThreeDSecure(page, true);
    await expect(
      page.getByText('Your payment method has now been confirmed and the payment successfully went through'),
    ).toBeVisible({ timeout: 60_000 });
  });

  test.describe('tier', () => {
    test.use({ inputs: { host: 'opensource', sponsorsTier: true } });

    test('new user contributes to a monthly tier, giving the address a large amount needs', async ({
      page,
      scenario: graph,
    }) => {
      const scenario = graph as StripeContributionScenario;
      const { sponsors } = scenario.tiers;
      const { collective } = scenario.accounts;
      await page.goto(`${scenario.urls.contribute}/${sponsors.slug}-${sponsors.legacyId}/checkout`);
      await page.locator('#amount button', { hasText: '$500' }).click();
      await expect(page.getByTestId('progress-step-details')).toContainText('$500.00 USD / mo.');
      await page.getByTestId('cf-next-step').click();

      await expect(page.getByTestId('progress-step-profile')).toContainText(scenario.actors.contributor.name);
      // The address section shows once the contributor's yearly total is known, and the form renders again then
      await page.getByTestId('country-select').click();
      await page.getByTestId('select-option').filter({ hasText: 'Algeria' }).click();
      await page.locator('input[data-cy="address-address1"]').fill('Street Name, 123');
      await page.locator('input[data-cy="address-postalCode"]').fill('123');
      await page.locator('input[data-cy="address-city"]').fill('Citycitycity');
      const legalName = page.getByTestId('input-legalName');
      await legalName.fill('Very Legal Name');
      await expect(legalName).toHaveValue('Very Legal Name');
      await page.getByTestId('cf-next-step').click();

      await expect(page.locator('input[type=checkbox][name=save]')).toBeChecked();
      await fillCardElement(await newCardElement(page));
      await expect(submit(page, 'Contribute $500')).toBeVisible();
      await contribute(page);
      await expect(success(page)).toContainText('$500.00 USD / month');
      await expect(success(page)).toContainText(`You are now supporting ${collective.name}.`);
      await expect(success(page)).toContainText(`${collective.name} - ${sponsors.name}`);
    });
  });

  test.describe('Organization', () => {
    test.use({ inputs: { host: 'opensource', sponsorsTier: true, contributorOrganization: true } });

    test('Organization admin saves a card for it, then contributes to a tier as the Organization with that card', async ({
      page,
      scenario: graph,
    }) => {
      const scenario = graph as StripeContributionScenario;
      const { sponsors } = scenario.tiers;
      const { organization, collective } = scenario.accounts;

      // A card of the Organization, added from its dashboard
      await page.goto(`/dashboard/${organization.slug}/payment-methods`);
      await page.getByTestId('add-credit-card-button').click();
      await fillCardElement(stripeElement(page.getByRole('dialog')));
      await page.getByTestId('save-credit-card-button').click();
      await expect(toast(page, 'Your payment method has been successfully added.')).toBeVisible({ timeout: 60_000 });

      await page.goto(`${scenario.urls.contribute}/${sponsors.slug}-${sponsors.legacyId}/checkout`);
      await page.locator('#amount button', { hasText: '$100' }).click();
      await page.getByTestId('cf-next-step').click();
      await page.getByTestId('contribute-profile-picker').click();
      // Long names are cut short in the picker: find it by its handle
      await page
        .getByTestId('select-option')
        .filter({ hasText: `@${organization.slug}` })
        .click();
      await page.getByTestId('input-legalName').fill('Very Legal Organization');
      await page.getByTestId('cf-next-step').click();

      await page.getByTestId('PaymentMethodList').getByText('VISA **** 4242').click();
      await expect(submit(page, 'Contribute $100')).toBeVisible();
      await contribute(page);
      await expect(success(page)).toContainText('$100.00 USD / month');
      await expect(success(page)).toContainText(`You are now supporting ${collective.name}.`);
      await expect(success(page)).toContainText(`${collective.name} - ${sponsors.name}`);
    });
  });
});
