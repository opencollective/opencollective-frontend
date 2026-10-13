import { expect, type Page } from '@playwright/test';

type Vendor = { name: string };
type Account = { slug: string };

/** The payee picker of the expense and grant forms, or the source picker of the Add Funds dialog. */
type Picker = 'payee' | 'addFundsSource';
const INPUT_ID: Record<Picker, string> = { payee: '__vendor', addFundsSource: 'addFunds-fromAccount' };

const optionList = (page: Page, picker: Picker) => page.locator(`#react-select-${INPUT_ID[picker]}-listbox`);

/** One vendor in an option list, by its whole displayed name: one name may be the prefix of another. */
const vendorOption = (page: Page, picker: Picker, vendor: Vendor) =>
  optionList(page, picker)
    .getByTestId('select-option')
    .filter({ has: page.getByText(vendor.name, { exact: true }) })
    // Host admins searching for a name are also offered to create a vendor called that.
    .filter({ hasNotText: /^Create (vendor|beneficiary):/ });

/**
 * Opens the form an Account is paid from and the vendor picker in it: "A vendor"
 * on the expense form, "A beneficiary" on the grant form.
 */
export async function openVendorPicker(page: Page, account: Account, form: 'expense' | 'grant' = 'expense') {
  if (form === 'grant') {
    await page.goto(`/${account.slug}/grants/new`);
    await page.getByRole('button', { name: 'Proceed' }).click();
  } else {
    await page.goto(`/${account.slug}/expenses/new`);
  }
  const payee = page.locator(form === 'grant' ? '#WHO_WILL_RECEIVE_FUNDS' : '#WHO_IS_GETTING_PAID');
  await payee.getByText(form === 'grant' ? 'A beneficiary' : 'A vendor').click();
  await payee.getByRole('combobox').click();
  await expect(optionList(page, 'payee')).toBeVisible();
}

/** As a host admin on the host dashboard, opens Add Funds for a hosted Collective and its source picker. */
export async function openAddFundsSourcePicker(page: Page, hostedCollectivesUrl: string, account: Account) {
  await page.goto(hostedCollectivesUrl);
  await page.getByTestId(`collective-${account.slug}`).getByTestId('more-actions-btn').click();
  await page.getByTestId('actions-add-funds').click();
  await page.locator(`#${INPUT_ID.addFundsSource}`).click();
  await expect(optionList(page, 'addFundsSource')).toBeVisible();
}

/** Types a search into an open vendor picker and waits for the answer to exactly that search. */
export async function searchVendors(page: Page, term: string, picker: Picker = 'payee') {
  const answered = page.waitForResponse(response => {
    const request = response.request().postDataJSON?.();
    return request?.operationName === 'CollectivePickerSearch' && request.variables?.term === term;
  });
  await page.locator(`#${INPUT_ID[picker]}`).fill(term);
  await answered;
}

/**
 * Checks what an open vendor picker offers. At least one offered vendor is
 * required: seeing it proves the picker has loaded what this user may use, so
 * the vendors expected to be withheld are really missing from a loaded list
 * rather than from one that is still empty.
 */
export async function expectVendorChoices(
  page: Page,
  { offered, withheld = [] }: { offered: [Vendor, ...Vendor[]]; withheld?: Vendor[] },
  picker: Picker = 'payee',
) {
  for (const vendor of offered) {
    await expect(vendorOption(page, picker, vendor)).toBeVisible();
  }
  for (const vendor of withheld) {
    await expect(vendorOption(page, picker, vendor)).toHaveCount(0);
  }
}

/**
 * Searches the open payee picker for a vendor by its whole name and checks the
 * search completes without offering it. A user who may create vendors is then
 * offered to create one by that name; anyone else is told there are no options.
 */
export async function expectVendorNotFound(page: Page, vendor: Vendor, { canCreate }: { canCreate: boolean }) {
  await searchVendors(page, vendor.name);
  const list = optionList(page, 'payee');
  if (canCreate) {
    // Disabled while the search is running.
    await expect(list.getByRole('option', { name: `Create vendor: ${vendor.name}` })).toBeEnabled();
  } else {
    await expect(list.getByText('No options')).toBeVisible();
  }
  await expect(vendorOption(page, 'payee', vendor)).toHaveCount(0);
}

/** Picks an offered vendor in the open payee picker. */
export async function pickVendor(page: Page, vendor: Vendor) {
  await vendorOption(page, 'payee', vendor).click();
}
