import '@testing-library/jest-dom';

import React from 'react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import { render, waitFor } from '@testing-library/react';
import { print } from 'graphql';

import { withRequiredProviders } from '../../../../test/providers';

import { syncTransactionsImportMutation, TransactionsImportForceSyncButton } from './TransactionsImportForceSyncButton';

const mockToast = jest.fn();
jest.mock('../../../ui/useToast', () => ({ useToast: () => ({ toast: mockToast }) }));

describe('TransactionsImportForceSyncButton', () => {
  it('requests isSyncing and lastSyncAt so the cache can update after a resync', () => {
    const mutation = print(syncTransactionsImportMutation);
    expect(mutation).toMatch(/isSyncing/);
    expect(mutation).toMatch(/lastSyncAt/);
  });

  it('resets hasRequestedSync when a running sync finishes', async () => {
    const setHasRequestedSync = jest.fn();
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([]),
    });

    const { rerender } = render(
      withRequiredProviders(
        <TransactionsImportForceSyncButton
          hasRequestedSync
          setHasRequestedSync={setHasRequestedSync}
          transactionImportId="import-1"
          isSyncing
        />,
        { ApolloProvider: { client } },
      ),
    );

    rerender(
      withRequiredProviders(
        <TransactionsImportForceSyncButton
          hasRequestedSync
          setHasRequestedSync={setHasRequestedSync}
          transactionImportId="import-1"
          isSyncing={false}
        />,
        { ApolloProvider: { client } },
      ),
    );

    await waitFor(() => {
      expect(setHasRequestedSync).toHaveBeenCalledWith(false);
    });
  });
});
