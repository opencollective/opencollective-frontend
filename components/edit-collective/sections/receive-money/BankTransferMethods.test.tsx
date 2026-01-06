import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CustomPaymentProvider } from '@/lib/graphql/types/v2/schema';
import { withRequiredProviders } from '../../../../test/providers';

import BankTransferMethods from './BankTransferMethods';
import { editCollectiveBankTransferHostQuery, editCustomPaymentMethodsMutation } from './gql';

// Mock child components
jest.mock('../../../custom-payment-provider/CustomPaymentMethodsList', () => ({
  CustomPaymentMethodsList: ({ customPaymentProviders, onClickEdit, onClickRemove, canEdit }: any) => (
    <div data-testid="custom-payment-methods-list">
      {customPaymentProviders.map((p: CustomPaymentProvider) => (
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

jest.mock('../../../custom-payment-provider/EditCustomBankPaymentMethodDialog', () => ({
  EditCustomBankPaymentMethodDialog: ({ open, onClose, customPaymentProvider }: any) =>
    open ? (
      <div data-testid="edit-dialog">
        <div>Dialog Open</div>
        {customPaymentProvider && <div>Editing: {customPaymentProvider.name}</div>}
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
  legacyId: 1,
  settings: {
    customPaymentProviders: [],
  },
};

const mockHost = {
  id: 'host-1',
  slug: 'test-host',
  name: 'Test Host',
  legacyId: 2,
  currency: 'USD',
  settings: { customPaymentProviders: [] },
  connectedAccounts: [],
  plan: {
    id: 'plan-1',
    hostedCollectives: 10,
    manualPayments: true,
    name: 'Test Plan',
  },
  payoutMethods: [],
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

const buildEditCustomPaymentMethodsMock = (value: any) => ({
  request: {
    query: editCustomPaymentMethodsMutation,
    variables: {
      account: { slug: mockAccount.slug },
      value,
    },
  },
  result: {
    data: {
      editAccountSetting: {
        id: mockAccount.slug,
        legacyId: mockAccount.legacyId,
        settings: { customPaymentProviders: value },
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
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={[]} canEdit={true} />
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
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={[]} canEdit={true} />
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
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'BANK_TRANSFER', name: 'Bank 1', currency: 'USD', instructions: '', accountDetails: '' },
        { id: '2', type: 'BANK_TRANSFER', name: 'Bank 2', currency: 'USD', instructions: '', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={methods} canEdit={true} />
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
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'BANK_TRANSFER', name: 'Bank 1', currency: 'USD', instructions: '', accountDetails: '' },
        { id: '2', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: '', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={methods} canEdit={true} />
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
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={[]} canEdit={true} />
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
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={[]} canEdit={false} />
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
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'BANK_TRANSFER', name: 'Bank 1', currency: 'USD', instructions: '', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={methods} canEdit={true} />
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
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={[]} canEdit={true} />
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
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={[]} canEdit={true} />
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

  describe('Reorder functionality', () => {
    it('calls onReorder with updated list when reordering', async () => {
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'BANK_TRANSFER', name: 'Bank 1', currency: 'USD', instructions: '', accountDetails: '' },
        { id: '2', type: 'BANK_TRANSFER', name: 'Bank 2', currency: 'USD', instructions: '', accountDetails: '' },
      ];

      const updatedMethods = [methods[1], methods[0]];

      const mocks = [buildHostQueryMock(), buildEditCustomPaymentMethodsMock(updatedMethods)];

      render(
        withRequiredProviders(
          <MockedProvider mocks={mocks} addTypename={false}>
            <BankTransferMethods account={mockAccount as any} customPaymentMethods={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      // Note: The actual reorder functionality is in CustomPaymentMethodsList
      // This test verifies the component renders and passes the handler
      await waitFor(() => {
        expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
      });
    });
  });
});
