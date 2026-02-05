import '@testing-library/jest-dom';

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Currency } from '@/lib/graphql/types/v2/schema';
import { withRequiredProviders } from '../../test/providers';

import { CustomPaymentMethodTemplateEditor } from './CustomPaymentMethodTemplateEditor';

// Mock RichTextEditor since it has complex dependencies
jest.mock('../RichTextEditor', () => ({
  __esModule: true,
  default: ({
    defaultValue,
    onChange,
    placeholder,
    'data-cy': dataCy,
    error,
  }: {
    defaultValue: string;
    onChange: (e: { target: { value: string } }) => void;
    placeholder?: string;
    'data-cy'?: string;
    error?: boolean;
  }) => (
    <textarea
      data-testid="rich-text-editor-mock"
      data-cy={dataCy}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={e => onChange({ target: { value: e.target.value } })}
      data-error={error}
    />
  ),
}));

const defaultValues = {
  amount: { valueInCents: 10000, currency: Currency.USD },
  collectiveSlug: 'test-collective',
  OrderId: 12345,
  accountDetails: { accountNumber: 'AC123456' },
};

describe('CustomPaymentMethodTemplateEditor', () => {
  describe('Rendering', () => {
    it('renders with template tab active by default', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor value="Test instructions" onChange={jest.fn()} values={defaultValues} />,
        ),
      );

      expect(screen.getByRole('tab', { name: /template/i })).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: /preview/i })).toHaveAttribute('data-state', 'inactive');
    });

    it('renders the RichTextEditor with initial value', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor
            value="Initial instructions"
            onChange={jest.fn()}
            values={defaultValues}
          />,
        ),
      );

      const editor = screen.getByTestId('rich-text-editor-mock');
      expect(editor).toHaveValue('Initial instructions');
    });

    it('renders with custom placeholder', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor
            value=""
            onChange={jest.fn()}
            values={defaultValues}
            placeholder="Custom placeholder text"
          />,
        ),
      );

      const editor = screen.getByTestId('rich-text-editor-mock');
      expect(editor).toHaveAttribute('placeholder', 'Custom placeholder text');
    });

    it('renders with default placeholder when not provided', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor value="" onChange={jest.fn()} values={defaultValues} />,
        ),
      );

      const editor = screen.getByTestId('rich-text-editor-mock');
      expect(editor).toHaveAttribute('placeholder', 'Enter payment instructions...');
    });

    it('passes data-cy attribute to editor', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor
            value=""
            onChange={jest.fn()}
            values={defaultValues}
            data-cy="test-editor"
          />,
        ),
      );

      const editor = screen.getByTestId('rich-text-editor-mock');
      expect(editor).toHaveAttribute('data-cy', 'test-editor');
    });
  });

  describe('Tab switching', () => {
    it('switches to preview tab when clicked', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor
            value="Send {amount} to our account"
            onChange={jest.fn()}
            values={defaultValues}
          />,
        ),
      );

      const previewTab = screen.getByRole('tab', { name: /preview/i });
      await user.click(previewTab);

      expect(previewTab).toHaveAttribute('data-state', 'active');
      expect(screen.getByRole('tab', { name: /template/i })).toHaveAttribute('data-state', 'inactive');
    });

    it('shows preview content when preview tab is active', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor
            value="Send {amount} to our account"
            onChange={jest.fn()}
            values={defaultValues}
          />,
        ),
      );

      await user.click(screen.getByRole('tab', { name: /preview/i }));

      // Preview should show rendered instructions with replaced variables
      const previewContainer = screen.getByRole('tabpanel');
      expect(previewContainer).toBeInTheDocument();
      expect(previewContainer.querySelector('#instructions-preview')).toBeInTheDocument();
    });

    it('switches back to template tab', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor
            value="Send {amount} to our account"
            onChange={jest.fn()}
            values={defaultValues}
          />,
        ),
      );

      // Switch to preview
      await user.click(screen.getByRole('tab', { name: /preview/i }));

      // Switch back to template
      await user.click(screen.getByRole('tab', { name: /template/i }));

      expect(screen.getByRole('tab', { name: /template/i })).toHaveAttribute('data-state', 'active');
      expect(screen.getByTestId('rich-text-editor-mock')).toBeInTheDocument();
    });
  });

  describe('onChange callback', () => {
    it('calls onChange when editor content changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor value="" onChange={onChange} values={defaultValues} />,
        ),
      );

      const editor = screen.getByTestId('rich-text-editor-mock');
      await user.type(editor, 'New instructions');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Preview functionality', () => {
    it('renders CustomPaymentMethodInstructions in preview mode', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor
            value="<p>Pay {amount} for {collective}</p>"
            onChange={jest.fn()}
            values={defaultValues}
          />,
        ),
      );

      await user.click(screen.getByRole('tab', { name: /preview/i }));

      // The preview should contain the rendered instructions
      await waitFor(() => {
        expect(screen.getByText(/Pay/)).toBeInTheDocument();
        expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
        expect(screen.getByText(/test-collective/)).toBeInTheDocument();
      });
    });

    it('updates preview when value changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor value="First value" onChange={jest.fn()} values={defaultValues} />,
        ),
      );

      await user.click(screen.getByRole('tab', { name: /preview/i }));

      // Verify first value
      expect(screen.getByText('First value')).toBeInTheDocument();

      // Re-render with new value
      rerender(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor value="Second value" onChange={jest.fn()} values={defaultValues} />,
        ),
      );

      // Verify updated value
      expect(screen.getByText('Second value')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('does not show error styling when error is false', () => {
      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor value="" onChange={jest.fn()} values={defaultValues} error={false} />,
        ),
      );

      // Editor should be rendered without error state
      expect(screen.getByTestId('rich-text-editor-mock')).toBeInTheDocument();
    });

    it('passes error prop to RichTextEditor when error is true', () => {
      // Note: The actual error styling depends on RichTextEditor implementation
      // This test verifies the prop is passed correctly
      render(
        withRequiredProviders(
          <CustomPaymentMethodTemplateEditor value="" onChange={jest.fn()} values={defaultValues} error={true} />,
        ),
      );

      expect(screen.getByTestId('rich-text-editor-mock')).toBeInTheDocument();
      expect(screen.getByTestId('rich-text-editor-mock')).toHaveAttribute('data-error', 'true');
    });
  });
});
