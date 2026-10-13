import type { Page } from '@playwright/test';

import { expect, scenarioTest } from '../../fixtures';
import { expectScopedTo, openVendorEditForm, vendorRow } from '../../helpers/vendor-dashboard';
import { expectVendorChoices, openVendorPicker } from '../../helpers/vendor-picker';

// The host admin changes settings on the host's dashboard; the admin of a hosted Collective, in a browser of
// their own, shows who can use the vendors afterwards.
const test = scenarioTest('vendor-host', { inputs: {}, actor: 'hostAdmin' });

const toast = (page: Page, text: string) => page.getByTestId('toast-notification').filter({ hasText: text });

test.describe('host with two vendors only its admins can use', () => {
  test.use({ inputs: { vendors: [{ label: 'edited' }, { label: 'untouched' }] } });

  test('host admin limits a vendor to one Collective and opens it to all submitters', async ({
    page,
    scenario,
    openBrowserAs,
  }, testInfo) => {
    const { collective } = scenario.accounts;
    const { edited, untouched } = scenario.vendors;
    const form = await openVendorEditForm(page, scenario.urls.vendors, edited);
    await expect(form.locator('#whereScope-all-hosted')).toBeChecked();
    await expect(form.locator('#useVendorPolicy-inherit')).toBeChecked();
    await form.locator('#whereScope-specific').click();
    await form.locator('#canBeUsedWithAccountsInput').fill(collective.slug);
    await page.locator(`[role=option][value="${collective.slug}"]`).click();
    await expectScopedTo(form, collective);
    await form.locator('#useVendorPolicy-ALL_SUBMITTERS').click();
    await expect(form.locator('#useVendorPolicy-ALL_SUBMITTERS')).toBeChecked();
    await page.getByRole('dialog').getByRole('button', { name: 'Update vendor' }).click();
    await expect(toast(page, 'Vendor Updated')).toBeVisible();
    if (process.env.PLAYWRIGHT_ISOLATION_PROBE === '1' && testInfo.retry === 0) {
      throw new Error('Intentional isolation probe: leave an edited vendor behind and retry with unedited vendors.');
    }

    const saved = await openVendorEditForm(page, scenario.urls.vendors, edited);
    await expectScopedTo(saved, collective);
    await expect(saved.locator('#useVendorPolicy-ALL_SUBMITTERS')).toBeChecked();

    const collectiveAdmin = await openBrowserAs('collectiveAdmin');
    await openVendorPicker(collectiveAdmin, collective);
    await expectVendorChoices(collectiveAdmin, { offered: [edited], withheld: [untouched] });
  });
});

test.describe('host open to its admins and Collective admins', () => {
  test.use({
    inputs: {
      useVendorPolicy: 'HOST_AND_COLLECTIVE_ADMINS',
      vendors: [{ label: 'hostAdminsOnly', useVendorPolicy: 'HOST_ADMINS' }],
    },
  });

  test('vendor created on the vendors dashboard follows the policy of its host', async ({
    page,
    scenario,
    openBrowserAs,
  }) => {
    const { host, collective } = scenario.accounts;
    const created = { name: `Created ${scenario.attempt.nonce.slice(0, 8)}` };
    await page.goto(scenario.urls.vendors);
    await page.getByRole('button', { name: 'Create vendor' }).click();
    const form = page.getByTestId('vendor-form');
    await form.locator('[name="name"]').fill(created.name);
    await page.getByRole('dialog').getByRole('button', { name: 'Create vendor' }).click();
    await expect(toast(page, 'Vendor Created')).toBeVisible();
    await expect(vendorRow(page, created)).toContainText(`${host.name} admins and collective admins(host default)`);

    const saved = await openVendorEditForm(page, scenario.urls.vendors, created);
    await expect(saved.locator('#useVendorPolicy-inherit')).toBeChecked();
    await expect(saved.getByText(`Host default (${host.name} admins and collective admins)`)).toBeVisible();

    const collectiveAdmin = await openBrowserAs('collectiveAdmin');
    await openVendorPicker(collectiveAdmin, collective);
    await expectVendorChoices(collectiveAdmin, { offered: [created], withheld: [scenario.vendors.hostAdminsOnly] });
  });
});

test.describe('host restricted to its admins', () => {
  test.use({
    inputs: {
      useVendorPolicy: 'HOST_ADMINS',
      vendors: [
        { label: 'followsHost' },
        { label: 'alwaysOpen', useVendorPolicy: 'ALL_SUBMITTERS' },
        { label: 'hostAdminsOnly', useVendorPolicy: 'HOST_ADMINS' },
      ],
    },
  });

  test('vendors that follow their host take up a vendor policy changed in the host settings', async ({
    page,
    scenario,
    openBrowserAs,
  }, testInfo) => {
    const { host, collective } = scenario.accounts;
    const { followsHost, alwaysOpen, hostAdminsOnly } = scenario.vendors;
    const before = await openVendorEditForm(page, scenario.urls.vendors, followsHost);
    await expect(before.locator('#useVendorPolicy-inherit')).toBeChecked();
    await expect(before.getByText(`Host default (Only ${host.name} admins)`)).toBeVisible();
    const collectiveAdmin = await openBrowserAs('collectiveAdmin');
    await openVendorPicker(collectiveAdmin, collective);
    await expectVendorChoices(collectiveAdmin, { offered: [alwaysOpen], withheld: [followsHost, hostAdminsOnly] });

    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await expect(before).toBeHidden();
    // Through the dashboard menu: opened by its address, the settings page has stayed on its loading state.
    await page.getByTestId('menu-item-Settings').click();
    await page.getByTestId('menu-item-policies').click();
    await expect(page.locator('#USE_VENDOR_POLICY-HOST_ADMINS')).toBeChecked();
    await page.locator('#USE_VENDOR_POLICY-ALL_SUBMITTERS').click();
    await expect(page.locator('#USE_VENDOR_POLICY-ALL_SUBMITTERS')).toBeChecked();
    await page.getByTestId('submit-policy-btn').click();
    await expect(toast(page, 'Policies updated successfully')).toBeVisible();
    if (process.env.PLAYWRIGHT_ISOLATION_PROBE === '1' && testInfo.retry === 0) {
      throw new Error(
        'Intentional isolation probe: leave a host open to all submitters behind and retry on a new one.',
      );
    }

    await page.goto(scenario.urls.vendors);
    await expect(vendorRow(page, followsHost)).toContainText('All expense submitters(host default)');
    await expect(vendorRow(page, hostAdminsOnly)).toContainText(`Only ${host.name} admins`);
    const after = await openVendorEditForm(page, scenario.urls.vendors, followsHost);
    await expect(after.locator('#useVendorPolicy-inherit')).toBeChecked();
    await expect(after.getByText('Host default (All expense submitters)')).toBeVisible();

    await openVendorPicker(collectiveAdmin, collective);
    await expectVendorChoices(collectiveAdmin, { offered: [alwaysOpen, followsHost], withheld: [hostAdminsOnly] });
  });
});
