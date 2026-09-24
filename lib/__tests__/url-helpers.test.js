import {
  getCollectivePageRoute,
  getProfileCompletionRoute,
  isRelativeHref,
  isTrustedRedirectURL,
} from '../url-helpers';

const unsafeRelativeHrefs = [
  ...Array.from({ length: 32 }, (_, code) => `${String.fromCharCode(code)}//evil.com`),
  ...Array.from({ length: 32 }, (_, code) => `/${String.fromCharCode(code)}/evil.com`),
  '\u007f//evil.com',
  '/\u007f/evil.com',
  '/\\evil.com',
  '\\evil.com',
  '//evil.com',
];

describe('isTrustedRedirectHost', () => {
  it('returns true for valid domains', () => {
    expect(isTrustedRedirectURL(new URL('https://octobox.io'))).toBe(true);
    expect(isTrustedRedirectURL(new URL('https://opencollective.com'))).toBe(true);
    expect(isTrustedRedirectURL(new URL('https://docs.opencollective.com'))).toBe(true);
    expect(isTrustedRedirectURL(new URL('https://documentation.opencollective.com'))).toBe(true);
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
  it('returns true for relative URLs', () => {
    expect(isRelativeHref('/foo')).toBe(true);
    expect(isRelativeHref('/foo/bar')).toBe(true);
    expect(isRelativeHref('/foo/bar?baz=1')).toBe(true);
    expect(isRelativeHref('/foo/bar#baz')).toBe(true);
  });

  it('returns false for absolute URLs and paths without a leading slash', () => {
    expect(isRelativeHref('https://octobox.io')).toBe(false);
    expect(isRelativeHref('http://octobox.io')).toBe(false);
    expect(isRelativeHref('//octobox.io')).toBe(false);
    expect(isRelativeHref('foo')).toBe(false);
    expect(isRelativeHref('foo/bar')).toBe(false);
    expect(isRelativeHref('./foo/bar')).toBe(false);
    expect(isRelativeHref('../foo/bar')).toBe(false);
  });

  it.each(unsafeRelativeHrefs)('returns false for unsafe URL %j', href => {
    expect(isRelativeHref(href)).toBe(false);
  });
});

describe('getCollectivePageRoute', () => {
  it('returns no route for a vendor without a public profile', () => {
    expect(getCollectivePageRoute({ type: 'VENDOR', slug: 'acme', hasPublicProfile: false })).toBe('');
  });

  it('returns a route for a vendor with a public profile', () => {
    expect(getCollectivePageRoute({ type: 'VENDOR', slug: 'acme', hasPublicProfile: true })).toBe('/acme');
  });

  it('defaults a vendor to hidden (no route) when public-profile fields are missing', () => {
    expect(getCollectivePageRoute({ type: 'VENDOR', slug: 'acme' })).toBe('');
  });

  it('returns a route for a vendor whose PUBLIC_PROFILE feature is ACTIVE (fallback)', () => {
    expect(getCollectivePageRoute({ type: 'VENDOR', slug: 'acme', features: { PUBLIC_PROFILE: 'ACTIVE' } })).toBe(
      '/acme',
    );
  });

  it('returns no route for a vendor whose PUBLIC_PROFILE feature is not active (fallback)', () => {
    expect(getCollectivePageRoute({ type: 'VENDOR', slug: 'acme', features: { PUBLIC_PROFILE: 'DISABLED' } })).toBe('');
  });

  it('returns no route for a private standard account', () => {
    expect(getCollectivePageRoute({ type: 'ORGANIZATION', slug: 'acme', isPrivate: true })).toBe('');
  });

  it('returns a route for a standard account with a public profile', () => {
    expect(getCollectivePageRoute({ type: 'ORGANIZATION', slug: 'acme', hasPublicProfile: true })).toBe('/acme');
  });
});

describe('getProfileCompletionRoute', () => {
  it('preserves a relative path, query, and hash', () => {
    expect(getProfileCompletionRoute('/collective/donate?foo=bar#details')).toBe(
      '/signup/profile?next=%2Fcollective%2Fdonate%3Ffoo%3Dbar%23details',
    );
  });

  it('does not preserve an unsafe redirect', () => {
    expect(getProfileCompletionRoute('https://example.com')).toBe('/signup/profile');
  });

  it.each(unsafeRelativeHrefs)('does not preserve unsafe URL %j', href => {
    expect(getProfileCompletionRoute(href)).toBe('/signup/profile');
  });
});
