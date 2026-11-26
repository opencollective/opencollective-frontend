import { expect, scenarioTest, STRIPE_TAG } from '../../fixtures';
import { contribute, fillCardElement, goToPaymentStep, newCardElement } from '../../helpers/stripe';

/** The public message of a contributor, on a host showing Stripe's card element (`opensource`). */
const test = scenarioTest('stripe-contribution', { inputs: { host: 'opensource' }, actor: 'contributor' });

test.describe('Public message of a contribution', { tag: STRIPE_TAG }, () => {
  test('contributor posts a public message after paying, then edits it from the Collective page', async ({
    page,
    scenario,
  }) => {
    await goToPaymentStep(page, scenario.urls.donate);
    await fillCardElement(await newCardElement(page));
    await contribute(page);

    // On the success page: at most 140 characters, saved and edited in place
    const message = page.locator('textarea[name=publicMessage]');
    await message.fill('.'.repeat(142));
    await expect(message).toHaveValue('.'.repeat(140));
    await message.fill('Adding this');
    await page.getByRole('button', { name: 'Post message' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();
    const edited = "Wow such an amazing project 💙 Let's take it to the moon!!! 🚀";
    await message.fill(edited);
    await page.getByRole('button', { name: 'Post message' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

    // On the Collective page, among its contributors
    await page.goto(`${scenario.urls.collective}#section-contributors`);
    // Names and messages are cut short on the cards: find the contributor's by its link
    const card = page
      .getByTestId('ContributorsGrid_ContributorCard')
      .filter({ has: page.locator(`a[href="/${scenario.actors.contributor.slug}"]`) });
    await expect(card).toContainText('Wow such an amazing project');
    await card.getByTestId('ContributorCard_EditPublicMessageButton').click();
    const popup = page.getByTestId('EditPublicMessagePopup');
    const fromCollectivePage = 'Writing a long public message!';
    await popup.locator('textarea').fill(fromCollectivePage);
    await popup.getByTestId('EditPublicMessagePopup_SubmitButton').click();
    await expect(popup).toBeHidden();
    await expect(card).toContainText(fromCollectivePage);

    // Stored, not only shown: the Collective page's cache was refreshed
    await page.reload();
    await expect(card).toContainText(fromCollectivePage);
  });
});
