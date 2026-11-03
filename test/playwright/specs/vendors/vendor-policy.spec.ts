import { scenarioTest } from '../../fixtures';
import { expectVendorChoices, openVendorPicker } from '../../helpers/vendor-picker';

// Each journey reads the picker as it opens. See docs/e2e.md for why none of them searches for a withheld vendor.
const test = scenarioTest('vendor-host', { inputs: {}, actor: 'collectiveAdmin' });

/** A host open to all submitters, with one vendor following it and two with stricter policies of their own. */
const openHostWithStricterVendors = {
  useVendorPolicy: 'ALL_SUBMITTERS' as const,
  vendors: [
    { label: 'followsHost' },
    { label: 'hostAdminsOnly', useVendorPolicy: 'HOST_ADMINS' as const },
    { label: 'adminsOnly', useVendorPolicy: 'HOST_AND_COLLECTIVE_ADMINS' as const },
  ],
};

test.describe('host open to all submitters', () => {
  test.use({
    inputs: {
      useVendorPolicy: 'ALL_SUBMITTERS',
      vendors: [{ label: 'followsHost' }, { label: 'hostAdminsOnly', useVendorPolicy: 'HOST_ADMINS' }],
    },
  });

  test('Collective admin is not offered a vendor restricted to host admins on a host open to all submitters', async ({
    page,
    scenario,
  }) => {
    const { followsHost, hostAdminsOnly } = scenario.vendors;
    await openVendorPicker(page, scenario.accounts.collective);
    await expectVendorChoices(page, { offered: [followsHost], withheld: [hostAdminsOnly] });
  });
});

test.describe('host restricted to host admins', () => {
  test.use({
    inputs: {
      useVendorPolicy: 'HOST_ADMINS',
      vendors: [
        { label: 'openToSubmitters', useVendorPolicy: 'ALL_SUBMITTERS', usableWith: ['collective'] },
        { label: 'followsHost', usableWith: ['collective'] },
      ],
    },
  });

  test('Collective admin is offered a vendor open to all submitters on a host restricted to host admins', async ({
    page,
    scenario,
  }) => {
    const { openToSubmitters, followsHost } = scenario.vendors;
    await openVendorPicker(page, scenario.accounts.collective);
    await expectVendorChoices(page, { offered: [openToSubmitters], withheld: [followsHost] });
  });
});

test.describe('submitter with no role on the host', () => {
  test.use({ actor: 'outsider', inputs: { ...openHostWithStricterVendors, outsider: true } });

  test('submitter without any role is only offered vendors that follow a host open to all submitters', async ({
    page,
    scenario,
  }) => {
    const { followsHost, hostAdminsOnly, adminsOnly } = scenario.vendors;
    await openVendorPicker(page, scenario.accounts.collective);
    await expectVendorChoices(page, { offered: [followsHost], withheld: [hostAdminsOnly, adminsOnly] });
  });
});

test.describe('admin of a Collective on another host', () => {
  test.use({
    actor: 'otherCollectiveAdmin',
    inputs: { ...openHostWithStricterVendors, otherHost: { admin: 'otherHostAdmin', collective: true } },
  });

  test('admin of a Collective on another host is only offered vendors that follow a host open to all submitters', async ({
    page,
    scenario,
  }) => {
    const { followsHost, hostAdminsOnly, adminsOnly } = scenario.vendors;
    await openVendorPicker(page, scenario.accounts.collective);
    await expectVendorChoices(page, { offered: [followsHost], withheld: [hostAdminsOnly, adminsOnly] });
  });
});
