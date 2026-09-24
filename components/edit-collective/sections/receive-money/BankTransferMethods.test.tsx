import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ManualPaymentProvider } from '@/lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../../../test/providers';

import BankTransferMethods from './BankTransferMethods';
import { editCollectiveBankTransferHostQuery } from './gql';

// Mock child components
jest.mock('../../../manual-payment-provider/CustomPaymentMethodsList', () => ({
  CustomPaymentMethodsList: ({ customPaymentProviders, onClickEdit, onClickRemove, canEdit }: any) => (
    <div data-testid="custom-payment-methods-list">
      {customPaymentProviders.map((p: ManualPaymentProvider) => (
        <div key={p.id} data-testid={`payment-method-${p.id}`}>
          {p.name}
          {canEdit && (
            <React.Fragment>
              <button onClick={() => onClickEdit(p.id)}>Edit {p.id}</button>
              <button onClick={() => onClickRemove(p.id)}>Remove {p.id}</button>
            </React.Fragment>
          )}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../../../manual-payment-provider/EditCustomBankPaymentMethodDialog', () => ({
  EditCustomBankPaymentMethodDialog: ({ open, onClose, manualPaymentProvider }: any) =>
    open ? (
      <div data-testid="edit-dialog">
        <div>Dialog Open</div>
        {manualPaymentProvider && <div>Editing: {manualPaymentProvider.name}</div>}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

jest.mock('../../../ModalContext', () => ({
  useModal: () => ({
    showConfirmationModal: jest.fn(({ onConfirm }) => {
      // Auto-confirm for testing
      setTimeout(() => onConfirm?.(), 0);
    }),
  }),
}));

jest.mock('../../../ui/useToast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockAccount = {
  slug: 'test-collective',
  currency: 'USD',
};

const mockHost = {
  id: 'host-1',
  slug: 'test-host',
  name: 'Test Host',
  legacyId: 2,
  currency: 'USD',
  settings: {},
  connectedAccounts: [],
  plan: {
    id: 'plan-1',
    hostedCollectives: 10,
    manualPayments: true,
    name: 'Test Plan',
  },
  payoutMethods: [],
  manualPaymentProviders: [],
};

const buildHostQueryMock = (host = mockHost) => ({
  request: {
    query: editCollectiveBankTransferHostQuery,
    variables: { slug: mockAccount.slug },
  },
  result: {
    data: {
      host: {
        __typename: 'Host',
        ...host,
      },
    },
  },
});

describe('BankTransferMethods', () => {
  describe('Loading state', () => {
    it('shows loading state while query is in progress', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} manualPaymentProviders={[]} canEdit={true} />
          </MockedProvider>,
        ),
      );

      expect(document.querySelector('.Loading')).toBeInTheDocument();
    });
  });

  describe('No host state', () => {
    it('returns null when host is not found', async () => {
      const mocks = [
        {
          request: {
            query: editCollectiveBankTransferHostQuery,
            variables: { slug: mockAccount.slug },
          },
          result: {
            data: {
              host: null,
            },
          },
        },
      ];

      const { container } = render(
        withRequiredProviders(
          <MockedProvider mocks={mocks} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} manualPaymentProviders={[]} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Rendering', () => {
    it('renders payment methods list', async () => {
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'BANK_TRANSFER',
          name: 'Bank 1',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
        {
          id: '2',
          type: 'BANK_TRANSFER',
          name: 'Bank 2',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} manualPaymentProviders={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
        expect(screen.getByTestId('payment-method-1')).toHaveTextContent('Bank 1');
        expect(screen.getByTestId('payment-method-2')).toHaveTextContent('Bank 2');
      });
    });

    it('filters to only show BANK_TRANSFER type methods', async () => {
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'BANK_TRANSFER',
          name: 'Bank 1',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
        {
          id: '2',
          type: 'OTHER',
          name: 'Venmo',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} manualPaymentProviders={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
        expect(screen.getByTestId('payment-method-1')).toHaveTextContent('Bank 1');
        expect(screen.queryByTestId('payment-method-2')).not.toBeInTheDocument();
      });
    });

    it('renders add button when canEdit is true', async () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} manualPaymentProviders={[]} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByText(/Add bank details/i)).toBeInTheDocument();
      });
    });

    it('does not render add button when canEdit is false', async () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} manualPaymentProviders={[]} canEdit={false} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.queryByText(/Add bank details/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit functionality', () => {
    it('opens dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'BANK_TRANSFER',
          name: 'Bank 1',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} manualPaymentProviders={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByText('Edit 1')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Edit 1'));

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
        expect(screen.getByText('Editing: Bank 1')).toBeInTheDocument();
      });
    });

    it('opens dialog for adding new method', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} manualPaymentProviders={[]} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByText(/Add bank details/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Add bank details/i));

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
      });
    });

    it('closes dialog when onClose is called', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} manualPaymentProviders={[]} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByText(/Add bank details/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Add bank details/i));

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();
      });
    });
  });
});
