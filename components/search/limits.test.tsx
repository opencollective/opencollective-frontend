import { getSearchVariables, SEARCH_LIMITS } from './limits';

describe('getSearchVariables', () => {
  it('caps every page size to the maximum supported by the search', () => {
    const variables = getSearchVariables({
      searchTerm: 'test',
      limit: 100,
      accountsLimit: 75,
      expensesLimit: 10,
      offset: 200,
      includeAccounts: true,
    });

    expect(variables).toEqual({
      searchTerm: 'test',
      limit: SEARCH_LIMITS.maxLimit,
      accountsLimit: SEARCH_LIMITS.maxLimit,
      expensesLimit: 10,
      offset: 200,
      includeAccounts: true,
    });
  });
});
