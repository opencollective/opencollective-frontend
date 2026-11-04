import '@testing-library/jest-dom';

jest.mock('next/router', () => {
  const router = {
    pathname: '/',
    route: '/',
    asPath: '/',
    query: {},
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  };
  return {
    __esModule: true,
    default: { router, push: jest.fn(), events: router.events },
    withRouter: Component => Component,
    useRouter: () => router,
  };
});

jest.mock('../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: null, loadingLoggedInUser: false }),
}));

jest.mock('../lib/errors', () => ({
  __esModule: true,
  ...jest.requireActual('../lib/errors'),
  i18nGraphqlException: jest.fn(() => 'GraphQL error message'),
}));

const mockQueryState = { current: null };

jest.mock('@apollo/client', () => ({
  __esModule: true,
  ...jest.requireActual('@apollo/client'),
  useQuery: () => mockQueryState.current,
  useMutation: () => [jest.fn(), { loading: false }],
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../lib/theme';

import { TooltipProvider } from './ui/Tooltip';
import ApplyToHostModal from './ApplyToHostModal';

const host = {
  __typename: 'Host',
  id: 'host-1',
  legacyId: 42,
  type: 'ORGANIZATION',
  slug: 'test-host',
  name: 'Test Host',
  createdAt: '2020-01-01T00:00:00Z',
  currency: 'USD',
  isOpenToApplications: true,
  termsUrl: null,
  longDescription: 'Welcome to the host',
  hostFeePercent: 10,
  platformContributionAvailable: false,
  settings: {},
  policies: { __typename: 'Policies', id: 'policy-1', COLLECTIVE_MINIMUM_ADMINS: { numberOfAdmins: 1 } },
};

const account = {
  __typename: 'Collective',
  id: 'account-1',
  slug: 'test-collective',
  name: 'Test Collective',
  type: 'COLLECTIVE',
  imageUrl: null,
  memberInvitations: [],
  admins: { __typename: 'MemberCollection', nodes: [] },
};

const renderModal = ({ error = null } = {}) => {
  mockQueryState.current = { data: { host, account }, loading: false, error };

  return render(
    <IntlProvider locale="en" messages={{}}>
      <ThemeProvider theme={theme}>
        <TooltipProvider>
          <ApplyToHostModal
            hostSlug="test-host"
            collective={{ id: 'account-1', slug: 'test-collective', name: 'Test Collective' }}
            onClose={() => undefined}
          />
        </TooltipProvider>
      </ThemeProvider>
    </IntlProvider>,
  );
};

describe('ApplyToHostModal', () => {
  it('renders the GraphQL error message instead of the raw error object', async () => {
    renderModal({ error: new Error('Something went wrong') });

    await userEvent.click(await screen.findByRole('button', { name: /Next/ }));

    expect(await screen.findByText('GraphQL error message')).toBeInTheDocument();
  });

  it('renders the back button as a real button (type="button")', async () => {
    renderModal();

    await userEvent.click(await screen.findByRole('button', { name: /Next/ }));

    expect(screen.getByRole('button', { name: /Back/ })).toHaveAttribute('type', 'button');
  });
});
