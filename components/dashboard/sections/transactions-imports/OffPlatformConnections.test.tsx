import '@testing-library/jest-dom';

import React from 'react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withRequiredProviders } from '../../../../test/providers';

import { DashboardContext } from '../../DashboardContext';

import { OffPlatformConnections, offPlatformConnectionsQuery } from './OffPlatformConnections';

jest.mock('../../../../lib/hooks/usePlaidConnectDialog', () => ({
  usePlaidConnectDialog: () => ({
    status: 'idle',
    show: jest.fn(),
  }),
}));

const OLD_SYNC_AT = '2026-01-01T00:00:00.000Z';
const NEW_SYNC_AT = '2026-06-15T12:00:00.000Z';

const buildImport = (overrides = {}) => ({
  __typename: 'TransactionsImport',
  id: 'import-1',
  publicId: 'pub-1',
  source: 'Chase',
  name: 'Checking',
  type: 'PLAID',
  createdAt: OLD_SYNC_AT,
  updatedAt: OLD_SYNC_AT,
  lastSyncAt: OLD_SYNC_AT,
  isSyncing: false,
  institutionId: 'ins-1',
  institutionAccounts: [],
  assignments: [],
  stats: {
    __typename: 'TransactionsImportStats',
    total: 0,
    ignored: 0,
    onHold: 0,
    expenses: 0,
    orders: 0,
    processed: 0,
    pending: 0,
    imported: 0,
  },
  account: { __typename: 'Host', id: 'host-1', legacyId: 1 },
  connectedAccount: { __typename: 'ConnectedAccount', id: 'ca-1', authorizationExpiresAt: null },
  ...overrides,
});

const connectionsMock = {
  request: {
    query: offPlatformConnectionsQuery,
    variables: { accountSlug: 'test-host', limit: 20, offset: 0 },
  },
  result: {
    data: {
      host: {
        __typename: 'Host',
        id: 'host-1',
        slug: 'test-host',
        location: { __typename: 'Location', country: 'US' },
        transactionsImports: {
          __typename: 'TransactionsImportsCollection',
          totalCount: 1,
          limit: 20,
          offset: 0,
          nodes: [buildImport()],
        },
      },
    },
  },
};

const dashboardContextValue = {
  selectedSection: 'off-platform-connections',
  subpath: [],
  expandedSection: null,
  setExpandedSection: () => {},
  account: { slug: 'test-host', type: 'ORGANIZATION', features: { OFF_PLATFORM_TRANSACTIONS: 'ACTIVE' } },
  activeSlug: 'test-host',
  defaultSlug: 'test-host',
  setDefaultSlug: () => {},
  getProfileUrl: () => null,
};

describe('OffPlatformConnections', () => {
  it('updates last sync in the settings modal when the import cache changes', async () => {
    const user = userEvent.setup();
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([connectionsMock]),
    });

    render(
      withRequiredProviders(
        <DashboardContext.Provider value={dashboardContextValue}>
          <OffPlatformConnections accountSlug="test-host" />
        </DashboardContext.Provider>,
        { ApolloProvider: { client } },
      ),
    );

    expect(await screen.findByText('Chase')).toBeInTheDocument();

    const row = screen.getByText('Chase').closest('tr');
    await user.click(within(row as HTMLElement).getAllByRole('button')[0]);
    await user.click(await screen.findByText('Settings'));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('tab', { name: 'Advanced' }));
    expect(await within(dialog).findByText(/January 1, 2026/)).toBeInTheDocument();

    client.cache.modify({
      id: client.cache.identify({ __typename: 'TransactionsImport', id: 'import-1' }),
      fields: {
        lastSyncAt: () => NEW_SYNC_AT,
        isSyncing: () => false,
      },
    });

    expect(await within(dialog).findByText(/June 15, 2026/)).toBeInTheDocument();
  });
});
