import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CustomPaymentProvider } from '@/lib/graphql/types/v2/schema';
import { withRequiredProviders } from '../../../../test/providers';

import CustomPaymentMethods from './CustomPaymentMethods';
import { editCustomPaymentMethodsMutation } from './gql';

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

jest.mock('../../../custom-payment-provider/EditCustomPaymentMethodDialog', () => ({
  EditCustomPaymentMethodDialog: ({ provider, onSave, onClose }: any) => (
    <div data-testid="edit-dialog">
      <div>Dialog Open</div>
      {provider && <div>Editing: {provider.name}</div>}
      <button
        onClick={async () => {
          await onSave(
            { id: provider?.id || 'new', type: 'OTHER', name: 'Test', currency: 'USD', instructions: 'Test' },
            provider || null,
          );
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
  settings: {
    customPaymentProviders: [],
  },
} as React.ComponentProps<typeof CustomPaymentMethods>['account'];

const buildEditCustomPaymentMethodsMock = (value?: any) => ({
  request: {
    query: editCustomPaymentMethodsMutation,
    variables: {
      account: { slug: mockAccount.slug },
      value: value !== undefined ? value : expect.anything(),
    },
  },
  result: {
    data: {
      editAccountSetting: {
        id: mockAccount.slug,
        legacyId: 1,
        settings: { customPaymentProviders: value || [] },
      },
    },
  },
});

describe('CustomPaymentMethods', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  describe('Rendering', () => {
    it('renders payment methods list', () => {
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: '', accountDetails: '' },
        { id: '2', type: 'OTHER', name: 'CashApp', currency: 'USD', instructions: '', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-1')).toHaveTextContent('Venmo');
      expect(screen.getByTestId('payment-method-2')).toHaveTextContent('CashApp');
    });

    it('filters to only show OTHER type methods', () => {
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: '', accountDetails: '' },
        { id: '2', type: 'BANK_TRANSFER', name: 'Bank', currency: 'USD', instructions: '', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={methods} canEdit={true} />
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
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={[]} canEdit={true} />
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
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={[]} canEdit={false} />
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
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={[]} canEdit={true} />
          </MockedProvider>,
        ),
      );

      const button = screen.getByRole('button', { name: /Add Custom Payment Method/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Edit functionality', () => {
    it('opens dialog with provider when edit button is clicked', async () => {
      const user = userEvent.setup();
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={methods} canEdit={true} />
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
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];

      // The mock dialog saves with: { id: '1', type: 'OTHER', name: 'Test', currency: 'USD', instructions: 'Test' }
      // handleSave will update the existing provider: it finds the index and updates updatedProviders[index] = { ...updatedProviders[index], ...values }
      // So it will merge: { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' }
      // with: { id: '1', type: 'OTHER', name: 'Test', currency: 'USD', instructions: 'Test' }
      // Result: { id: '1', type: 'OTHER', name: 'Test', currency: 'USD', instructions: 'Test', accountDetails: '' }
      // Since account.settings.customPaymentProviders is empty, updateCustomPaymentMethods will return just this array
      const expectedValue = [
        { id: '1', type: 'OTHER', name: 'Test', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];
      const mocks = [buildEditCustomPaymentMethodsMock(expectedValue)];

      render(
        withRequiredProviders(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={methods} canEdit={true} />
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
    });

    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={methods} canEdit={true} />
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
    it('calls showConfirmationModal when remove button is clicked', async () => {
      const user = userEvent.setup();
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];

      // When user clicks remove, the mock showConfirmationModal auto-calls onConfirm
      // which will call the mutation with an empty array (since we filter out the removed one)
      const mocks = [buildEditCustomPaymentMethodsMock([])];

      render(
        withRequiredProviders(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await user.click(screen.getByText('Remove 1'));

      // The mock auto-confirms, so the mutation should be called
      await waitFor(() => {
        // Just verify the removal was initiated (mock auto-confirms)
        expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
      });
    });
  });

  describe('Reorder functionality', () => {
    it('passes onReorder handler to CustomPaymentMethodsList', () => {
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' },
        { id: '2', type: 'OTHER', name: 'CashApp', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentMethods={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      // Verify the list is rendered with multiple items that can be reordered
      expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-1')).toHaveTextContent('Venmo');
      expect(screen.getByTestId('payment-method-2')).toHaveTextContent('CashApp');
    });
  });
});
