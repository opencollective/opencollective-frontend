import { scenarioTest } from '../../fixtures';
import { expectVendorChoices, openAddFundsSourcePicker, searchVendors } from '../../helpers/vendor-picker';

const test = scenarioTest('vendor-host', {
  inputs: { vendors: [{ label: 'usableHere', usableWith: ['collective'] }] },
  actor: 'hostAdmin',
});

test('host admin adding funds to a Collective finds the vendor scoped to it as the source', async ({
  page,
  scenario,
}) => {
  const { usableHere } = scenario.vendors;
  await openAddFundsSourcePicker(page, scenario.urls.hostedCollectives, scenario.accounts.collective);
  await searchVendors(page, usableHere.name, 'addFundsSource');
  // Shows that the vendor can be found and chosen here, not that anything is withheld: see docs/e2e.md.
  await expectVendorChoices(page, { offered: [usableHere] }, 'addFundsSource');
});
