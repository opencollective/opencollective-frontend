import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import type { GraphScenario } from '../../fixtures/transport';
import { attemptTag, isolationProbe } from '../../helpers/attempt';
import { toast } from '../../helpers/notifications';

// Expected funds are recorded by the host admin for `collective`, from `contributor`.
const test = scenarioTest('fiscal-host', { inputs: { contributor: true }, actor: 'hostAdmin' });

/**
 * As the host admin, records $500 of expected funds (5% host fee) from the contributor to the Collective.
 * `expectedAt` picks a delay in the list, or a date of its own. Returns the row of the new contribution.
 */
async function recordExpectedFunds(
  page: Page,
  scenario: GraphScenario,
  { description, expectedAt }: { description: string; expectedAt: '1 month' | { date: string } },
) {
  const { collective } = scenario.accounts;
  const { contributor } = scenario.actors;
  await page.goto(scenario.urls.expectedFunds);
  await page.getByTestId('create-pending-contribution').click();
  const form = page.getByTestId('create-pending-contribution-form');
  await form.locator('#CreatePendingContribution-toAccount').fill(collective.slug);
  // The dialog asks for the receiving Collective's details a moment after the choice; go on once it has them.
  const receivingCollectiveLoaded = page.waitForResponse(
    response => response.request().postDataJSON?.()?.operationName === 'CreatePendingContributionCollective',
  );
  await page.locator(`[role=option][value="${collective.slug}"]`).click();
  await expect(form.getByTestId('create-pending-contribution-to')).toContainText(`@${collective.slug}`);
  await receivingCollectiveLoaded;

  await form.locator('#CreatePendingContribution-fromAccount').fill(contributor.name);
  await page.getByTestId('select-option').filter({ hasText: contributor.name }).first().click();
  await expect(form.getByTestId('create-pending-contribution-source')).toContainText(contributor.name);
  await form.getByTestId('create-pending-contribution-contact-name').fill('Alex');
  await form.getByTestId('create-pending-contribution-fromAccountInfo-email').fill('yourname@yourhost.com');
  await form.getByTestId('create-pending-contribution-amount').fill('500');
  await form.locator('#CreatePendingContribution-hostFeePercent').fill('5');
  await form.getByTestId('create-pending-contribution-expectedAt').click();
  if (expectedAt === '1 month') {
    await page.getByTestId('select-option').filter({ hasText: '1 month' }).click();
  } else {
    // "Pick a date" replaces the list with a date input.
    await page.getByTestId('select-option').filter({ hasText: 'Pick a date' }).click();
    await expect(form.getByTestId('create-pending-contribution-expectedAt')).toHaveCount(0);
    await form.getByTestId('create-pending-contribution-expectedAt-custom').fill(expectedAt.date);
    await expect(form.getByTestId('create-pending-contribution-expectedAt-custom')).toHaveValue(expectedAt.date);
  }
  await form.getByTestId('create-pending-contribution-description').fill(description);
  await form.getByTestId('create-pending-contribution-submit-btn').click();
  await expect(form).toBeHidden();

  // The host's only expected funds: the table does not show their description.
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Pending');
  return rows.first();
}

/** Opens a contribution's details from its row, and its "More actions" menu. */
async function openContribution(page: Page, row: ReturnType<Page['locator']>, description: string) {
  await row.locator('td button').last().click();
  await page.getByText('View details').click();
  await expect(page.getByText(description).first()).toBeVisible();
}

/** The confirmation dialog's inputs, each checked to hold its value: a value that did not stick changes the amounts. */
async function fillConfirmation(page: Page, fields: Record<string, string>) {
  for (const [testId, value] of Object.entries(fields)) {
    const input = page.getByTestId(testId);
    await input.fill(value);
    await expect(input).toHaveValue(new RegExp(`^${value}(\\.0+)?$`));
  }
}

test('host admin records expected funds, marks them expired, then as paid with fees', async ({
  page,
  scenario,
}, testInfo) => {
  const description = `Generous donation ${attemptTag(scenario.attempt)}`;
  const row = await recordExpectedFunds(page, scenario, { description, expectedAt: '1 month' });
  await expect(row).toContainText('$500.00');
  await openContribution(page, row, description);

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByTestId('MARK_AS_EXPIRED-button').click();
  await page.getByRole('button', { name: 'Mark as expired' }).click();
  await expect(toast(page, 'The contribution has been marked as expired')).toBeVisible();
  await expect(page.getByText('Expired').first()).toBeVisible();
  isolationProbe(testInfo, 'leave an expired contribution behind and retry on a new host.');

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByTestId('MARK_AS_PAID-button').click();
  const platformTip = page.getByTestId('platform-tip');
  // The tip can only be changed when the amount received differs from the amount initiated...
  await expect(platformTip).toBeDisabled();
  await fillConfirmation(page, { 'amount-received': '510' });
  await expect(platformTip).toBeEnabled();
  await fillConfirmation(page, { 'platform-tip': '10' });
  // ...and goes back to none when the original amount is restored.
  await fillConfirmation(page, { 'amount-received': '500' });
  await expect(platformTip).toBeDisabled();
  await expect(platformTip).toHaveValue('0.00');

  await fillConfirmation(page, { 'payment-processor-fee': '4', 'confirm-contribution-host-fee-percent': '9' });
  await page.getByTestId('order-confirmation-modal-submit').click();
  await expect(toast(page, 'Contribution confirmed successfully')).toBeVisible();
  await expect(page.getByTestId('order-confirmation-modal-submit')).toHaveCount(0);

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByText('View transactions').click();
  const transactions = page.getByTestId('transactions-table');
  await expect(transactions.getByRole('row').filter({ hasText: 'Host fee' }).first()).toContainText('$45.00');
  // The list shows net amounts; the contribution's details show its gross amount.
  await transactions.getByRole('row').filter({ hasText: 'Contribution' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('$500.00');
});

test('host admin marks expected funds as paid with a different amount and a platform tip', async ({
  page,
  scenario,
}) => {
  const description = `Modified amount and tip ${attemptTag(scenario.attempt)}`;
  const row = await recordExpectedFunds(page, scenario, { description, expectedAt: '1 month' });
  await openContribution(page, row, description);
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByTestId('MARK_AS_PAID-button').click();

  // $514 received: $504 for the Collective, a $10 tip and a $4 processor fee; a 9% host fee on $504 is $45.36.
  // In Cypress the received amount sometimes lost keystrokes ($4 instead of $514), so the $10 tip was refused
  // as more than the amount and the dialog never submitted. Each value is checked before submitting.
  await fillConfirmation(page, { 'amount-received': '514' });
  await expect(page.getByTestId('platform-tip')).toBeEnabled();
  await fillConfirmation(page, {
    'platform-tip': '10',
    'payment-processor-fee': '4',
    'confirm-contribution-host-fee-percent': '9',
  });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('$504.00');
  await expect(dialog).toContainText('$45.36');
  await page.getByTestId('order-confirmation-modal-submit').click();
  await expect(toast(page, 'Contribution confirmed successfully')).toBeVisible();
  await expect(page.getByTestId('order-confirmation-modal-submit')).toHaveCount(0);

  // The platform tip is recorded in the platform's ledger, not in the host's.
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByText('View transactions').click();
  const transactions = page.getByTestId('transactions-table');
  await expect(transactions.getByRole('row').filter({ hasText: 'Host fee' }).first()).toContainText('$45.36');
  // The contribution's details show its gross amount: what was received, less the platform tip.
  await transactions.getByRole('row').filter({ hasText: 'Contribution' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('$504.00');
});

test('host admin records expected funds for a date of their choice', async ({ page, scenario }) => {
  const description = `Custom expected date ${attemptTag(scenario.attempt)}`;
  const row = await recordExpectedFunds(page, scenario, { description, expectedAt: { date: '2062-11-13' } });
  await expect(row).toContainText('Nov 13, 2062');
});
