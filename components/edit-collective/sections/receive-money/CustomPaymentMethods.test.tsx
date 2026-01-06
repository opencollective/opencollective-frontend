import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withRequiredProviders } from '../../../../test/providers';

import CustomPaymentMethods from './CustomPaymentMethods';
import type { CustomPaymentProvider } from './EditCustomPaymentMethodDialog';
import { editCustomPaymentMethodsMutation } from './gql';

// Mock child components
jest.mock('./CustomPaymentMethodsList', () => ({
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

jest.mock('./EditCustomPaymentMethodDialog', () => ({
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

jest.mock('../../../ConfirmationModal', () => ({
  __esModule: true,
  default: ({ continueHandler, onClose, header, children }: any) => (
    <div data-testid="confirmation-modal">
      <div>{header}</div>
      <div>{children}</div>
      <button onClick={continueHandler}>Confirm</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  ),
}));

const mockToast = jest.fn();
jest.mock('../../../ui/useToast', () => ({ useToast: () => ({ toast: mockToast }) }));

const mockAccount = {
  slug: 'test-collective',
  currency: 'USD',
  settings: {},
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
    it('renders description when canEdit is true', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={[]} canEdit={true} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText(/Add custom payment methods/i)).toBeInTheDocument();
    });

    it('renders upgrade message when canEdit is false', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={[]} canEdit={false} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText(/Subscribe to our special plans for hosts/i)).toBeInTheDocument();
    });

    it('renders payment methods list', () => {
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: '', accountDetails: '' },
        { id: '2', type: 'OTHER', name: 'CashApp', currency: 'USD', instructions: '', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByTestId('custom-payment-methods-list')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-1')).toHaveTextContent('Venmo');
      expect(screen.getByTestId('payment-method-2')).toHaveTextContent('CashApp');
    });

    it('renders add button when canEdit is true', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={[]} canEdit={true} />
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
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={[]} canEdit={false} />
          </MockedProvider>,
        ),
      );

      expect(screen.queryByText(/Add Custom Payment Method/i)).not.toBeInTheDocument();
    });
  });

  describe('Add functionality', () => {
    it('opens dialog when add button is clicked', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={[]} canEdit={true} />
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
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={methods} canEdit={true} />
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
      // Since account.settings.customPaymentProviders is empty ({}), updateCustomPaymentMethods will return just this array
      const expectedValue = [
        { id: '1', type: 'OTHER', name: 'Test', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];
      const mocks = [buildEditCustomPaymentMethodsMock(expectedValue)];

      render(
        withRequiredProviders(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={methods} canEdit={true} />
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
  });

  describe('Delete functionality', () => {
    it('shows confirmation modal when remove button is clicked', async () => {
      const user = userEvent.setup();
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await user.click(screen.getByText('Remove 1'));

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
        expect(screen.getByText(/Delete Custom Payment Method/i)).toBeInTheDocument();
      });
    });

    it('deletes provider when confirmed', async () => {
      const user = userEvent.setup();
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];

      const mocks = [buildEditCustomPaymentMethodsMock([])];

      render(
        withRequiredProviders(
          <MockedProvider mocks={mocks} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await user.click(screen.getByText('Remove 1'));

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
      });
    });

    it('cancels deletion when cancel is clicked', async () => {
      const user = userEvent.setup();
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await user.click(screen.getByText('Remove 1'));

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('handles mutation errors gracefully', async () => {
      const user = userEvent.setup();
      const methods: CustomPaymentProvider[] = [
        { id: '1', type: 'OTHER', name: 'Venmo', currency: 'USD', instructions: 'Test', accountDetails: '' },
      ];

      const errorMock = {
        request: {
          query: editCustomPaymentMethodsMutation,
          variables: {
            account: { slug: mockAccount.slug },
            value: [],
          },
        },
        error: new Error('Network error'),
      };

      render(
        withRequiredProviders(
          <MockedProvider mocks={[errorMock]} addTypename={false}>
            <CustomPaymentMethods account={mockAccount} customPaymentProviders={methods} canEdit={true} />
          </MockedProvider>,
        ),
      );

      await user.click(screen.getByText('Remove 1'));

      await waitFor(() => {
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Confirm'));

      // Should not close modal, should show error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'error',
          message: 'A network error occurred, please check your connectivity or try again later',
        });
        expect(screen.queryByTestId('confirmation-modal')).toBeInTheDocument();
      });
    });
  });
});
