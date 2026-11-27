import { getRequiredInformation } from '../utils';

const buildCollective = thresholds => ({
  host: { id: 'host' },
  policies: { CONTRIBUTOR_INFO_THRESHOLDS: thresholds },
});

describe('getRequiredInformation', () => {
  it('requires info when the contribution reaches the threshold', () => {
    const collective = buildCollective({ legalName: 250e2, address: 500e2 });
    expect(getRequiredInformation(null, { amount: 100e2 }, collective, [], null)).toEqual({
      legalName: false,
      address: false,
    });
    expect(getRequiredInformation(null, { amount: 300e2 }, collective, [], null)).toEqual({
      legalName: true,
      address: false,
    });
  });

  it('always requires info when the threshold is 0', () => {
    const collective = buildCollective({ legalName: 0, address: 0 });
    expect(getRequiredInformation(null, { amount: 1e2 }, collective, [], null)).toEqual({
      legalName: true,
      address: true,
    });
  });

  it('does not require info when no threshold is set', () => {
    const collective = buildCollective({});
    expect(getRequiredInformation(null, { amount: 1000e2 }, collective, [], null)).toEqual({
      legalName: false,
      address: false,
    });
  });
});
