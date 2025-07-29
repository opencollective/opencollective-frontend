import { isRelativeHref, isTrustedRedirectURL } from '../url-helpers';
import * as WindowLib from '../window';

// Mock the window object to simulate SSR/CSR
jest.mock('../window');

describe('isTrustedRedirectHost', () => {
  it('returns true for valid domains', () => {
    expect(isTrustedRedirectURL(new URL('https://octobox.io'))).toBe(true);
    expect(isTrustedRedirectURL(new URL('https://opencollective.com'))).toBe(true);
    expect(isTrustedRedirectURL(new URL('https://docs.opencollective.com'))).toBe(true);
    expect(isTrustedRedirectURL(new URL('https://app.papertree.earth'))).toBe(true);
    expect(isTrustedRedirectURL(new URL('https://gatherfor.org'))).toBe(true);
  });

  it('returns false for invalid domains', () => {
    expect(isTrustedRedirectURL(new URL('https://wowoctobox.io'))).toBe(false);
    expect(isTrustedRedirectURL(new URL('https://opencollectivez.com'))).toBe(false);
    expect(isTrustedRedirectURL(new URL('https://malicious-opencollective.com'))).toBe(false);
  });
});

describe('isRelativeHref', () => {
  describe('on main website, client-side', () => {
    it('returns true for relative URLs', () => {
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('/foo')).toBe(true);

      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('/foo/bar')).toBe(true);

      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('/foo/bar?baz=1')).toBe(true);

      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('/foo/bar#baz')).toBe(true);
    });

    it('returns false for absolute URLs', () => {
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('https://octobox.io')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('http://octobox.io')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('//octobox.io')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('foo')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('foo/bar')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('./foo/bar')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: 'https://opencollective.com' });
      expect(isRelativeHref('../foo/bar')).toBe(false);
    });
  });

  describe('without window object set, server-side', () => {
    it('returns true for relative URLs', () => {
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('/foo')).toBe(true);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('/foo/bar')).toBe(true);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('/foo/bar?baz=1')).toBe(true);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('/foo/bar#baz')).toBe(true);
    });

    it('returns false for absolute URLs', () => {
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('https://octobox.io')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('http://octobox.io')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('//octobox.io')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('foo')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('foo/bar')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('./foo/bar')).toBe(false);
      WindowLib.getWindowLocation.mockReturnValueOnce({ origin: undefined });
      expect(isRelativeHref('../foo/bar')).toBe(false);
    });
  });
});
