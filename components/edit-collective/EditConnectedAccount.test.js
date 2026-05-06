/**
 * Unit tests for EditConnectedAccount - GitHub connect flow.
 *
 * Verifies that the GitHub OAuth initiation uses the connectAccount() helper
 * (which sends an Authorization header via fetch) instead of a direct
 * window.location.href navigation that embedded the session JWT in the URL.
 */

import '@testing-library/jest-dom';

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { withRequiredProviders } from '../../test/providers';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../lib/api', () => ({
  connectAccount: jest.fn(),
  connectAccountCallback: jest.fn(),
  disconnectAccount: jest.fn(),
}));

jest.mock('../../lib/hooks/useLoggedInUser', () => () => ({ LoggedInUser: { id: 1 } }));

jest.mock('../ConnectedAccountsTable', () => ({
  ConnectedAccountsTable: () => <div data-testid="connected-accounts-table" />,
}));

jest.mock('@sentry/browser', () => ({
  captureException: jest.fn(),
}));

jest.mock('../ui/useToast', () => ({
  toast: jest.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { connectAccount } from '../../lib/api';

import EditConnectedAccount from './EditConnectedAccount';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockCollective = { id: 42, slug: 'test-collective', type: 'COLLECTIVE', settings: {} };

const renderComponent = (props = {}) => {
  const intl = { formatMessage: msg => msg.defaultMessage || msg.id };
  const router = { asPath: '/test-collective/admin/connected-accounts', replace: jest.fn(), query: {} };
  const client = { query: jest.fn(), resetStore: jest.fn() };

  const ui = (
    <EditConnectedAccount
      collective={mockCollective}
      intl={intl}
      router={router}
      client={client}
      service="github"
      {...props}
    />
  );
  return render(withRequiredProviders(ui));
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EditConnectedAccount - GitHub connect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectAccount.mockResolvedValue({ redirectUrl: 'https://github.com/login/oauth/authorize?state=uuid' });
  });

  it('uses connectAccount() for GitHub (not a raw window.location.href with access_token)', async () => {
    renderComponent();

    const connectButton = screen.getByRole('button', { name: /connect/i });
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(connectAccount).toHaveBeenCalledTimes(1);
    });

    const [collectiveId, service] = connectAccount.mock.calls[0];
    expect(collectiveId).toBe(mockCollective.id);
    expect(service).toBe('github');
  });

  it('does NOT pass access_token in the arguments to connectAccount()', async () => {
    renderComponent();

    const connectButton = screen.getByRole('button', { name: /connect/i });
    fireEvent.click(connectButton);

    await waitFor(() => expect(connectAccount).toHaveBeenCalled());

    // connectAccount() is an API call that uses Authorization headers internally.
    // The options object passed to it must not contain access_token.
    const [, , options] = connectAccount.mock.calls[0];
    if (options) {
      const optStr = JSON.stringify(options);
      expect(optStr).not.toContain('access_token');
    }
  });

  it('shows an error toast when connectAccount() throws', async () => {
    const { toast } = require('../ui/useToast.tsx');
    connectAccount.mockRejectedValue(new Error('Network error'));

    renderComponent();

    const connectButton = screen.getByRole('button', { name: /connect/i });
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
    });
  });

  it('shows an error toast when the API returns an invalid redirectUrl', async () => {
    const { toast } = require('../ui/useToast.tsx');
    connectAccount.mockResolvedValue({ redirectUrl: 'not-a-valid-url' });

    renderComponent();

    const connectButton = screen.getByRole('button', { name: /connect/i });
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
    });
  });

  it('does not show an error toast on successful connect', async () => {
    const { toast } = require('../ui/useToast.tsx');

    renderComponent();

    const connectButton = screen.getByRole('button', { name: /connect/i });
    fireEvent.click(connectButton);

    await waitFor(() => expect(connectAccount).toHaveBeenCalled());

    // Give it time for any potential error toast to appear
    await new Promise(r => setTimeout(r, 50));

    expect(toast).not.toHaveBeenCalled();
  });
});
