import { scenarioTest } from '../../fixtures';
import { expectVendorChoices, expectVendorNotFound, openVendorPicker } from '../../helpers/vendor-picker';

const test = scenarioTest('vendor-host', { inputs: {}, actor: 'collectiveAdmin' });

test.describe('vendors scoped to different Collectives of one host', () => {
  test.use({
    inputs: {
      useVendorPolicy: 'HOST_AND_COLLECTIVE_ADMINS',
      secondCollective: true,
      vendors: [
        { label: 'usableHere', usableWith: ['collective'] },
        { label: 'scopedElsewhere', usableWith: ['collective2'] },
      ],
    },
  });

  test('Collective admin is offered the vendor scoped to their Collective and not the one scoped to another', async ({
    page,
    scenario,
  }, testInfo) => {
    const { usableHere, scopedElsewhere } = scenario.vendors;
    await openVendorPicker(page, scenario.accounts.collective);
    await expectVendorChoices(page, { offered: [usableHere], withheld: [scopedElsewhere] });
    if (process.env.PLAYWRIGHT_ISOLATION_PROBE === '1' && testInfo.retry === 0) {
      throw new Error('Intentional isolation probe: retry on a new host with its own vendors, policy and actors.');
    }
    await expectVendorNotFound(page, scopedElsewhere, { canCreate: false });
  });
});

test.describe('vendor usable with every Account of the host', () => {
  test.use({ actor: 'hostAdmin', inputs: { secondCollective: true, vendors: [{ label: 'visibleToAll' }] } });

  test('host admin is offered an unscoped vendor when paying from any hosted Collective', async ({
    page,
    scenario,
  }) => {
    await openVendorPicker(page, scenario.accounts.collective2);
    await expectVendorChoices(page, { offered: [scenario.vendors.visibleToAll] });
  });
});

test.describe('vendor scoped to the host itself', () => {
  test.use({
    inputs: {
      useVendorPolicy: 'HOST_AND_COLLECTIVE_ADMINS',
      vendors: [
        { label: 'hostOnly', usableWith: ['host'] },
        { label: 'collectiveScoped', usableWith: ['collective'] },
      ],
    },
  });

  test('Collective admin is not offered a host-scoped vendor when paying from their Collective', async ({
    page,
    scenario,
  }) => {
    const { hostOnly, collectiveScoped } = scenario.vendors;
    await openVendorPicker(page, scenario.accounts.collective);
    await expectVendorChoices(page, { offered: [collectiveScoped], withheld: [hostOnly] });
    await expectVendorNotFound(page, hostOnly, { canCreate: false });
  });

  test.describe('as the host admin', () => {
    test.use({ actor: 'hostAdmin', inputs: { vendors: [{ label: 'hostOnly', usableWith: ['host'] }] } });

    test('host admin is offered a host-scoped vendor when paying from the host and from a hosted Collective', async ({
      page,
      scenario,
    }) => {
      // Host admins are not bound by the scope of their own vendors.
      await openVendorPicker(page, scenario.accounts.host);
      await expectVendorChoices(page, { offered: [scenario.vendors.hostOnly] });
      await openVendorPicker(page, scenario.accounts.collective);
      await expectVendorChoices(page, { offered: [scenario.vendors.hostOnly] });
    });
  });
});
