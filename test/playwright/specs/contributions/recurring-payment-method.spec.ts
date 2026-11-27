import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import { queryAs } from '../../helpers/api';
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

  test('contributor replaces the card from the update payment method page', async ({ page, scenario }) => {
    const { contributor } = scenario.actors;
    await page.goto(scenario.urls.donate);
    await page.locator('#interval button', { hasText: 'Monthly' }).click();
    await page.getByTestId('cf-next-step').click();
    await expect(page.getByText('Contribute as')).toBeVisible();
    await page.getByTestId('cf-next-step').click();
    await fillCardElement(await newCardElement(page));
    await contribute(page);

    // The "credit card expiring" email links to /paymentmethod/:legacyId/update
    const { account } = await queryAs<{
      account: { orders: { nodes: { paymentMethod: { legacyId: number } }[] } };
    }>(
      contributor,
      `query RecurringContributionPaymentMethod($slug: String!) {
        account(slug: $slug) {
          id
          orders(filter: OUTGOING, onlyActiveSubscriptions: true) {
            nodes {
              id
              paymentMethod {
                id
                legacyId
              }
            }
          }
        }
      }`,
      { slug: contributor.slug },
    );
    await page.goto(`/paymentmethod/${account.orders.nodes[0].paymentMethod.legacyId}/update`);
    await expect(page.getByTestId('update-payment-method-order')).toHaveCount(1);
    await page.getByTestId('update-payment-method-order-button').click();
    await page.locator('input[type=radio][value="stripe-payment-element"]').check();
    await fillTestCard(stripeElement(page));
    await page.getByTestId('recurring-contribution-submit-pm-button').click();
    await expect(toast(page, 'Your recurring contribution has been updated.')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('All your recurring contributions now use a new payment method.')).toBeVisible();

    // The old payment method no longer backs any contribution
    await page.reload();
    await expect(page.getByText('There are no active subscriptions linked to this payment method')).toBeVisible();
  });
});
