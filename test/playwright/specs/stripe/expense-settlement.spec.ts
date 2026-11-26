import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import { fillTestCard, stripeElement } from '../../helpers/stripe';

const test = scenarioTest('stripe-settlement-expense', { inputs: {}, actor: 'hostAdmin' });

test.describe('Pay a settlement expense with Stripe', { tag: STRIPE_TAG }, () => {
  test('host admin approves a settlement expense and pays it with a card', async ({ page, scenario }) => {
    await page.goto(scenario.urls.expense);
    const status = page.getByTestId('expense-status-msg');
    await expect(status).toHaveText('Pending');

    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(status).toHaveText('Approved');

    await page.getByRole('button', { name: 'Go to Pay' }).click();
    const modal = page.getByTestId('pay-expense-modal');
    await expect(modal).toContainText('Pay expense');
    await fillTestCard(stripeElement(modal));
    await modal.getByRole('button', { name: 'Pay', exact: true }).click();

    // Paid once Stripe reports the payment succeeded (a webhook)
    await expect(async () => {
      await page.reload();
      await expect(status).toHaveText('Paid', { timeout: 5_000 });
    }).toPass({ timeout: 60_000 });
  });
});
