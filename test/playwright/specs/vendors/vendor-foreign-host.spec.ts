import { scenarioTest } from '../../fixtures';
import { expectVendorChoices, expectVendorNotFound, openVendorPicker } from '../../helpers/vendor-picker';

// `ownVendor` is on the paying Collective's host: seeing it shows the picker has loaded before the other
// host's vendor is declared missing.
const vendors = [{ label: 'ownVendor' }, { label: 'foreignVendor', host: 'otherHost' as const }];

const test = scenarioTest('vendor-host', {
  inputs: { otherHost: { admin: 'otherHostAdmin' }, vendors },
  actor: 'hostAdmin',
});

test('host admin is not offered a vendor of another host', async ({ page, scenario }) => {
  const { ownVendor, foreignVendor } = scenario.vendors;
  await openVendorPicker(page, scenario.accounts.collective);
  await expectVendorChoices(page, { offered: [ownVendor], withheld: [foreignVendor] });
  await expectVendorNotFound(page, foreignVendor, { canCreate: true });
});

test.describe('admin of both hosts', () => {
  test.use({ inputs: { otherHost: { admin: 'hostAdmin' }, vendors } });

  test('admin of two hosts is not offered a vendor of the host that does not hold the paying Collective', async ({
    page,
    scenario,
  }) => {
    const { ownVendor, foreignVendor } = scenario.vendors;
    await openVendorPicker(page, scenario.accounts.collective);
    await expectVendorChoices(page, { offered: [ownVendor], withheld: [foreignVendor] });
    await expectVendorNotFound(page, foreignVendor, { canCreate: true });
  });
});
