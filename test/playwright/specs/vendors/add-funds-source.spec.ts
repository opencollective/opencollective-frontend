import { scenarioTest } from '../../fixtures';
import { expectVendorChoices, openAddFundsSourcePicker, searchVendors } from '../../helpers/vendor-picker';

const test = scenarioTest('vendor-host', {
  inputs: {
    secondCollective: true,
    vendors: [
      { label: 'usableHere', usableWith: ['collective'] },
      { label: 'scopedElsewhere', usableWith: ['collective2'] },
    ],
  },
  actor: 'hostAdmin',
});

test('host admin adding funds to a Collective finds the vendor scoped to it as the source', async ({
  page,
  scenario,
}) => {
  const { usableHere, scopedElsewhere } = scenario.vendors;
  await openAddFundsSourcePicker(page, scenario.urls.hostedCollectives, scenario.accounts.collective);
  await searchVendors(page, usableHere.name, 'addFundsSource');
  // Only the vendor searched for is listed. The other vendor's scope plays no part in that: see docs/e2e.md.
  await expectVendorChoices(page, { offered: [usableHere], withheld: [scopedElsewhere] }, 'addFundsSource');
});
