import '@testing-library/jest-dom';

import React from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { render, screen, waitFor } from '@testing-library/react';

import { withRequiredProviders } from '../../../../test/providers';

import { DashboardContext } from '../../DashboardContext';

import { HostTodoList } from './TodoList';

const hostAccount = { slug: 'test-host', type: 'ORGANIZATION', hasHosting: true };

const dashboardContextValue = {
  selectedSection: 'overview',
  subpath: [],
  expandedSection: null,
  setExpandedSection: () => {},
  account: hostAccount,
  activeSlug: 'test-host',
  defaultSlug: 'test-host',
  setDefaultSlug: () => {},
  getProfileUrl: () => null,
};

const buildHostTodoData = (toPayCount: number) => ({
  host: {
    __typename: 'Host',
    id: 'host-1',
    unrepliedApplications: { __typename: 'HostApplicationCollection', totalCount: 0 },
    pendingApplications: { __typename: 'HostApplicationCollection', totalCount: 0 },
    disputedOrders: { __typename: 'OrderCollection', totalCount: 0 },
    inReviewOrders: { __typename: 'OrderCollection', totalCount: 0 },
  },
  unrepliedExpenses: { __typename: 'ExpenseCollection', totalCount: 0 },
  toPayExpenses: { __typename: 'ExpenseCollection', totalCount: toPayCount },
  missingReceiptExpenses: { __typename: 'ExpenseCollection', totalCount: 0 },
  onHoldExpenses: { __typename: 'ExpenseCollection', totalCount: 0 },
  incompleteExpenses: { __typename: 'ExpenseCollection', totalCount: 0 },
  errorExpenses: { __typename: 'ExpenseCollection', totalCount: 0 },
});

const renderTodoList = (client: ApolloClient<object>) =>
  render(
    withRequiredProviders(
      <DashboardContext.Provider value={dashboardContextValue}>
        <HostTodoList />
      </DashboardContext.Provider>,
      { ApolloProvider: { client } },
    ),
  );

describe('HostTodoList', () => {
  it('refetches to-pay counts when remounted after expenses are paid', async () => {
    let hostTodoCalls = 0;
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new ApolloLink(operation => {
        return new Observable(observer => {
          if (operation.operationName === 'HostTodo') {
            hostTodoCalls += 1;
            observer.next({ data: buildHostTodoData(hostTodoCalls === 1 ? 2 : 0) });
          } else {
            observer.next({ data: {} });
          }
          observer.complete();
        });
      }),
    });

    const { unmount } = renderTodoList(client);
    expect(await screen.findByText('2 to pay')).toBeInTheDocument();
    unmount();

    renderTodoList(client);

    await waitFor(() => {
      expect(screen.queryByText('2 to pay')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('You’re all caught up.')).toBeInTheDocument();
    expect(hostTodoCalls).toBeGreaterThanOrEqual(2);
  });
});
