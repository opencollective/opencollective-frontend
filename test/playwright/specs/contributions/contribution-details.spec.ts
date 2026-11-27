import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import type { StripeContributionScenario } from '../../fixtures/transport';

/**
 * The details and profile steps of the contribution flow, and the routes leading to it. Nothing is paid: no
 * journey goes past the profile step, so these need no Stripe prerequisites although the Collective's host
 * (`opensource`) has a Stripe connection, as a host taking card contributions does.
 */
const test = scenarioTest('stripe-contribution', { inputs: { host: 'opensource' }, actor: 'contributor' });

/** The steps of the contribution flow (`details`, `profile`, `payment`) that can be opened, and those that cannot. */
async function expectSteps(page: Page, { enabled = [], disabled = [] }: { enabled?: string[]; disabled?: string[] }) {
  for (const step of enabled) {
    await expect(page.getByTestId(`progress-step-${step}`)).toHaveAttribute('data-disabled', 'false');
  }
  for (const step of disabled) {
    await expect(page.getByTestId(`progress-step-${step}`)).toHaveAttribute('data-disabled', 'true');
  }
}

test('contributor picks a custom amount and an interval, then contributes as themselves', async ({
  page,
  scenario,
}) => {
  // The next charge date depends on the day of the month: from the 15th on, the first charge covers the next month
  await page.clock.setFixedTime(new Date('2026-05-25T12:00:00'));
  await page.goto(scenario.urls.donate);
  await expect(page.locator('#amount button.selected')).toHaveCount(1);

  await page.getByTestId('amount-picker-btn-other').click();
  await page.locator('input[name=custom-amount]').fill('1337');
  const details = page.getByTestId('progress-step-details');
  await expect(details).toContainText('$1,337.00');

  await page.locator('#interval button', { hasText: 'Monthly' }).click();
  await expect(details).toContainText('$1,337.00 USD / mo.');
  await expect(page.getByText('Monthly charge')).toBeVisible();
  await expect(page.getByText('the next charge will be on July 1, 2026')).toBeVisible();

  await page.locator('#interval button', { hasText: 'Yearly' }).click();
  await expect(details).toContainText('$1,337.00 USD / yr.');
  await expect(page.getByText('Yearly charge')).toBeVisible();
  await expect(page.getByText('the next charge will be on May 1, 2027')).toBeVisible();
  await page.getByTestId('cf-next-step').click();

  // Their personal profile comes first and is picked
  await expectSteps(page, { enabled: ['details', 'profile'], disabled: ['payment'] });
  const { name } = scenario.actors.contributor;
  const picker = page.getByTestId('contribute-profile-picker');
  await expect(picker).toContainText(name);
  await expect(picker).toContainText('Personal');
  await picker.click();
  const firstOption = page.getByTestId('select-option').first();
  await expect(firstOption).toContainText(name);
  await expect(firstOption).toContainText('Personal');
  await page.keyboard.press('Escape');
  await page.getByTestId('input-legalName').fill('Very Legal Name');
  await page.getByTestId('cf-next-step').click();

  await expect(page.getByTestId('progress-step-profile')).toContainText(name);
  await expectSteps(page, { enabled: ['details', 'profile', 'payment'] });
  await expect(page.getByTestId('PaymentMethodList')).toBeVisible();
});

test('amount and interval given in the URL are applied', async ({ page, scenario }) => {
  await page.clock.setFixedTime(new Date('2026-05-25T12:00:00'));
  await page.goto(`${scenario.urls.donate}/42/year`);
  await expect(page.getByTestId('contribution-summary')).toContainText('the next charge will be on May 1, 2027');
  await expect(page.getByTestId('progress-step-details')).toContainText('$42.00 USD / yr.');
  await page.getByTestId('cf-next-step').click();
  await expectSteps(page, { enabled: ['details', 'profile'] });
});

test.describe('tier', () => {
  test.use({ inputs: { host: 'opensource', sponsorsTier: true } });

  test('contributor picks one of the amounts of a monthly tier', async ({ page, scenario: graph }) => {
    const scenario = graph as StripeContributionScenario;
    const { sponsors } = scenario.tiers;
    // Before the 15th, the first charge covers the current month
    await page.clock.setFixedTime(new Date('2026-05-03T12:00:00'));
    await page.goto(`${scenario.urls.contribute}/${sponsors.slug}-${sponsors.legacyId}/checkout`);
    await expectSteps(page, { enabled: ['details'], disabled: ['profile', 'payment'] });
    await expect(page.locator('#amount button.selected')).toHaveCount(1);

    await page.locator('#amount button', { hasText: '$500' }).click();
    await expect(page.getByTestId('progress-step-details')).toContainText('$500.00 USD / mo.');
    await expect(page.locator('#amount button', { hasText: '$100' })).toBeEnabled();
    await expect(page.getByText('the next charge will be on June 1, 2026')).toBeVisible();
  });

  test('legacy and unusual tier URLs lead to the tier, a missing tier to the other ways to contribute', async ({
    page,
    scenario: graph,
  }) => {
    const scenario = graph as StripeContributionScenario;
    const { sponsors } = scenario.tiers;
    const checkoutProfile = `${scenario.urls.contribute}/${sponsors.slug}-${sponsors.legacyId}/checkout/profile`;

    // The route of the previous contribution flow
    await page.goto(`${scenario.urls.donate}/tier/${sponsors.legacyId}-${sponsors.slug}`);
    await expect(page.getByText('Contribution details')).toBeVisible();
    await page.getByTestId('cf-next-step').click();
    await expect(page).toHaveURL(url => url.pathname === checkoutProfile);

    // A slug with several parts: the tier is the last number
    await page.goto(`${scenario.urls.contribute}/a-multipart-420-${sponsors.legacyId}/checkout`);
    await expect(page.getByText('Contribution details')).toBeVisible();
    await page.getByTestId('cf-next-step').click();
    await expect(page).toHaveURL(url => url.pathname === checkoutProfile);

    // A tier that does not exist
    await page.goto(`${scenario.urls.contribute}/backer-46999999/checkout`);
    await expect(
      page.getByText("Oops! This tier doesn't exist or has been removed by the collective admins."),
    ).toBeVisible();
    await page.getByText('View all the other ways to contribute').click();
    await expect(page).toHaveURL(url => url.pathname === scenario.urls.contribute);
  });
});
