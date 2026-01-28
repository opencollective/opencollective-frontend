import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ManualPaymentProvider } from '@/lib/graphql/types/v2/schema';
import { ManualPaymentProviderType } from '@/lib/graphql/types/v2/schema';
import { withRequiredProviders } from '../../test/providers';

import {
  createManualPaymentProviderMutation,
  editCollectiveBankTransferHostQuery,
} from '../edit-collective/sections/receive-money/gql';

import { EditCustomBankPaymentMethodDialog } from './EditCustomBankPaymentMethodDialog';

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

// Mock PayoutBankInformationForm since it has complex dependencies
jest.mock('../expenses/PayoutBankInformationForm', () => ({
  __esModule: true,
  default: ({ getFieldName }: { getFieldName: (name: string) => string }) => (
    <div data-testid="payout-bank-form-mock">
      <input data-testid="bank-account-input" placeholder="Bank account details" onChange={() => {}} />
      <span data-testid="field-name-test">{getFieldName('data.accountNumber')}</span>
    </div>
  ),
}));

// Mock useToast
const mockToast = jest.fn();
jest.mock('../ui/useToast', () => ({
  useToast: () => ({
    toast: mockToast,
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
  currency: 'USD',
};

const mockProvider: ManualPaymentProvider = {
  id: 'provider-1',
  type: ManualPaymentProviderType.BANK_TRANSFER,
  name: 'Test Bank',
  instructions: '<p>Test bank instructions</p>',
  icon: 'Landmark',
  accountDetails: { accountNumber: '123456' },
  createdAt: new Date(),
  isArchived: false,
  updatedAt: new Date(),
};

const buildHostQueryMock = () => ({
  request: {
    query: editCollectiveBankTransferHostQuery,
    variables: { slug: mockAccount.slug },
  },
  result: {
    data: {
      host: {
        __typename: 'Host',
        ...mockHost,
      },
    },
  },
});

const buildCreateMutationMock = (input: any) => ({
  request: {
    query: createManualPaymentProviderMutation,
    variables: {
      host: { slug: mockAccount.slug },
      manualPaymentProvider: {
        type: ManualPaymentProviderType.BANK_TRANSFER,
        ...input,
      },
    },
  },
  result: {
    data: {
      createManualPaymentProvider: {
        id: 'new-provider-id',
        type: ManualPaymentProviderType.BANK_TRANSFER,
        ...input,
      },
    },
  },
});

describe('EditCustomBankPaymentMethodDialog', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  describe('Rendering - Add Mode', () => {
    it('renders dialog with "Add" title when manualPaymentProvider is not provided', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add bank details')).toBeInTheDocument();
    });

    it('does not render dialog when open is false', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={false}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders empty name field when adding new provider', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const nameInput = screen.getByLabelText(/Bank Account Name/i);
      expect(nameInput).toHaveValue('');
    });

    it('renders default instructions template for new provider', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const editor = screen.getByTestId('rich-text-editor-mock');
      // Check that default instructions are populated
      expect(editor.getAttribute('defaultvalue') || (editor as HTMLTextAreaElement).value).toContain(
        'To complete your contribution',
      );
    });

    it('renders Save button as disabled initially when name is empty', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Rendering - Edit Mode', () => {
    it('renders dialog with "Edit" title when manualPaymentProvider is provided', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
              manualPaymentProvider={mockProvider}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText('Edit bank details')).toBeInTheDocument();
    });

    it('populates form with provider data', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
              manualPaymentProvider={mockProvider}
            />
          </MockedProvider>,
        ),
      );

      const nameInput = screen.getByLabelText(/Bank Account Name/i);
      expect(nameInput).toHaveValue('Test Bank');

      const editor = screen.getByTestId('rich-text-editor-mock');
      expect((editor as HTMLTextAreaElement).defaultValue).toBe('<p>Test bank instructions</p>');
    });
  });

  describe('Form Interactions', () => {
    it('updates name field on input', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const nameInput = screen.getByLabelText(/Bank Account Name/i);
      await user.type(nameInput, 'My Bank Account');

      expect(nameInput).toHaveValue('My Bank Account');
    });

    it('enables Save button when form is dirty and name is filled', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const nameInput = screen.getByLabelText(/Bank Account Name/i);
      await user.type(nameInput, 'Bank Transfer (US)');

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Dialog Close', () => {
    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={onClose}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when dialog is closed via Escape key', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={onClose}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Bank Information Form', () => {
    it('renders PayoutBankInformationForm component', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.getByTestId('payout-bank-form-mock')).toBeInTheDocument();
    });

    it('passes correct getFieldName function to PayoutBankInformationForm', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      // The mock displays the result of getFieldName('data.accountNumber')
      // It should convert 'data.accountNumber' to 'accountDetails.accountNumber'
      expect(screen.getByTestId('field-name-test')).toHaveTextContent('accountDetails.accountNumber');
    });
  });

  describe('Template Variables Help', () => {
    it('renders variables help section including account variable', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      // Check that all variables are mentioned in the help section
      // Using getAllByText since variables appear in multiple places (help text, editor content, etc.)
      expect(screen.getAllByText(/{account}/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/{amount}/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/{collective}/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/{reference}/).length).toBeGreaterThan(0);
    });
  });

  describe('Instructions Editor', () => {
    it('renders template editor with correct data-cy attribute', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const editor = screen.getByTestId('rich-text-editor-mock');
      expect(editor).toHaveAttribute('data-cy', 'bank-transfer-instructions-editor');
    });
  });

  describe('Sections and Labels', () => {
    it('renders Bank Account Details section with description', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText('Bank Account Details')).toBeInTheDocument();
      // Check for the description that mentions the {account} variable
      expect(screen.getByText(/Providing these details enables validation/i)).toBeInTheDocument();
    });

    it('renders Define instructions section', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText('Define instructions')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <MockedProvider
            mocks={[
              buildHostQueryMock(),
              buildCreateMutationMock({
                name: 'Test Bank',
                instructions: expect.any(String),
                icon: 'Landmark',
                accountDetails: {},
              }),
            ]}
            addTypename={false}
          >
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const nameInput = screen.getByLabelText(/Bank Account Name/i);
      await user.type(nameInput, 'Test Bank');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Button should be disabled during submission
      expect(saveButton).toBeDisabled();
    });

    it('disables Cancel button while submitting', async () => {
      const user = userEvent.setup();

      render(
        withRequiredProviders(
          <MockedProvider
            mocks={[
              buildHostQueryMock(),
              buildCreateMutationMock({
                name: 'Test Bank',
                instructions: expect.any(String),
                icon: 'Landmark',
                accountDetails: {},
              }),
            ]}
            addTypename={false}
          >
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const nameInput = screen.getByLabelText(/Bank Account Name/i);
      await user.type(nameInput, 'Test Bank');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Placeholder', () => {
    it('shows placeholder text in name input', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[buildHostQueryMock()]} addTypename={false}>
            <EditCustomBankPaymentMethodDialog
              open={true}
              onClose={jest.fn()}
              account={mockAccount as any}
              host={mockHost as any}
            />
          </MockedProvider>,
        ),
      );

      const nameInput = screen.getByLabelText(/Bank Account Name/i);
      expect(nameInput).toHaveAttribute('placeholder', 'e.g., Bank Transfer (US), Bank Transfer (EUR)');
    });
  });
});
