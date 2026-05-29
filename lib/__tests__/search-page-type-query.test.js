import { DEFAULT_SEARCH_TYPES, FILTERS, normalizeSearchTypes } from '../search-page-type-query';

describe('normalizeSearchTypes', () => {
  it('returns default multi-select types when query is missing or empty', () => {
    expect(normalizeSearchTypes(undefined)).toEqual(DEFAULT_SEARCH_TYPES);
    expect(normalizeSearchTypes(null)).toEqual(DEFAULT_SEARCH_TYPES);
    expect(normalizeSearchTypes('')).toEqual(DEFAULT_SEARCH_TYPES);
  });

  it('accepts a single valid type (uppercase)', () => {
    expect(normalizeSearchTypes('COLLECTIVE')).toEqual(['COLLECTIVE']);
    expect(normalizeSearchTypes('HOST')).toEqual(['HOST']);
    expect(normalizeSearchTypes('FUND')).toEqual(['FUND']);
  });

  it('normalizes case and trims segments', () => {
    expect(normalizeSearchTypes('collective')).toEqual(['COLLECTIVE']);
    expect(normalizeSearchTypes(' Collective ')).toEqual(['COLLECTIVE']);
    expect(normalizeSearchTypes('event, organization')).toEqual(['EVENT', 'ORGANIZATION']);
  });

  it('filters out unknown types and falls back to defaults when none remain', () => {
    expect(normalizeSearchTypes('not-a-real-type')).toEqual(DEFAULT_SEARCH_TYPES);
    expect(normalizeSearchTypes('foo')).toEqual(DEFAULT_SEARCH_TYPES);
  });

  it('keeps only valid types when mixed with invalid', () => {
    expect(normalizeSearchTypes('COLLECTIVE,invalid,EVENT')).toEqual(['COLLECTIVE', 'EVENT']);
  });

  it('handles Next.js-style query.type as string[]', () => {
    expect(normalizeSearchTypes(['COLLECTIVE', 'EVENT'])).toEqual(['COLLECTIVE', 'EVENT']);
  });

  it('includes every FILTERS value as valid', () => {
    Object.values(FILTERS).forEach(key => {
      expect(normalizeSearchTypes(key)).toEqual([key]);
    });
  });

  it('returns defaults when decodeURIComponent fails', () => {
    expect(normalizeSearchTypes('%')).toEqual(DEFAULT_SEARCH_TYPES);
  });
});
