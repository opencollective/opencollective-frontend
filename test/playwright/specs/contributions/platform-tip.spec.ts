import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import type { ContributionFlowScenario } from '../../fixtures/transport';

/**
 * The platform tip of the contribution details step, for a visitor who is not signed in. Nothing is submitted:
 * the journeys stay on the first step, so no payment provider is involved.
 */
const test = scenarioTest('contribution-flow', { inputs: { platformTips: true }, actor: null });

const amountButton = (page: Page, label: string) =>
  page.getByTestId('amount-picker').getByRole('button', { name: label, exact: true });
const tipButton = (page: Page, label: string) =>
  page.getByTestId('platform-tip-options').getByRole('button', { name: label, exact: true });

/** The tip and today's charge of the contribution summary; a `null` tip means the summary shows no tip line. */
async function expectCharge(page: Page, { tip, total }: { tip: string | null; total: string }) {
  const tipLine = page.getByTestId('ContributionSummary-Tip');
  if (tip === null) {
    await expect(tipLine).toHaveCount(0);
  } else {
    await expect(tipLine).toContainText(`${tip} USD`);
  }
  await expect(page.getByTestId('ContributionSummary-TodaysCharge')).toContainText(`${total} USD`);
}

test('contributor adjusts the platform tip as a percentage, a custom amount, or none', async ({ page, scenario }) => {
  await page.goto(scenario.urls.donate);
  await expect(amountButton(page, '$20')).toHaveAttribute('aria-pressed', 'true');

  // A percentage of the amount: 15% by default, following the amount
  await expect(page.getByTestId('platform-tip-container')).toContainText('$3.00 (15.00%)');
  await expectCharge(page, { tip: '$3.00', total: '$23.00' });
  await amountButton(page, '$50').click();
  await expectCharge(page, { tip: '$7.50', total: '$57.50' });

  // Editing shows the options, starting from 15%
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(tipButton(page, '15%')).toHaveClass(/selected/);
  await tipButton(page, '10%').click();
  await expect(tipButton(page, '10%')).toHaveClass(/selected/);
  await expectCharge(page, { tip: '$5.00', total: '$55.00' });
  await amountButton(page, '$10').click();
  await expectCharge(page, { tip: '$1.00', total: '$11.00' });

  // A custom amount: no tip can be chosen while it is empty
  await amountButton(page, 'Other').click();
  const customAmount = page.locator('input[name="custom-amount"]');
  await customAmount.fill('');
  for (const option of await page.getByTestId('platform-tip-options').getByRole('button').all()) {
    await expect(option).toBeDisabled();
  }
  await customAmount.fill('12');
  await expectCharge(page, { tip: '$1.20', total: '$13.20' });
  await amountButton(page, '$10').click();
  await expectCharge(page, { tip: '$1.00', total: '$11.00' });

  // A tip of a fixed amount, which stays when the amount changes
  await tipButton(page, 'Other').click();
  const customTip = page.getByTestId('platform-tip-other-amount');
  await customTip.fill('');
  await expectCharge(page, { tip: null, total: '$10.00' });
  await customTip.fill('4.2');
  await expectCharge(page, { tip: '$4.20', total: '$14.20' });
  await amountButton(page, '$50').click();
  await expectCharge(page, { tip: '$4.20', total: '$54.20' });

  // An unusually high tip asks for confirmation; declining stays on the step
  await customTip.fill('48');
  await expectCharge(page, { tip: '$48.00', total: '$98.00' });
  const dialogs: Array<{ type: string; message: string }> = [];
  page.once('dialog', dialog => {
    dialogs.push({ type: dialog.type(), message: dialog.message() });
    return dialog.dismiss();
  });
  await page.getByTestId('cf-next-step').click();
  await expect
    .poll(() => dialogs)
    .toEqual([
      {
        type: 'confirm',
        message: `You are about to make a contribution of $98.00 to ${scenario.accounts.collective.name} that includes a $48.00 tip to the Open Collective platform. The tip amount looks unusually high.\n\nAre you sure you want to do this?`,
      },
    ]);
  await expect(amountButton(page, '$50')).toBeVisible();

  // Opting out removes the tip, whatever the amount
  await page.getByText("I don't want to contribute to Open Collective").click();
  await expectCharge(page, { tip: null, total: '$50.00' });
  await amountButton(page, '$10').click();
  await expectCharge(page, { tip: null, total: '$10.00' });
});

test.describe('tier accepting $0', () => {
  test.use({ inputs: { platformTips: true, openTier: true } });

  test('the platform tip is not offered on a contribution of $0', async ({ page, scenario: graph }) => {
    const scenario = graph as ContributionFlowScenario;
    await page.goto(scenario.urls.contribute);
    // The Collective's only tier comes before the custom contribution
    await expect(page.getByTestId('contribute-title').first()).toHaveText(scenario.tiers.open.name);
    await page.getByTestId('contribute-btn').first().click();
    await expect(page).toHaveURL(new RegExp(`/contribute/[\\w-]+-${scenario.tiers.open.legacyId}/`));

    // Offered on the tier's default amount
    const tipContainer = page.getByTestId('platform-tip-container');
    await expect(tipContainer).toBeVisible();
    await expectCharge(page, { tip: '$0.75', total: '$5.75' });

    // Not on $0
    await amountButton(page, 'Other').click();
    await page.locator('input[name="custom-amount"]').fill('0');
    await expect(tipContainer).toBeHidden();
    await expectCharge(page, { tip: null, total: '$0.00' });
  });
});
