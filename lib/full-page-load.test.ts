import { requiresFullPageLoad } from './full-page-load';

describe('requiresFullPageLoad', () => {
  it('matches listed paths, ignoring query, hash, trailing slash and case', () => {
    expect(requiresFullPageLoad('/phpfoundation/hybrid')).toBe(true);
    expect(requiresFullPageLoad('/phpfoundation/hybrid/')).toBe(true);
    expect(requiresFullPageLoad('/phpfoundation/hybrid?currency=EUR#finances')).toBe(true);
    expect(requiresFullPageLoad('/PHPFoundation/Hybrid')).toBe(true);
  });

  it('does not match other paths', () => {
    expect(requiresFullPageLoad('/phpfoundation')).toBe(false);
    expect(requiresFullPageLoad('/phpfoundation/hybrid/transactions')).toBe(false);
    expect(requiresFullPageLoad('/dashboard')).toBe(false);
  });
});
