import '@testing-library/jest-dom';

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import UpdatePaymentMethodPage from '../../pages/updatePaymentMethod';
import { withRequiredProviders } from '../providers';

const mockUseQuery = jest.fn();
const mockRefetch = jest.fn();
const mockEditOrderModal = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('../../components/AuthenticatedPage', () => ({
  __esModule: true,
  default: ({ children }) => children({ collective: { slug: 'me' } }),
}));

jest.mock('../../components/EditOrderModal', () => ({
  __esModule: true,
  default: props => {
    mockEditOrderModal(props);
    return (
      <button type="button" onClick={() => props.onSuccess()}>
        Simulate update
      </button>
    );
  },
}));

jest.mock('../../components/LinkCollective', () => ({
  __esModule: true,
  default: ({ collective }) => <span>{collective.name}</span>,
}));

const makeOrder = (id: string, status: 'ACTIVE' | 'ERROR', toAccountName: string) => ({
  id,
  status,
  frequency: 'MONTHLY',
  totalAmount: { valueInCents: 1000, currency: 'EUR' },
  fromAccount: { id: 'from', slug: 'contributor-org' },
  toAccount: { id: `to-${id}`, slug: `to-${id}`, name: toAccountName },
});

const mockQueryResult = (paymentMethod: unknown) => {
  mockUseQuery.mockReturnValue({ data: { paymentMethod }, loading: false, error: undefined, refetch: mockRefetch });
};

const renderPage = () => render(withRequiredProviders(<UpdatePaymentMethodPage paymentMethodId={4242} />));

describe('pages/updatePaymentMethod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the payment method by legacy id with its active and failed recurring contributions', () => {
    mockQueryResult(null);
    renderPage();

    const [query, options] = mockUseQuery.mock.calls[0];
    expect(options.variables).toEqual({ paymentMethod: { legacyId: 4242 } });
    const source = query.loc.source.body;
    expect(source).toContain('paymentMethod(paymentMethod: $paymentMethod)');
    expect(source).toContain('orders(onlyActiveSubscriptions: true, status: [ACTIVE, ERROR])');
  });

  it('says so when the payment method is not found', () => {
    mockQueryResult(null);
    renderPage();
    expect(screen.getByText('This payment method does not exist or has already been updated.')).toBeInTheDocument();
  });

  it('lists each contribution, flags failed payments, and edits one contribution at a time', () => {
    mockQueryResult({
      id: 'pm',
      account: { id: 'owner', slug: 'pm-owner' },
      orders: {
        totalCount: 2,
        nodes: [makeOrder('o1', 'ACTIVE', 'Collective A'), makeOrder('o2', 'ERROR', 'Collective B')],
      },
    });
    renderPage();

    expect(screen.getByText('Collective A')).toBeInTheDocument();
    expect(screen.getByText('Collective B')).toBeInTheDocument();
    expect(screen.getAllByText('Payment failed')).toHaveLength(1);
    expect(mockEditOrderModal).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: 'Update payment method' })[1]);
    expect(mockEditOrderModal).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'editPaymentMethod',
        accountSlug: 'pm-owner',
        order: expect.objectContaining({ id: 'o2' }),
      }),
    );
  });

  it('refetches after an update and confirms once no contribution uses the payment method anymore', () => {
    mockQueryResult({
      id: 'pm',
      account: { id: 'from', slug: 'contributor-org' },
      orders: { totalCount: 1, nodes: [makeOrder('o1', 'ACTIVE', 'Collective A')] },
    });
    const { rerender } = renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Update payment method' }));
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Simulate update' }));
    });
    expect(mockRefetch).toHaveBeenCalled();

    mockQueryResult({
      id: 'pm',
      account: { id: 'from', slug: 'contributor-org' },
      orders: { totalCount: 0, nodes: [] },
    });
    rerender(withRequiredProviders(<UpdatePaymentMethodPage paymentMethodId={4242} />));

    expect(screen.getByText('All your recurring contributions now use a new payment method.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View your contributions' })).toHaveAttribute(
      'href',
      '/dashboard/contributor-org/outgoing-contributions',
    );
  });
});
