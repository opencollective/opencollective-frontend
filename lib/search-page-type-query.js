/** Filter keys for /search ?type= — must match I18nFilters in pages/search.js */
export const FILTERS = {
  ALL: 'ALL',
  COLLECTIVE: 'COLLECTIVE',
  EVENT: 'EVENT',
  ORGANIZATION: 'ORGANIZATION',
  HOST: 'HOST',
  PROJECT: 'PROJECT',
  FUND: 'FUND',
};

export const DEFAULT_SEARCH_TYPES = ['COLLECTIVE', 'EVENT', 'ORGANIZATION', 'FUND', 'PROJECT'];

const VALID_SEARCH_TYPES = Object.values(FILTERS);

/**
 * Parses and validates the `type` query param for the search page.
 * Invalid or unknown values fall back to {@link DEFAULT_SEARCH_TYPES}.
 */
export const normalizeSearchTypes = queryType => {
  if (!queryType) {
    return DEFAULT_SEARCH_TYPES;
  }
  const raw = Array.isArray(queryType) ? queryType.join(',') : queryType;
  try {
    const types = decodeURIComponent(raw)
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(t => VALID_SEARCH_TYPES.includes(t));
    return types.length > 0 ? types : DEFAULT_SEARCH_TYPES;
  } catch {
    return DEFAULT_SEARCH_TYPES;
  }
};
