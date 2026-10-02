import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withRequiredProviders } from '../../../test/providers';

import {
  editMoneyManagementAndHostingMutation,
  fiscalHostingQuery,
  ToggleFiscalHostingButton,
  ToggleMoneyManagementButton,
} from './FiscalHosting';

const mockToast = jest.fn();
jest.mock('../../ui/useToast', () => ({ useToast: () => ({ toast: mockToast }) }));

jest.mock('../../ModalContext', () => ({
  useModal: () => ({
    showConfirmationModal: jest.fn(),
  }),
}));

jest.mock('../../../lib/hooks/useLoggedInUser', () => () => ({}));

const mockAccountId = 'gid://opencollective/Organization/1';

const buildFiscalHostingQueryMock = () => ({
  request: {
    query: fiscalHostingQuery,
    variables: { id: mockAccountId },
  },
  result: {
    data: {
      host: {
        __typename: 'Host',
        id: mockAccountId,
        totalHostedAccounts: 0,
      },
    },
  },
});

const buildActivateMutationErrorMock = () => ({
  request: {
    query: editMoneyManagementAndHostingMutation,
    variables: { organization: { id: mockAccountId }, hasMoneyManagement: true },
  },
  result: {
    errors: [{ message: 'Constraint violation', extensions: { code: 'INTERNAL_SERVER_ERROR' } }],
  },
});

const buildActivateMutationSuccessMock = () => ({
  request: {
    query: editMoneyManagementAndHostingMutation,
    variables: { organization: { id: mockAccountId }, hasMoneyManagement: true },
  },
  result: {
    data: {
      editOrganizationMoneyManagementAndHosting: {
        __typename: 'Organization',
        id: mockAccountId,
        isHost: false,
        hasMoneyManagement: true,
        hasHosting: false,
        settings: {},
      },
    },
  },
});

const buildActivateHostingMutationSuccessMock = () => ({
  request: {
    query: editMoneyManagementAndHostingMutation,
    variables: { organization: { id: mockAccountId }, hasHosting: true },
  },
  result: {
    data: {
      editOrganizationMoneyManagementAndHosting: {
        __typename: 'Organization',
        id: mockAccountId,
        isHost: true,
        hasMoneyManagement: true,
        hasHosting: true,
        settings: {},
      },
    },
  },
});

const mockAccount = {
  id: mockAccountId,
  hasMoneyManagement: false,
  hasHosting: false,
  isHost: false,
  settings: {},
};

describe('ToggleMoneyManagementButton', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it('renders an Activate button when money management is off', async () => {
    render(
      withRequiredProviders(
        <MockedProvider mocks={[buildFiscalHostingQueryMock()]} addTypename={false}>
          <ToggleMoneyManagementButton account={mockAccount} />
        </MockedProvider>,
      ),
    );

    expect(await screen.findByRole('button', { name: 'Activate' })).toBeInTheDocument();
  });

  it('shows an error toast when the activate mutation fails', async () => {
    const user = userEvent.setup();
    render(
      withRequiredProviders(
        <MockedProvider mocks={[buildFiscalHostingQueryMock(), buildActivateMutationErrorMock()]} addTypename={false}>
          <ToggleMoneyManagementButton account={mockAccount} />
        </MockedProvider>,
      ),
    );

    const activateButton = await screen.findByRole('button', { name: 'Activate' });
    await user.click(activateButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
    });
  });

  it('does not show an error toast when the activate mutation succeeds', async () => {
    const user = userEvent.setup();
    render(
      withRequiredProviders(
        <MockedProvider mocks={[buildFiscalHostingQueryMock(), buildActivateMutationSuccessMock()]} addTypename={false}>
          <ToggleMoneyManagementButton account={mockAccount} />
        </MockedProvider>,
      ),
    );

    const activateButton = await screen.findByRole('button', { name: 'Activate' });
    await user.click(activateButton);

    // Give Apollo time to resolve
    await waitFor(() => {
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  it('switches from Activate to Deactivate after money management is turned on', async () => {
    const user = userEvent.setup();
    render(
      withRequiredProviders(
        <MockedProvider mocks={[buildFiscalHostingQueryMock(), buildActivateMutationSuccessMock()]} addTypename={false}>
          <ToggleMoneyManagementButton account={mockAccount} />
        </MockedProvider>,
      ),
    );

    const activateButton = await screen.findByRole('button', { name: 'Activate' });
    await user.click(activateButton);

    expect(await screen.findByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
  });
});

describe('ToggleFiscalHostingButton', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it('switches from Activate to Deactivate after fiscal hosting is turned on', async () => {
    const user = userEvent.setup();
    const account = {
      ...mockAccount,
      hasMoneyManagement: true,
      hasHosting: false,
      isHost: false,
    };

    render(
      withRequiredProviders(
        <MockedProvider
          mocks={[buildFiscalHostingQueryMock(), buildActivateHostingMutationSuccessMock()]}
          addTypename={false}
        >
          <ToggleFiscalHostingButton account={account} />
        </MockedProvider>,
      ),
    );

    const activateButton = await screen.findByRole('button', { name: 'Activate' });
    await user.click(activateButton);

    expect(await screen.findByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
  });
});
