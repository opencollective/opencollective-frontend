import { scenarioTest } from '../../fixtures';
import { expectVendorChoices, openVendorPicker } from '../../helpers/vendor-picker';

const test = scenarioTest('vendor-host', {
  inputs: { project: true, vendors: [{ label: 'parentScoped', usableWith: ['collective'] }] },
  actor: 'hostAdmin',
});

test('host admin paying from a Project is offered a vendor scoped to its parent Collective', async ({
  page,
  scenario,
}) => {
  await openVendorPicker(page, scenario.accounts.project);
  await expectVendorChoices(page, { offered: [scenario.vendors.parentScoped] });
});

test.describe('as the admin of the parent Collective', () => {
  test.use({
    actor: 'collectiveAdmin',
    inputs: {
      useVendorPolicy: 'HOST_AND_COLLECTIVE_ADMINS',
      project: true,
      vendors: [
        { label: 'parentScoped', usableWith: ['collective'] },
        { label: 'childScoped', usableWith: ['project'] },
      ],
    },
  });

  test('Collective admin paying from a Project is offered vendors scoped to the Project and to its parent', async ({
    page,
    scenario,
  }) => {
    const { parentScoped, childScoped } = scenario.vendors;
    await openVendorPicker(page, scenario.accounts.project);
    await expectVendorChoices(page, { offered: [parentScoped, childScoped] });
  });
});
