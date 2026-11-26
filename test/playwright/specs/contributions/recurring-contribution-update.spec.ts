import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import type { ContributionScenario } from '../../fixtures/transport';
import { toast } from '../../helpers/notifications';

/**
 * A contributor changes their monthly contribution from their dashboard. The contribution is arranged already
 * charged once with a saved card that never reaches Stripe: changing the amount, the tier or the platform tip of
 * a card contribution only takes effect at its next charge, so no payment provider is involved.
 */
const test = scenarioTest('recurring-contribution', { inputs: { amount: 200000 }, actor: 'contributor' });

const contributionRow = (page: Page) => page.locator('[data-cy^="datatable-row"]').first();

/** Opens one of the contribution's actions from its row in the contributor's dashboard. */
async function openAction(page: Page, scenario: ContributionScenario, action: string) {
  await page.goto(scenario.urls.outgoingContributions);
  await page.getByTestId('actions-menu-trigger').first().click();
  await page.getByRole('menuitem', { name: action }).click();
  return page.getByRole('dialog');
}

const updated = (page: Page) => toast(page, 'Your recurring contribution has been updated.');

test('contributor moves to a cheaper tier at a fixed amount, which applies at once', async ({
  page,
  scenario: graph,
}) => {
  const scenario = graph as ContributionScenario;
  const modal = await openAction(page, scenario, 'Update contribution amount');
  await modal
    .getByTestId('recurring-contribution-tier-box')
    .filter({ hasText: scenario.tiers.gold.name })
    .getByRole('radio')
    .check();
  await modal.getByTestId('recurring-contribution-update-order-button').click();
  await expect(updated(page)).toBeVisible();
  await expect(contributionRow(page)).toContainText('$1,000.00');
});

test('contributor picks an amount of a flexible tier, or their own above its minimum', async ({
  page,
  scenario: graph,
}) => {
  const scenario = graph as ContributionScenario;
  const tierBox = (modal: ReturnType<Page['getByRole']>) =>
    modal.getByTestId('recurring-contribution-tier-box').filter({ hasText: scenario.tiers.silver.name });

  // One of the tier's amounts
  let modal = await openAction(page, scenario, 'Update contribution amount');
  await tierBox(modal).getByRole('radio').check();
  await modal.getByTestId('tier-amount-select').click();
  await page.getByTestId('select-option').filter({ hasText: '$250' }).click();
  await modal.getByTestId('recurring-contribution-update-order-button').click();
  await expect(updated(page)).toBeVisible();
  await expect(contributionRow(page)).toContainText('$250.00');

  // Their own amount
  modal = await openAction(page, scenario, 'Update contribution amount');
  await tierBox(modal).getByRole('radio').check();
  await modal.getByTestId('tier-amount-select').click();
  await page.getByTestId('select-option').filter({ hasText: 'Other' }).click();
  await expect(tierBox(modal)).toContainText('Min. amount: $100.00');
  const customAmount = modal.getByTestId('recurring-contribution-custom-amount-input');
  await customAmount.fill('150');
  await modal.getByTestId('recurring-contribution-update-order-button').click();
  await expect(updated(page)).toBeVisible();
  await expect(contributionRow(page)).toContainText('$150.00');

  // Not below the tier's minimum
  modal = await openAction(page, scenario, 'Update contribution amount');
  await tierBox(modal).getByRole('radio').check();
  await modal.getByTestId('tier-amount-select').click();
  await page.getByTestId('select-option').filter({ hasText: 'Other' }).click();
  await customAmount.fill('50');
  await modal.getByTestId('recurring-contribution-update-order-button').click();
  await expect(
    toast(page, 'The amount you set is below minimum tier value, it should be at least $100.00'),
  ).toBeVisible();
});

test('contributor cancels, giving their own reason, which the Collective is told', async ({
  page,
  scenario: graph,
  mail,
}) => {
  const scenario = graph as ContributionScenario;
  await page.goto(scenario.urls.outgoingContributions);
  await page.getByTestId('actions-menu-trigger').first().click();
  await page.getByTestId('recurring-contribution-menu-cancel-option').click();

  const modal = page.getByTestId('cancel-order-modal');
  await expect(modal).toContainText('Why are you cancelling your subscription today? 🥺');
  await expect(modal.getByTestId('NO_LONGER_WANT_TO_SUPPORT')).toContainText('No longer want to back the collective');
  await expect(modal.getByTestId('UPDATING_ORDER')).toContainText('Changing payment method or amount');
  // A text of their own only for "Other"
  await expect(modal.getByTestId('cancellation-text-area')).toHaveCount(0);
  await modal.getByTestId('OTHER').click();
  await modal.getByTestId('cancellation-text-area').fill('Because I want to');
  await modal.getByTestId('recurring-contribution-cancel-yes').click();

  await expect(toast(page, 'Your recurring contribution has been cancelled')).toBeVisible();
  await expect(contributionRow(page).getByTestId('contribution-status')).toContainText('Canceled');
  const message = await mail.waitForMessage({
    to: scenario.actors.contributor.email,
    subject: `Contribution to ${scenario.accounts.collective.name} cancelled`,
  });
  expect(message.html).toContain('Because I want to');
});

test.describe('with a platform tip', () => {
  test.use({ inputs: { amount: 5000, platformTip: true } });

  test('contributor changes the platform tip to another percentage, an amount of their own, or none', async ({
    page,
    scenario: graph,
  }) => {
    const scenario = graph as ContributionScenario;
    const tipUpdated = toast(page, 'Your recurring contribution platform tip has been updated.');
    const tipOption = (modal: ReturnType<Page['getByRole']>, label: string) =>
      modal.getByTestId('platform-tip-options').getByRole('button', { name: label });

    // The contribution's total includes the tip: $50 and 15%
    await page.goto(scenario.urls.outgoingContributions);
    await expect(contributionRow(page)).toContainText('$57.50');

    let modal = await openAction(page, scenario, 'Update platform tip amount');
    await tipOption(modal, '20%').click();
    await expect(tipOption(modal, '20%')).toHaveClass(/selected/);
    await modal.getByTestId('recurring-contribution-update-platform-tip-button').click();
    await expect(tipUpdated).toBeVisible();
    await expect(contributionRow(page)).toContainText('$60.00');

    modal = await openAction(page, scenario, 'Update platform tip amount');
    await expect(tipOption(modal, '20%')).toHaveClass(/selected/);
    await tipOption(modal, 'Custom').click();
    await modal.getByTestId('platform-tip-other-amount').fill('4');
    await modal.getByTestId('recurring-contribution-update-platform-tip-button').click();
    await expect(tipUpdated).toBeVisible();
    await expect(contributionRow(page)).toContainText('$54.00');

    modal = await openAction(page, scenario, 'Update platform tip amount');
    await expect(modal.getByTestId('platform-tip-other-amount')).toHaveValue('4.00');
    await modal.getByText("I don't want to add a contribution to the Open Collective platform").click();
    await modal.getByTestId('recurring-contribution-update-platform-tip-button').click();
    await expect(tipUpdated).toBeVisible();
    await expect(contributionRow(page)).toContainText('$50.00');
  });
});
