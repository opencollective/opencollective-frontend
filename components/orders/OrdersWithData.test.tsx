import '@testing-library/jest-dom';

import React from 'react';
import { useQuery } from '@apollo/client';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import OrdersWithData from './OrdersWithData';

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({ query: {}, asPath: '/dashboard/test/incoming-contributions', push: jest.fn() }),
}));

jest.mock('../../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: { isAdminOfCollective: () => true } }),
}));

jest.mock('../dashboard/sections/collectives/DisputedContributionsWarning', () => ({
  DisputedContributionsWarning: () => null,
}));

jest.mock('../dashboard/sections/contributions/CreatePendingOrderModal', () => ({
  __esModule: true,
  default: ({ open, hostSlug }) => (
    <div data-testid="create-pending-order-modal" data-open={String(open)} data-host-slug={hostSlug} />
  ),
}));

jest.mock('./OrdersFilters', () => ({ __esModule: true, default: () => null }));
jest.mock('./OrdersList', () => ({ __esModule: true, default: () => null }));
jest.mock('../Pagination', () => ({ __esModule: true, default: () => null }));
jest.mock('../SearchBar', () => ({ __esModule: true, default: () => null }));

const renderWithIntl = ui => render(<IntlProvider locale="en">{ui}</IntlProvider>);

describe('OrdersWithData', () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        account: { slug: 'test', currency: 'USD', isHost: false },
        orders: { nodes: [{ id: 'order-1' }], totalCount: 1 },
      },
      error: undefined,
      loading: false,
      variables: { limit: 15, offset: 0 },
      refetch: jest.fn(),
    });
  });

  it('opens the create pending contribution modal when clicking the create button', () => {
    renderWithIntl(<OrdersWithData accountSlug="test" canCreatePendingOrder />);

    expect(screen.queryByTestId('create-pending-order-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    const modal = screen.getByTestId('create-pending-order-modal');
    expect(modal).toHaveAttribute('data-open', 'true');
    expect(modal).toHaveAttribute('data-host-slug', 'test');
  });
});
