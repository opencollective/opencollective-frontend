import path from 'path';

import type { Page, TestInfo } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import type { ContributionScenario } from '../../fixtures/transport';

const test = scenarioTest('recurring-contribution', { inputs: {}, actor: 'contributor' });

/** Attached to the report; also written to `PW_SCREENSHOTS_DIR` when set (e.g. to illustrate a pull request). */
const capture = async (page: Page, testInfo: TestInfo, name: string, target?: ReturnType<Page['locator']>) => {
  const body = await (target ?? page).screenshot({ animations: 'disabled' });
  await testInfo.attach(name, { body, contentType: 'image/png' });
  if (process.env.PW_SCREENSHOTS_DIR) {
    await (target ?? page).screenshot({
      path: path.join(process.env.PW_SCREENSHOTS_DIR, `${name}.png`),
      animations: 'disabled',
    });
  }
};

/** The contributor has a single contribution: the only data row. */
const contributionRow = (page: Page) => page.locator('tbody tr').first();

test('contributor upgrading to a paid tier keeps their tier until the next payment', async ({
  page,
  scenario: graph,
}, testInfo) => {
  const scenario = graph as ContributionScenario;
  const { gold } = scenario.tiers;
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(scenario.urls.outgoingContributions);
  const row = contributionRow(page);
  await expect(row).toBeVisible();

  // Pick the $1,000/month tier from a $1/month contribution
  await row.getByRole('button').last().click();
  await page.getByRole('menuitem', { name: 'Update contribution amount' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByText(gold.name, { exact: true }).click();
  await expect(modal.getByTestId('tier-change-timing')).toBeVisible();
  await capture(page, testInfo, '1-update-amount-modal', modal);

  await modal.getByRole('button', { name: 'Update' }).click();
  // Rendered twice: the toast and its screen reader announcement
  const toast = page.getByText(`You will move to ${gold.name} after your next payment at the new amount.`);
  await expect(toast.first()).toBeVisible();
  await capture(page, testInfo, '2-update-toast');

  // The new amount is billed from the next charge, the tier waits for it
  await expect(row).toContainText('$1,000.00');
  await expect(row.getByTestId('pending-tier-change-cell')).toHaveText(`${gold.name} after next payment`);
  await capture(page, testInfo, '3-contributions-table', page.getByRole('table'));

  await expect(toast).toHaveCount(0, { timeout: 20_000 });
  await row.getByText('Monthly').click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByTestId('pending-tier-change')).toContainText(
    `Moving to ${gold.name} after the next payment`,
  );
  await capture(page, testInfo, '4-contribution-drawer', drawer);
});

test.describe('with an upgrade already waiting for the next payment', () => {
  test.use({ inputs: { pendingGoldTier: true } });

  test('the edit form starts from the pending tier and explains it', async ({ page, scenario: graph }, testInfo) => {
    const scenario = graph as ContributionScenario;
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(scenario.urls.outgoingContributions);
    const row = contributionRow(page);
    await row.getByRole('button').last().click();
    await page.getByRole('menuitem', { name: 'Update contribution amount' }).click();
    const modal = page.getByRole('dialog');
    await expect(modal.getByTestId('pending-tier-change')).toContainText(`Moving to ${scenario.tiers.gold.name}`);
    await expect(modal.getByRole('radio', { checked: true })).toHaveCount(1);
    // Already pending: no need to repeat when it applies
    await expect(modal.getByTestId('tier-change-timing')).toBeHidden();
    await capture(page, testInfo, '5-update-modal-with-pending-tier', modal);
  });
});
