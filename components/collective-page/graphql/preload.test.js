import { getFilteredSectionsForCollective, getSectionsNames } from '../../../lib/collective-sections';

import { budgetSectionContributionsQuery } from '../sections/Budget/ContributionsBudget';
import { budgetSectionExpenseQuery } from '../sections/Budget/ExpenseBudget';
import { budgetSectionQuery, getBudgetSectionVariables } from '../sections/FinancialOverview';

import { preloadCollectivePageGraphqlQueries } from './preload';

jest.mock('../../../lib/collective-sections');

describe('preloadCollectivePageGraphqlQueries', () => {
  it('preloads all queries used by the V2 budget section', async () => {
    const collective = { slug: 'babel', type: 'COLLECTIVE' };
    const client = { query: jest.fn().mockResolvedValue({}) };
    getFilteredSectionsForCollective.mockReturnValue([{ name: 'BUDGET', sections: [{ name: 'budget', version: 2 }] }]);
    getSectionsNames.mockReturnValue(['budget']);

    await preloadCollectivePageGraphqlQueries(client, collective);

    expect(client.query).toHaveBeenCalledTimes(3);
    expect(client.query).toHaveBeenCalledWith({
      query: budgetSectionQuery,
      variables: getBudgetSectionVariables(collective),
    });
    expect(client.query).toHaveBeenCalledWith({
      query: budgetSectionExpenseQuery,
      variables: { slug: collective.slug, from: null, to: null },
    });
    expect(client.query).toHaveBeenCalledWith({
      query: budgetSectionContributionsQuery,
      variables: { slug: collective.slug, from: null, to: null },
    });
  });
});
