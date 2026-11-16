import Router from 'next/router';

import { IgnorableError } from './errors';
import { forceFullPageLoad, requiresFullPageLoad } from './full-page-load';

jest.mock('next/router', () => ({ __esModule: true, default: { events: { emit: jest.fn() } } }));

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

describe('forceFullPageLoad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stops the loading indicator and aborts the client-side navigation for listed paths', () => {
    expect(() => forceFullPageLoad('/phpfoundation/hybrid')).toThrow(IgnorableError);
    expect(Router.events.emit).toHaveBeenCalledWith('routeChangeError');
  });

  it('lets other navigations through', () => {
    expect(() => forceFullPageLoad('/dashboard')).not.toThrow();
    expect(Router.events.emit).not.toHaveBeenCalled();
  });
});
