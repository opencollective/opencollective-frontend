import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { attemptTag, isolationProbe } from '../../helpers/attempt';
import { toast } from '../../helpers/notifications';
import { createVendorInline, openVendorPicker, pickVendor } from '../../helpers/vendor-picker';

const test = scenarioTest('vendor-host', { inputs: { grants: true }, actor: 'collectiveAdmin' });

const PAYOUT_DETAILS = 'Please send the funds to my bank account: xxxxxxxxxxx';

const ITEM_DESCRIPTION = 'Grant application for community project';

/**
 * Fills the application content: one $1,000 item. The amount typed right after the description has landed in the
 * description editor instead (seen once): like a user, fill both again until each holds its own value.
 */
async function fillApplication(page: Page) {
  const description = page.getByTestId('expenseItems.0.description').locator('trix-editor');
  const amount = page.locator('[name="expenseItems.0.amount.valueInCents"]');
  await expect(async () => {
    await description.fill(ITEM_DESCRIPTION);
    await amount.fill('1000');
    await expect(description).toHaveText(ITEM_DESCRIPTION, { timeout: 2_000 });
    await expect(amount).toHaveValue(/^1000(\.00)?$/, { timeout: 2_000 });
  }).toPass();
}

/**
 * Fills the application and opens the summary. The form resets its items once after a beneficiary is picked,
 * possibly after they were typed: like a user facing the validation message, fill them in again until it opens.
 */
async function proceedToSummary(page: Page) {
  await expect(async () => {
    await fillApplication(page);
    await page.getByRole('button', { name: 'Proceed to Summary' }).click();
    await expect(page.getByText('Review grant request')).toBeVisible({ timeout: 3_000 });
  }).toPass();
}

/** Adds an "Other" payout method in USD to the picked beneficiary, from the payout method section. */
async function addBeneficiaryPayoutMethod(page: Page) {
  const section = page.locator('#PAYOUT_METHOD');
  await section.getByText('New payout method').click();
  await section.getByText('Choose a payout method').click();
  await page.getByRole('option', { name: 'Other' }).click();
  await section.getByTestId('currency-picker').click();
  await page.getByPlaceholder('Search...').fill('USD');
  await page.keyboard.press('Enter');
  await section.getByTestId('payout-other-info').fill(PAYOUT_DETAILS);
  await section.getByRole('button', { name: 'Save' }).click();
  await expect(toast(page, 'Payout method created')).toBeVisible();
}

/** Checks the summary, submits the request and checks it was received. */
async function submitGrantRequest(page: Page, payoutMethod: { type: string; currency: string; details?: string }) {
  await expect(page.getByText(ITEM_DESCRIPTION)).toBeVisible();
  await expect(page.getByText('$1,000.00').first()).toBeVisible();
  await expect(page.getByText(payoutMethod.type).first()).toBeVisible();
  await expect(page.getByText(payoutMethod.currency).first()).toBeVisible();
  await expect(page.getByText(payoutMethod.details ?? PAYOUT_DETAILS)).toBeVisible();
  await page.getByRole('button', { name: 'Submit Grant Request' }).click();
  await expect(page.getByText(/Grant request #\d+ has been submitted successfully!/)).toBeVisible();
  await expect(page.getByText('View All Grants')).toBeVisible();
}

test('Collective admin requests a grant for themselves with a new payout method', async ({
  page,
  scenario,
}, testInfo) => {
  const { collective } = scenario.accounts;
  await page.goto(`/${collective.slug}/grants/new`);
  await expect(page.getByText(`Grant request to ${collective.name}`)).toBeVisible();
  await expect(page.getByText('Grant Provider')).toBeVisible();
  await page.getByRole('button', { name: 'Proceed' }).click();

  await expect(page.getByRole('heading', { name: 'Who will receive the funds?' })).toBeVisible();
  await page.getByTestId('payee-myself-option').click();
  await expect(page.getByText('Select a payout method')).toBeVisible();
  const newPayoutMethod = page.getByTestId('add-new-payout-method');
  await expect(newPayoutMethod).toBeEnabled();
  await newPayoutMethod.click();
  await expect(newPayoutMethod).toHaveAttribute('data-state', 'checked');
  await page.getByTestId('payout-method-type-select').click();
  await expect(page.getByTestId('select-option').filter({ hasText: 'Bank transfer' })).toBeVisible();
  await page.getByTestId('select-option').filter({ hasText: 'Other' }).click();
  await page.getByTestId('currency-picker').click();
  await page.getByRole('option', { name: /AUD Australian Dollar/ }).click();
  await page.locator('input[name="newPayoutMethod.name"]').fill('My Bank Account');
  await fillApplication(page);

  // The payout method details are missing.
  await page.getByRole('button', { name: 'Proceed to Summary' }).click();
  await expect(page.locator('#PAYOUT_METHOD')).toContainText('The value is too short');
  await page.locator('textarea[name="newPayoutMethod.data.content"]').fill(PAYOUT_DETAILS);
  await page.getByRole('button', { name: 'Proceed to Summary' }).click();
  await expect(page.getByText('Review grant request')).toBeVisible();
  await expect(page.getByText('My Bank Account', { exact: true })).toBeVisible();
  isolationProbe(testInfo, 'leave a saved payout method behind and retry with a new Collective admin.');

  await submitGrantRequest(page, { type: 'My Bank Account', currency: 'AUD' });
});

test.describe('as the host admin', () => {
  test.use({ actor: 'hostAdmin' });

  test('host admin requests a grant for a beneficiary created on the spot', async ({ page, scenario }) => {
    await openVendorPicker(page, scenario.accounts.collective, 'grant');
    await createVendorInline(page, { name: `Beneficiary ${attemptTag(scenario.attempt)}` }, { as: 'beneficiary' });
    await addBeneficiaryPayoutMethod(page);
    await proceedToSummary(page);
    await submitGrantRequest(page, { type: 'Other', currency: 'USD' });
  });

  test.describe('with a beneficiary without payout method', () => {
    test.use({ inputs: { grants: true, vendors: [{ label: 'beneficiary' }] } });

    test('host admin adds a payout method to an existing beneficiary and requests a grant', async ({
      page,
      scenario,
    }) => {
      await openVendorPicker(page, scenario.accounts.collective, 'grant');
      await pickVendor(page, scenario.vendors.beneficiary);
      await addBeneficiaryPayoutMethod(page);
      await proceedToSummary(page);
      await submitGrantRequest(page, { type: 'Other', currency: 'USD' });
    });
  });

  test.describe('with a beneficiary that has a payout method', () => {
    test.use({ inputs: { grants: true, vendors: [{ label: 'beneficiary', payoutMethod: true }] } });

    test('host admin requests a grant for an existing beneficiary', async ({ page, scenario }) => {
      await openVendorPicker(page, scenario.accounts.collective, 'grant');
      await pickVendor(page, scenario.vendors.beneficiary);
      await proceedToSummary(page);
      // The arranged payout method (`createPayoutMethod` in the API) is named "Bank".
      await submitGrantRequest(page, { type: 'Bank', currency: 'USD', details: 'Payout details for Bank' });
    });
  });
});
