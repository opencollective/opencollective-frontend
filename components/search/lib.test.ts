import { ApolloError, gql } from '@apollo/client';

import { initClient } from '../../lib/apollo-client';

import { SearchEntity } from './filters';
import { getVisibleErrors } from './lib';

const entityError = (field: string, message: string) => ({ message, path: ['search', 'results', field] });

describe('getVisibleErrors', () => {
  const error = new ApolloError({
    graphQLErrors: [entityError('transactions', 'Narrow your search'), entityError('expenses', 'Search failed')],
  });

  it('shows the errors of every entity on the "All" tab', () => {
    expect(getVisibleErrors(error, SearchEntity.ALL).map(e => e.error.graphQLErrors[0].message)).toEqual([
      'Narrow your search',
      'Search failed',
    ]);
  });

  it('only shows the errors of the selected entity on its tab', () => {
    expect(getVisibleErrors(error, SearchEntity.EXPENSES).map(e => e.error.graphQLErrors[0].message)).toEqual([
      'Search failed',
    ]);
    expect(getVisibleErrors(error, SearchEntity.ACCOUNTS)).toEqual([]);
  });

  it('always shows errors that are not about one entity', () => {
    const rootError = new ApolloError({ graphQLErrors: [{ message: 'Turned off', path: ['search'] }] });
    expect(getVisibleErrors(rootError, SearchEntity.ACCOUNTS)).toHaveLength(1);
  });
});

describe('search results cache', () => {
  const query = gql`
    query SearchCacheTest($offset: Int) {
      search {
        results {
          expenses(offset: $offset) {
            collection {
              totalCount
              nodes {
                id
              }
            }
          }
        }
      }
    }
  `;
  const page = (ids: string[]) => ({
    __typename: 'SearchResultsExpenses',
    collection: {
      __typename: 'ExpenseCollection',
      totalCount: 10,
      nodes: ids.map(id => ({ __typename: 'Expense', id })),
    },
  });
  const write = (cache, offset: number, expenses) =>
    cache.writeQuery({
      query,
      variables: { offset, __infiniteScroll: true },
      data: { search: { __typename: 'SearchResponse', results: { __typename: 'SearchResults', expenses } } },
    });

  it('keeps the loaded results when a next page fails', () => {
    const { cache } = initClient();
    write(cache, 0, page(['a', 'b']));
    write(cache, 2, page(['c']));
    write(cache, 3, null); // Field error on the next page (`errorPolicy: 'all'`)
    const data = cache.readQuery({ query, variables: { offset: 0, __infiniteScroll: true } }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(data.search.results.expenses.collection.nodes.map(node => node.id)).toEqual(['a', 'b', 'c']);
  });
});
