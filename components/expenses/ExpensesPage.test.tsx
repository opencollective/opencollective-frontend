import '@testing-library/jest-dom';

import React from 'react';
import { render } from '@testing-library/react';

import type { ExpensesPageQuery } from '../../lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../test/providers';

import { EXPENSE_DIRECTION } from './filters/DirectionFilter';
import Expenses, { expensesPageQuery } from './ExpensesPage';

const useQueryMock = jest.fn(() => ({
  data: undefined,
  loading: true,
  refetch: jest.fn(),
})) as jest.Mock;

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  };
});

jest.mock('../../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: null }),
}));

jest.mock('../../lib/hooks/useQueryFilter', () => ({
  __esModule: true,
  default: () => ({
    variables: { limit: 10, offset: 0 },
    values: { direction: 'RECEIVED', limit: 10, offset: 0 },
    setFilter: jest.fn(),
    hasFilters: false,
    resetFilters: jest.fn(),
  }),
}));

jest.mock('../dashboard/filters/Filterbar', () => ({ Filterbar: () => null }));
jest.mock('../dashboard/filters/Pagination', () => ({ Pagination: () => null }));
jest.mock('./ExpensesList', () => () => null);
jest.mock('./ExpenseInfoSidebar', () => () => null);

describe('ExpensesPage', () => {
  beforeEach(() => {
    useQueryMock.mockClear();
  });

  it('uses cache-and-network so newly submitted expenses appear without a manual refresh', () => {
    render(
      withRequiredProviders(
        <Expenses
          account={
            { id: 'acc-1', slug: 'test-collective', legacyId: 1, currency: 'USD' } as ExpensesPageQuery['account']
          }
          expenses={undefined}
          direction={EXPENSE_DIRECTION.RECEIVED}
        />,
      ),
    );

    const expensesCall = useQueryMock.mock.calls.find(call => call[0] === expensesPageQuery);
    expect(expensesCall).toBeDefined();
    expect(expensesCall?.[1]).toEqual(expect.objectContaining({ fetchPolicy: 'cache-and-network' }));
  });
});
