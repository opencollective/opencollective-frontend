import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import { toast } from '../../helpers/notifications';
import { contribute, fillCardElement, fillTestCard, newCardElement, stripeElement } from '../../helpers/stripe';

/**
 * Replacing the payment method of a monthly contribution, live in Stripe test mode. The contribution is made by
 * card in the same journey (host `opensource`, Stripe's card element); the new card goes through the Stripe
 * Payment Element of the dashboard, which saves it with a setup intent.
 */
const test = scenarioTest('stripe-contribution', { inputs: { host: 'opensource' }, actor: 'contributor' });

test.describe('Payment method of a recurring contribution', { tag: STRIPE_TAG }, () => {
  test('contributor replaces the card of a monthly contribution with a new one', async ({ page, scenario }) => {
    await page.goto(scenario.urls.donate);
    await page.locator('#interval button', { hasText: 'Monthly' }).click();
    await page.getByTestId('cf-next-step').click();
    await expect(page.getByText('Contribute as')).toBeVisible();
    await page.getByTestId('cf-next-step').click();
    await fillCardElement(await newCardElement(page));
    await contribute(page);

    await page.goto(`/dashboard/${scenario.actors.contributor.slug}/outgoing-contributions`);
    await page.getByTestId('actions-menu-trigger').first().click();
    await page.getByRole('menuitem', { name: 'Update payment method' }).click();
    const modal = page.getByRole('dialog');
    await modal.locator('input[type=radio][value="stripe-payment-element"]').check();
    await fillTestCard(stripeElement(modal));
    await modal.getByTestId('recurring-contribution-submit-pm-button').click();
    await expect(toast(page, 'Your recurring contribution has been updated.')).toBeVisible({ timeout: 60_000 });
  });
});
