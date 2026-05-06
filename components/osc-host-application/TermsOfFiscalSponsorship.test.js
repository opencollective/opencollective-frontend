/**
 * Unit tests for TermsOfFiscalSponsorship - GitHub redirect flow.
 *
 * Verifies that the GitHub OAuth initiation uses fetch() with an Authorization
 * header (via addAuthTokenToHeader) and navigates to the returned redirectUrl,
 * instead of embedding the session JWT as access_token in window.location.href.
 */

import '@testing-library/jest-dom';

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { withRequiredProviders } from '../../test/providers';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../../lib/api', () => ({
  addAuthTokenToHeader: jest.fn(() => ({ Authorization: 'Bearer test-session-jwt' })),
}));

jest.mock('../../lib/hooks/useLoggedInUser', () => jest.fn(() => ({ LoggedInUser: { id: 1, slug: 'test-user' } })));

jest.mock('../collectives/HomeNextIllustration', () => () => <img alt="mock" />);
jest.mock('./ApplicationDescription', () => () => <div data-testid="app-description" />);
jest.mock('../I18nFormatters', () => ({
  getI18nLink: () =>
    function LinkMock({ children }) {
      // eslint-disable-next-line jsx-a11y/anchor-is-valid
      return <a>{children}</a>;
    },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { addAuthTokenToHeader } from '../../lib/api';

import TermsOfFiscalSponsorship from './TermsOfFiscalSponsorship';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const renderComponent = (props = {}) => {
  const ui = <TermsOfFiscalSponsorship checked={true} onChecked={jest.fn()} {...props} />;
  return render(withRequiredProviders(ui));
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TermsOfFiscalSponsorship - redirectToGithub', () => {
  let fetchMock;

  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        redirectUrl: 'https://github.com/login/oauth/authorize?state=test-state-uuid',
      }),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('calls fetch with Authorization header when clicking the GitHub verify button', async () => {
    renderComponent();

    const verifyButton = screen.getByRole('button', { name: /verify using github/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/connected-accounts/github/oauthUrl');
    expect(options.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer test-session-jwt' }));
  });

  it('does NOT include access_token in the URL sent to the API (security regression)', async () => {
    renderComponent();

    const verifyButton = screen.getByRole('button', { name: /verify using github/i });
    fireEvent.click(verifyButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url] = fetchMock.mock.calls[0];
    expect(url).not.toContain('access_token');
  });

  it('includes context=createCollective in the URL', async () => {
    renderComponent();

    const verifyButton = screen.getByRole('button', { name: /verify using github/i });
    fireEvent.click(verifyButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(url, 'http://localhost');
    expect(parsed.searchParams.get('context')).toBe('createCollective');
  });

  it('calls addAuthTokenToHeader to build the Authorization header', async () => {
    renderComponent();

    const verifyButton = screen.getByRole('button', { name: /verify using github/i });
    fireEvent.click(verifyButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    expect(addAuthTokenToHeader).toHaveBeenCalled();
  });

  it('does not include access_token in the Authorization header value', async () => {
    renderComponent();

    const verifyButton = screen.getByRole('button', { name: /verify using github/i });
    fireEvent.click(verifyButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [, options] = fetchMock.mock.calls[0];
    const authHeader = options?.headers?.Authorization ?? '';
    // The auth header should be a Bearer token, not contain "access_token" as a key
    expect(authHeader).toMatch(/^Bearer /);
    expect(options.headers).not.toHaveProperty('access_token');
  });
});
