import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ManualPaymentProvider } from '@/lib/graphql/types/v2/schema';
import { withRequiredProviders } from '../../../../test/providers';

import CustomPaymentMethods from './CustomPaymentMethods';
import {
  createManualPaymentProviderMutation,
  deleteManualPaymentProviderMutation,
  updateManualPaymentProviderMutation,
} from './gql';

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

jest.mock('../../../manual-payment-provider/EditCustomPaymentMethodDialog', () => ({
  EditCustomPaymentMethodDialog: ({ provider, onSave, onClose }: any) => (
    <div data-testid="edit-dialog">
      <div>Dialog Open</div>
      {provider && <div>Editing: {provider.name}</div>}
      <button
        onClick={async () => {
          await onSave({ name: 'Test', instructions: 'Test instructions', icon: 'venmo' }, provider || undefined);
        }}
      >
        Save
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('../../../ModalContext', () => ({
  useModal: () => ({
    showConfirmationModal: jest.fn(({ onConfirm }) => {
      // Auto-confirm for testing - call immediately
      onConfirm?.();
    }),
  }),
}));

const mockToast = jest.fn();
jest.mock('../../../ui/useToast', () => ({ useToast: () => ({ toast: mockToast }) }));

const mockAccount = {
  slug: 'test-collective',
  currency: 'USD',
} as React.ComponentProps<typeof CustomPaymentMethods>['account'];

const mockOnRefetch = jest.fn();

const buildCreateProviderMock = () => ({
  request: {
    query: createManualPaymentProviderMutation,
    variables: {
      host: { slug: mockAccount.slug },
      manualPaymentProvider: {
        type: 'OTHER',
        name: 'Test',
        instructions: 'Test instructions',
        icon: 'venmo',
      },
    },
  },
  result: {
    data: {
      createManualPaymentProvider: {
        id: 'new-id',
        type: 'OTHER',
        name: 'Test',
        instructions: 'Test instructions',
        icon: 'venmo',
        accountDetails: null,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  },
});

const buildUpdateProviderMock = (providerId: string) => ({
  request: {
    query: updateManualPaymentProviderMutation,
    variables: {
      manualPaymentProvider: { id: providerId },
      input: {
        type: 'OTHER',
        name: 'Test',
        instructions: 'Test instructions',
        icon: 'venmo',
      },
    },
  },
  result: {
    data: {
      updateManualPaymentProvider: {
        id: providerId,
        type: 'OTHER',
        name: 'Test',
        instructions: 'Test instructions',
        icon: 'venmo',
        accountDetails: null,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  },
});

const buildDeleteProviderMock = (providerId: string) => ({
  request: {
    query: deleteManualPaymentProviderMutation,
    variables: {
      manualPaymentProvider: { id: providerId },
    },
  },
  result: {
    data: {
      deleteManualPaymentProvider: {
        id: providerId,
        type: 'OTHER',
        name: 'Deleted',
        instructions: '',
        icon: null,
        accountDetails: null,
        isArchived: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  },
});

describe('CustomPaymentMethods', () => {
  beforeEach(() => {
    mockToast.mockClear();
    mockOnRefetch.mockClear();
  });

  describe('Rendering', () => {
    it('renders payment methods list', () => {
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'OTHER',
          name: 'Venmo',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
        {
          id: '2',
          type: 'OTHER',
          name: 'CashApp',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={methods}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-1')).toHaveTextContent('Venmo');
      expect(screen.getByTestId('payment-method-2')).toHaveTextContent('CashApp');
    });

    it('filters to only show OTHER type methods', () => {
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'OTHER',
          name: 'Venmo',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
        {
          id: '2',
          type: 'BANK_TRANSFER',
          name: 'Bank',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={methods}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-1')).toHaveTextContent('Venmo');
      expect(screen.queryByTestId('payment-method-2')).not.toBeInTheDocument();
    });

    it('filters out archived methods', () => {
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'OTHER',
          name: 'Venmo',
          instructions: '',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
        {
          id: '2',
          type: 'OTHER',
          name: 'Archived Method',
          instructions: '',
          accountDetails: '',
          isArchived: true,
        } as ManualPaymentProvider,
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={methods}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-1')).toHaveTextContent('Venmo');
      expect(screen.queryByTestId('payment-method-2')).not.toBeInTheDocument();
    });

    it('renders add button when canEdit is true', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={[]}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      // Find the button specifically, not the text in the description
      const button = screen.getByRole('button', { name: /Add Custom Payment Method/i });
      expect(button).toBeInTheDocument();
    });

    it('does not render add button when canEdit is false', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={[]}
              canEdit={false}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.queryByRole('button', { name: /Add Custom Payment Method/i })).not.toBeInTheDocument();
    });
  });

  describe('Add functionality', () => {
    it('opens dialog when add button is clicked', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={[]}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      const button = screen.getByRole('button', { name: /Add Custom Payment Method/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
      });
    });

    it('creates new provider when saving from dialog', async () => {
      const user = userEvent.setup();
      const mocks = [buildCreateProviderMock()];

      render(
        withRequiredProviders(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={[]}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      const button = screen.getByRole('button', { name: /Add Custom Payment Method/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save'));

      await waitFor(
        () => {
          expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(mockOnRefetch).toHaveBeenCalled();
    });
  });

  describe('Edit functionality', () => {
    it('opens dialog with provider when edit button is clicked', async () => {
      const user = userEvent.setup();
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'OTHER',
          name: 'Venmo',
          instructions: 'Test',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={methods}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      await user.click(screen.getByText('Edit 1'));

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
        expect(screen.getByText('Editing: Venmo')).toBeInTheDocument();
      });
    });

    it('saves updated provider', async () => {
      const user = userEvent.setup();
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'OTHER',
          name: 'Venmo',
          instructions: 'Test',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
      ];

      const mocks = [buildUpdateProviderMock('1')];

      render(
        withRequiredProviders(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={methods}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      await user.click(screen.getByText('Edit 1'));

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save'));

      await waitFor(
        () => {
          expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      expect(mockOnRefetch).toHaveBeenCalled();
    });

    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'OTHER',
          name: 'Venmo',
          instructions: 'Test',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={methods}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      await user.click(screen.getByText('Edit 1'));

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete functionality', () => {
    it('calls showConfirmationModal and deletes provider when remove button is clicked', async () => {
      const user = userEvent.setup();
      const methods: ManualPaymentProvider[] = [
        {
          id: '1',
          type: 'OTHER',
          name: 'Venmo',
          instructions: 'Test',
          accountDetails: '',
          isArchived: false,
        } as ManualPaymentProvider,
      ];

      const mocks = [buildDeleteProviderMock('1')];

      render(
        withRequiredProviders(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CustomPaymentMethods
              account={mockAccount}
              manualPaymentProviders={methods}
              canEdit={true}
              onRefetch={mockOnRefetch}
            />
          </MockedProvider>,
        ),
      );

      await user.click(screen.getByText('Remove 1'));

      // The mock auto-confirms, so the mutation should be called and onRefetch triggered
      await waitFor(() => {
        expect(mockOnRefetch).toHaveBeenCalled();
      });
    });
  });
});
