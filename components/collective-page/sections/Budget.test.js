import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render } from '@testing-library/react';

import { withRequiredProviders } from '../../../test/providers';

import SectionBudget, { getBudgetSectionQuery } from './Budget';

const useQueryMock = jest.fn(() => ({
  data: undefined,
  loading: true,
  refetch: jest.fn(),
}));

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useQuery: (...args) => useQueryMock(...args),
  };
});

jest.mock('../../UserProvider', () => ({
  withUser: Component => Component,
}));

const collective = {
  slug: 'test-collective',
  name: 'Test Collective',
  type: 'COLLECTIVE',
  isHost: false,
  host: { slug: 'test-host' },
};

describe('SectionBudget', () => {
  beforeEach(() => {
    useQueryMock.mockClear();
  });

  it('uses cache-and-network so remounts show newly submitted expenses', () => {
    render(
      withRequiredProviders(
        <MockedProvider>
          <SectionBudget collective={collective} LoggedInUser={null} />
        </MockedProvider>,
      ),
    );

    const budgetQuery = getBudgetSectionQuery(true, false);
    const budgetCall = useQueryMock.mock.calls.find(([query]) => query === budgetQuery);
    expect(budgetCall).toBeDefined();
    expect(budgetCall[1]).toEqual(expect.objectContaining({ fetchPolicy: 'cache-and-network' }));
  });
});
