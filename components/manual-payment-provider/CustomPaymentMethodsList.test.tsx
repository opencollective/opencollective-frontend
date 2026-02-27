import '@testing-library/jest-dom';

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ManualPaymentProvider } from '@/lib/graphql/types/v2/graphql';
import { ManualPaymentProviderType } from '@/lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../test/providers';

import { CustomPaymentMethodsList } from './CustomPaymentMethodsList';

// Mock FlipMove animation library
jest.mock('react-flip-move', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

const mockAccount = {
  slug: 'test-collective',
  currency: 'USD',
};

const mockProvider: ManualPaymentProvider = {
  id: '1',
  publicId: '1234567890',
  type: ManualPaymentProviderType.OTHER,
  name: 'Test Payment Method',
  instructions: 'Send {amount} to {account}',
  accountDetails: 'AC123456',
  createdAt: new Date(),
  isArchived: false,
  updatedAt: new Date(),
};

describe('CustomPaymentMethodsList', () => {
  describe('Empty state', () => {
    it('returns null when no providers', () => {
      const { container } = render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={false}
          />,
        ),
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering', () => {
    it('renders payment method cards', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={false}
          />,
        ),
      );

      expect(screen.getByText('Test Payment Method')).toBeInTheDocument();
    });

    it('renders icon for BANK_TRANSFER type', () => {
      const bankProvider: ManualPaymentProvider = {
        ...mockProvider,
        type: ManualPaymentProviderType.BANK_TRANSFER,
        name: 'Bank Transfer',
      };

      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[bankProvider]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={false}
          />,
        ),
      );

      expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
    });

    it('renders instructions when provided', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={false}
          />,
        ),
      );

      expect(screen.getByText(/View Instructions/i)).toBeInTheDocument();
    });

    it('does not render instructions section when instructions are empty', () => {
      const providerWithoutInstructions: ManualPaymentProvider = {
        ...mockProvider,
        instructions: '',
      };

      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[providerWithoutInstructions]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={false}
          />,
        ),
      );

      expect(screen.queryByText(/View Instructions/i)).not.toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('renders edit and remove buttons when canEdit is true', () => {
      const onClickEdit = jest.fn();
      const onClickRemove = jest.fn();

      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={onClickEdit}
            onClickRemove={onClickRemove}
            onReorder={jest.fn()}
            canEdit={true}
          />,
        ),
      );

      expect(screen.getByText(/Edit/i)).toBeInTheDocument();
      expect(screen.getByText(/Remove/i)).toBeInTheDocument();
    });

    it('does not render edit and remove buttons when canEdit is false', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={false}
          />,
        ),
      );

      expect(screen.queryByText(/Edit/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Remove/i)).not.toBeInTheDocument();
    });

    it('calls onClickEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onClickEdit = jest.fn();

      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={onClickEdit}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={true}
          />,
        ),
      );

      await user.click(screen.getByText(/Edit/i));

      expect(onClickEdit).toHaveBeenCalledWith('1');
    });

    it('calls onClickRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const onClickRemove = jest.fn();

      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={jest.fn()}
            onClickRemove={onClickRemove}
            onReorder={jest.fn()}
            canEdit={true}
          />,
        ),
      );

      await user.click(screen.getByText(/Remove/i));

      expect(onClickRemove).toHaveBeenCalledWith('1');
    });
  });

  describe('Instructions collapsible', () => {
    it('toggles instructions visibility', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={false}
          />,
        ),
      );

      const toggleButton = screen.getByText(/View Instructions/i);
      expect(toggleButton).toBeInTheDocument();

      // Instructions should be hidden initially
      expect(screen.queryByText(/Send/i)).not.toBeInTheDocument();

      // Click to open
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/Send/i)).toBeInTheDocument();
      });

      // Click to close
      await user.click(toggleButton);

      await waitFor(() => {
        expect(screen.queryByText(/Send/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Reorder functionality', () => {
    it('renders reorder buttons when canEdit is true', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={true}
          />,
        ),
      );

      // Reorder buttons are rendered (up/down arrows)
      const buttons = screen.getAllByRole('button');
      const reorderButtons = buttons.filter(btn => btn.querySelector('svg'));
      expect(reorderButtons.length).toBeGreaterThan(0);
    });

    it('disables up button for first item', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={true}
          />,
        ),
      );

      const upButton = screen.getByTestId('move-up-button');
      expect(upButton).toBeInTheDocument();
      expect(upButton).toBeDisabled();
    });

    it('disables down button for last item', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={[mockProvider]}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={true}
          />,
        ),
      );

      const downButton = screen.getByTestId('move-down-button');
      expect(downButton).toBeInTheDocument();
      expect(downButton).toBeDisabled();
    });

    it('calls onReorder when moving item up', async () => {
      const user = userEvent.setup();
      const onReorder = jest.fn();
      const providers: ManualPaymentProvider[] = [
        { ...mockProvider, id: '1', name: 'First' },
        { ...mockProvider, id: '2', name: 'Second' },
      ];

      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={providers}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={onReorder}
            canEdit={true}
          />,
        ),
      );

      // Find the up button for the second item (should be enabled)
      // The up button has title="Move up" when enabled
      const upButton = screen.getByTitle('Move up');
      expect(upButton).toBeInTheDocument();
      expect(upButton).not.toBeDisabled();

      await user.click(upButton);

      await waitFor(() => {
        expect(onReorder).toHaveBeenCalled();
      });

      // Verify it was called with the reordered list
      expect(onReorder).toHaveBeenCalledWith([providers[1], providers[0]]);
    });
  });

  describe('Multiple providers', () => {
    it('renders all providers', () => {
      const providers: ManualPaymentProvider[] = [
        { ...mockProvider, id: '1', name: 'Venmo' },
        { ...mockProvider, id: '2', name: 'CashApp' },
        { ...mockProvider, id: '3', name: 'PayPal' },
      ];

      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={providers}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={jest.fn()}
            canEdit={false}
          />,
        ),
      );

      expect(screen.getByText('Venmo')).toBeInTheDocument();
      expect(screen.getByText('CashApp')).toBeInTheDocument();
      expect(screen.getByText('PayPal')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('shows loading overlay when isMoving is true', async () => {
      const user = userEvent.setup();
      let resolvePromise;
      const onReorder = jest.fn().mockImplementation(
        () =>
          new Promise(resolve => {
            resolvePromise = resolve;
          }),
      );

      const providers = [
        { ...mockProvider, id: '1', name: 'First Payment Method' },
        { ...mockProvider, id: '2', name: 'Second Payment Method' },
      ];

      render(
        withRequiredProviders(
          <CustomPaymentMethodsList
            account={mockAccount as any}
            customPaymentProviders={providers}
            onClickEdit={jest.fn()}
            onClickRemove={jest.fn()}
            onReorder={onReorder}
            canEdit={true}
          />,
        ),
      );

      await waitFor(() => {
        expect(screen.queryByTestId('moving-overlay')).not.toBeInTheDocument();
      });

      // Click on the up button for the second item
      await user.click(screen.getAllByTestId('move-down-button')[0]);

      // Ensure the moving overlay is rendered
      await waitFor(() => {
        expect(screen.getByTestId('moving-overlay')).toBeInTheDocument();
      });

      resolvePromise();

      await waitFor(() => {
        expect(screen.queryByTestId('moving-overlay')).not.toBeInTheDocument();
      });
    });
  });
});
