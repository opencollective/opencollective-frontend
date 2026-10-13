import { expect, scenarioTest } from '../../fixtures';
import { expectVendorChoices, openVendorPicker, pickVendor, searchVendors } from '../../helpers/vendor-picker';

const test = scenarioTest('vendor-host', {
  inputs: { grants: true, vendors: [{ label: 'beneficiary', usableWith: ['collective'] }] },
  actor: 'hostAdmin',
});

test('host admin is offered a beneficiary scoped to the Collective granting the funds', async ({ page, scenario }) => {
  await openVendorPicker(page, scenario.accounts.collective, 'grant');
  await expectVendorChoices(page, { offered: [scenario.vendors.beneficiary] });
});

test.describe('as the admin of the granting Collective', () => {
  test.use({
    actor: 'collectiveAdmin',
    inputs: {
      grants: true,
      useVendorPolicy: 'HOST_AND_COLLECTIVE_ADMINS',
      vendors: [{ label: 'beneficiary', usableWith: ['collective'], payoutMethod: true }],
    },
  });

  test('Collective admin submits a grant request to a beneficiary scoped to their Collective', async ({
    page,
    scenario,
  }, testInfo) => {
    const { beneficiary } = scenario.vendors;
    await openVendorPicker(page, scenario.accounts.collective, 'grant');
    await searchVendors(page, beneficiary.name);
    await expectVendorChoices(page, { offered: [beneficiary] });
    await pickVendor(page, beneficiary);

    await page.locator('[name="title"]').fill('Grant to a scoped beneficiary');
    // The form resets its items once when the chosen beneficiary's details arrive, which can be after they were
    // typed. Like a user facing the validation message, fill them in again until the summary opens.
    await expect(async () => {
      await page.getByTestId('expenseItems.0.description').locator('trix-editor').fill('Grant test item');
      await page.locator('[name="expenseItems.0.amount.valueInCents"]').fill('1000');
      await page.getByRole('button', { name: 'Proceed to Summary' }).click();
      await expect(page.getByText('Recipient', { exact: true }).locator('..')).toContainText(beneficiary.name, {
        timeout: 3_000,
      });
    }).toPass();
    await expect(page.getByText('$1,000.00 USD').first()).toBeVisible();
    await page.getByRole('button', { name: 'Submit Grant Request' }).click();

    await expect(page.getByText(/Grant request #\d+ has been submitted successfully!/)).toBeVisible();
    if (process.env.PLAYWRIGHT_ISOLATION_PROBE === '1' && testInfo.retry === 0) {
      throw new Error('Intentional isolation probe: leave a submitted grant behind and retry on a new Collective.');
    }
    await expect(page.getByText(/Grant #\d+/)).toBeVisible();
    await expect(page.getByText('Grant to a scoped beneficiary')).toBeVisible();
  });
});
