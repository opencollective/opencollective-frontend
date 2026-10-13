import { expect, type Locator, type Page } from '@playwright/test';

import type { Account, Vendor } from './vendor-picker';

/** A vendor's row in the list of the vendors dashboard, which must be open. */
export const vendorRow = (page: Page, vendor: Vendor) => page.getByRole('row').filter({ hasText: vendor.name });

/** As a host admin, opens a vendor from the host's vendors dashboard and its edit form, which is returned. */
export async function openVendorEditForm(page: Page, vendorsUrl: string, vendor: Vendor): Promise<Locator> {
  await page.goto(vendorsUrl);
  await vendorRow(page, vendor).click();
  await page.getByTestId('edit-vendor-button').click();
  const form = page.getByTestId('vendor-form');
  await expect(form).toBeVisible();
  return form;
}

/** Checks an open vendor form limits the vendor to selected Accounts and lists exactly this one. */
export async function expectScopedTo(form: Locator, account: Account) {
  await expect(form.locator('#whereScope-specific')).toBeChecked();
  await expect(form.getByRole('option', { selected: true })).toHaveText([new RegExp(`@${account.slug}$`)]);
}
