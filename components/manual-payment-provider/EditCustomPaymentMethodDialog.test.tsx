import '@testing-library/jest-dom';

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ManualPaymentProvider } from '@/lib/graphql/types/v2/graphql';
import { ManualPaymentProviderType } from '@/lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../test/providers';

import { EditCustomPaymentMethodDialog } from './EditCustomPaymentMethodDialog';

// Mock RichTextEditor
jest.mock('../RichTextEditor', () => ({
  __esModule: true,
  default: ({
    defaultValue,
    onChange,
    placeholder,
    'data-cy': dataCy,
  }: {
    defaultValue: string;
    onChange: (e: { target: { value: string } }) => void;
    placeholder?: string;
    'data-cy'?: string;
  }) => (
    <textarea
      data-testid="rich-text-editor-mock"
      data-cy={dataCy}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={e => onChange({ target: { value: e.target.value } })}
    />
  ),
}));

const mockProvider: ManualPaymentProvider = {
  id: 'provider-1',
  publicId: '1234567890',
  type: ManualPaymentProviderType.OTHER,
  name: 'Test Provider',
  instructions: '<p>Test instructions</p>',
  icon: 'Wallet',
  createdAt: new Date(),
  isArchived: false,
  updatedAt: new Date(),
};

describe('EditCustomPaymentMethodDialog', () => {
  describe('Rendering - Add Mode', () => {
    it('renders dialog with "Add" title when provider is null', () => {
      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add Custom Payment Method')).toBeInTheDocument();
    });

    it('renders empty form fields when adding new provider', () => {
      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const nameInput = screen.getByLabelText(/Payment Processor Name/i);
      expect(nameInput).toHaveValue('');
    });

    it('renders Save button as disabled initially for new provider', () => {
      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Rendering - Edit Mode', () => {
    it('renders dialog with "Edit" title when provider is provided', () => {
      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={mockProvider}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      expect(screen.getByText('Edit Custom Payment Method')).toBeInTheDocument();
    });

    it('populates form with provider data', () => {
      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={mockProvider}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const nameInput = screen.getByLabelText(/Payment Processor Name/i);
      expect(nameInput).toHaveValue('Test Provider');

      const editor = screen.getByTestId('rich-text-editor-mock');
      expect(editor).toHaveValue('<p>Test instructions</p>');
    });
  });

  describe('Form Interactions', () => {
    it('updates name field on input', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const nameInput = screen.getByLabelText(/Payment Processor Name/i);
      await user.type(nameInput, 'Venmo');

      expect(nameInput).toHaveValue('Venmo');
    });

    it('updates instructions field on input', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const editor = screen.getByTestId('rich-text-editor-mock');
      await user.type(editor, 'Send payment to...');

      expect(editor).toHaveValue('Send payment to...');
    });

    it('enables Save button when form is dirty and valid', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const nameInput = screen.getByLabelText(/Payment Processor Name/i);
      await user.type(nameInput, 'Venmo');

      const editor = screen.getByTestId('rich-text-editor-mock');
      await user.type(editor, 'Instructions');

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Validation', () => {
    it('shows error when name is empty on blur', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const nameInput = screen.getByLabelText(/Payment Processor Name/i);
      await user.click(nameInput);
      await user.tab(); // blur

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });

    it('keeps Save button disabled when name is empty but instructions are filled', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const editor = screen.getByTestId('rich-text-editor-mock');
      await user.type(editor, 'Instructions');

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('keeps Save button disabled when instructions are empty but name is filled', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const nameInput = screen.getByLabelText(/Payment Processor Name/i);
      await user.type(nameInput, 'Venmo');

      // Don't fill instructions

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with form values when submitting new provider', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn().mockResolvedValue(undefined);

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog provider={null} onSave={onSave} onClose={jest.fn()} defaultCurrency="USD" />,
        ),
      );

      const nameInput = screen.getByLabelText(/Payment Processor Name/i);
      await user.type(nameInput, 'Venmo');

      const editor = screen.getByTestId('rich-text-editor-mock');
      await user.type(editor, 'Send to @username');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Venmo',
            instructions: 'Send to @username',
            icon: '',
          }),
          undefined,
        );
      });
    });

    it('calls onSave with provider when editing existing provider', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn().mockResolvedValue(undefined);

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={mockProvider}
            onSave={onSave}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      const nameInput = screen.getByLabelText(/Payment Processor Name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Provider');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Provider',
          }),
          mockProvider,
        );
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      const onSave = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog provider={null} onSave={onSave} onClose={jest.fn()} defaultCurrency="USD" />,
        ),
      );

      const nameInput = screen.getByLabelText(/Payment Processor Name/i);
      await user.type(nameInput, 'Venmo');

      const editor = screen.getByTestId('rich-text-editor-mock');
      await user.type(editor, 'Instructions');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Button should be disabled during submission
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Dialog Close', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog provider={null} onSave={jest.fn()} onClose={onClose} defaultCurrency="USD" />,
        ),
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when dialog is closed via overlay', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog provider={null} onSave={jest.fn()} onClose={onClose} defaultCurrency="USD" />,
        ),
      );

      // Press Escape to close dialog
      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Icon Selection', () => {
    it('renders icon selector component', () => {
      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      // Check for icon label and the select button using data-cy
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select icon/i })).toBeInTheDocument();
    });

    it('displays current icon when provider has one', () => {
      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={mockProvider}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      // The icon name should be displayed (startCase format)
      expect(screen.getByText('Wallet')).toBeInTheDocument();
    });
  });

  describe('Template Variables Help', () => {
    it('renders variables help section', () => {
      render(
        withRequiredProviders(
          <EditCustomPaymentMethodDialog
            provider={null}
            onSave={jest.fn()}
            onClose={jest.fn()}
            defaultCurrency="USD"
          />,
        ),
      );

      // Check that common variables are mentioned
      // Using getAllByText since variables may appear in multiple places
      expect(screen.getAllByText(/{amount}/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/{collective}/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/{reference}/).length).toBeGreaterThan(0);
    });
  });
});
