// The form imports the address inputs, which load an ESM-only package
jest.mock('../../StyledInputLocation', () => () => null);

import { validateGuestProfile } from '../StepProfileGuestForm';
import { LEGAL_NAME_PATTERN, locationHasAddress } from '../utils';

const collective = {
  currency: 'USD',
  host: { id: 1 },
  policies: { CONTRIBUTOR_INFO_THRESHOLDS: { legalName: 250e2, address: 5000e2 } },
};

const details = (amount: number) => ({ amount, quantity: 1, interval: null, platformTip: 0 });
const profile = (overrides = {}) => ({ email: 'guest@example.com', name: 'Guest', ...overrides });
const fullAddress = { country: 'US', structured: { address1: '1 Main St', city: 'Springfield' } };

describe('validateGuestProfile', () => {
  it('lets guests skip the legal name when the policy does not require it', () => {
    expect(validateGuestProfile(profile(), details(100e2), null, collective)).toBe(true);
  });

  it('rejects a too short legal name even when it is not required', () => {
    expect(validateGuestProfile(profile({ legalName: 'Bob' }), details(100e2), null, collective)).toBe(false);
    expect(validateGuestProfile(profile({ legalName: 'Bob Smith' }), details(100e2), null, collective)).toBe(true);
  });

  it('requires the legal name itself, with at least 5 characters, when the policy requires it', () => {
    const amount = details(300e2);
    expect(validateGuestProfile(profile({ name: 'Display Name' }), amount, null, collective)).toBe(false);
    expect(validateGuestProfile(profile({ legalName: ' Bob ' }), amount, null, collective)).toBe(false);
    expect(validateGuestProfile(profile({ legalName: 'Robert Smith' }), amount, null, collective)).toBe(true);
  });

  it('requires an actual address, not only a country, when the policy requires it', () => {
    const amount = details(6000e2);
    const withLocation = location => profile({ legalName: 'Robert Smith', location });
    expect(validateGuestProfile(withLocation({ country: 'US', structured: {} }), amount, null, collective)).toBe(false);
    expect(
      validateGuestProfile(withLocation({ country: 'US', structured: { city: ' ' } }), amount, null, collective),
    ).toBe(false);
    expect(validateGuestProfile(withLocation({ structured: fullAddress.structured }), amount, null, collective)).toBe(
      false,
    );
    expect(validateGuestProfile(withLocation(fullAddress), amount, null, collective)).toBe(true);
  });
});

describe('locationHasAddress', () => {
  it('matches the API rule', () => {
    expect(locationHasAddress(null)).toBe(false);
    expect(locationHasAddress({ country: 'FR' })).toBe(false);
    expect(locationHasAddress({ address: '  ' })).toBe(false);
    expect(locationHasAddress({ address: '1 Main St' })).toBe(true);
    expect(locationHasAddress({ structured: { address2: '', city: 'Paris' } })).toBe(true);
  });
});

describe('LEGAL_NAME_PATTERN', () => {
  // Browsers anchor `pattern` and compile it with the `v` flag
  const regex = new RegExp(`^(?:${LEGAL_NAME_PATTERN})$`, 'v');

  it('requires 5 characters once trimmed', () => {
    expect(['Bob', ' Bob ', '  abcd  '].map(value => regex.test(value))).toEqual([false, false, false]);
    expect(['Bob S', 'a b c', ' Robert Smith '].map(value => regex.test(value))).toEqual([true, true, true]);
  });
});
