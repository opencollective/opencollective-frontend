import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import type { GraphScenario } from '../../fixtures/transport';
import { attemptTag, isolationProbe } from '../../helpers/attempt';
import { expectScopedTo, openVendorEditForm } from '../../helpers/vendor-dashboard';
import {
  createVendorInline,
  openAddFundsSourcePicker,
  openVendorPicker,
  type Vendor,
} from '../../helpers/vendor-picker';

// Every journey creates a vendor where a host admin runs into needing one, then reads what was saved in the
// vendor's settings on the host's vendors dashboard.
const test = scenarioTest('vendor-host', { inputs: {}, actor: 'hostAdmin' });

/** A name no other attempt uses, short enough to be shown whole in pickers. */
const newVendor = (scenario: GraphScenario, prefix: string): Vendor => ({
  name: `${prefix} ${attemptTag(scenario.attempt)}`,
});

/** The vendor's settings limit it to the Collective it was created for and leave who can use it to the host. */
async function expectSavedForCollective(page: Page, scenario: GraphScenario, vendor: Vendor) {
  const form = await openVendorEditForm(page, scenario.urls.vendors, vendor);
  await expectScopedTo(form, scenario.accounts.collective);
  await expect(form.locator('#useVendorPolicy-inherit')).toBeChecked();
}

test('vendor created while adding funds to a Collective is scoped to that Collective', async ({
  page,
  scenario,
}, testInfo) => {
  const vendor = newVendor(scenario, 'Funds');
  await openAddFundsSourcePicker(page, scenario.urls.hostedCollectives, scenario.accounts.collective);
  await createVendorInline(page, vendor, { picker: 'addFundsSource' });
  await expect(page.getByTestId('add-funds-source')).toContainText(vendor.name);
  isolationProbe(testInfo, 'leave a created vendor behind and retry on a host without vendors.');

  await expectSavedForCollective(page, scenario, vendor);
});

test('vendor created from the expense form is scoped to the paying Collective', async ({ page, scenario }) => {
  const vendor = newVendor(scenario, 'Expense');
  await openVendorPicker(page, scenario.accounts.collective);
  await createVendorInline(page, vendor);
  await expect(page.locator('#WHO_IS_GETTING_PAID')).toContainText(vendor.name);

  await expectSavedForCollective(page, scenario, vendor);
});

test('vendor created while recording expected funds is scoped to the receiving Collective', async ({
  page,
  scenario,
}) => {
  const { collective } = scenario.accounts;
  const vendor = newVendor(scenario, 'Expected');
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

  await form.locator('#CreatePendingContribution-fromAccount').fill(vendor.name);
  const createVendor = form.getByTestId('collective-type-picker-VENDOR');
  await expect(createVendor).toBeVisible();
  // The button works, but sits in a list entry that is marked as disabled, which Playwright would wait out.
  await createVendor.click({ force: true });
  const newVendorDialog = page.getByRole('dialog').filter({ hasText: 'Create new Vendor' });
  await newVendorDialog.getByLabel('Display name').fill(vendor.name);
  await newVendorDialog.getByRole('button', { name: 'Create vendor' }).click();
  await expect(form.getByTestId('create-pending-contribution-source')).toContainText(vendor.name);

  await expectSavedForCollective(page, scenario, vendor);
});

test.describe('Collective that makes grants', () => {
  test.use({ inputs: { grants: true } });

  test('beneficiary created from the grant form is scoped to the granting Collective', async ({ page, scenario }) => {
    const vendor = newVendor(scenario, 'Grant');
    await openVendorPicker(page, scenario.accounts.collective, 'grant');
    await createVendorInline(page, vendor, { as: 'beneficiary' });
    await expect(page.locator('#WHO_WILL_RECEIVE_FUNDS')).toContainText(vendor.name);

    await expectSavedForCollective(page, scenario, vendor);
  });
});
