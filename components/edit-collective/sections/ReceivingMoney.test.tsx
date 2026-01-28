import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';

import { AccountType, ManualPaymentProviderType } from '@/lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../../test/providers';

import { editCollectiveBankTransferHostQuery } from './receive-money/gql';
import ReceivingMoney from './ReceivingMoney';

// Mock child components that have their own tests
jest.mock('./receive-money/BankTransferMethods', () => ({
  __esModule: true,
  default: ({ manualPaymentProviders, canEdit }: any) => (
    <div data-testid="bank-transfer-methods">
      Bank Transfer Methods (canEdit: {String(canEdit)}, count: {manualPaymentProviders?.length || 0})
    </div>
  ),
}));

jest.mock('./receive-money/CustomPaymentMethods', () => ({
  __esModule: true,
  default: ({ manualPaymentProviders, canEdit }: any) => (
    <div data-testid="custom-payment-methods">
      Custom Payment Methods (canEdit: {String(canEdit)}, count: {manualPaymentProviders?.length || 0})
    </div>
  ),
}));

jest.mock('../EditConnectedAccount', () => ({
  __esModule: true,
  default: ({ service }: any) => <div data-testid={`edit-connected-account-${service}`}>Edit {service}</div>,
}));

jest.mock('../EditPayPalAccount', () => ({
  __esModule: true,
  default: () => <div data-testid="edit-paypal-account">Edit PayPal</div>,
}));

jest.mock('../../../lib/hooks/useLoggedInUser', () => () => ({}));

const createHostQueryMock = (
  slug: string,
  overrides: {
    manualPayments?: boolean;
    manualPaymentProviders?: any[];
  } = {},
): MockedResponse => ({
  request: {
    query: editCollectiveBankTransferHostQuery,
    variables: { slug },
  },
  result: {
    data: {
      host: {
        id: 'host-1',
        slug,
        name: 'Test Host',
        legacyId: 1,
        currency: 'USD',
        settings: {},
        connectedAccounts: [],
        plan: {
          id: 'plan-1',
          hostedCollectives: 10,
          manualPayments: overrides.manualPayments ?? true,
          name: 'Test Plan',
          __typename: 'HostPlan',
        },
        payoutMethods: [],
        manualPaymentProviders: overrides.manualPaymentProviders ?? [],
        __typename: 'Host',
      },
    },
  },
});

const mockCollective = {
  id: 'collective-1',
  slug: 'test-collective',
  type: AccountType.COLLECTIVE,
  isHost: false,
  hasMoneyManagement: true,
  currency: 'USD',
  connectedAccounts: [],
  settings: {},
};

describe('ReceivingMoney', () => {
  describe('Feature not supported', () => {
    it('renders PageFeatureNotSupported when account does not have money management', () => {
      const collectiveWithoutFeature = {
        ...mockCollective,
        hasMoneyManagement: false,
        isHost: false,
      };

      render(
        withRequiredProviders(
          <MockedProvider mocks={[createHostQueryMock('test-collective')]}>
            <ReceivingMoney collective={collectiveWithoutFeature as any} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText(/Page inaccessible/i)).toBeInTheDocument();
    });
  });

  describe('Automatic Payments Section', () => {
    it('renders Stripe section', async () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[createHostQueryMock('test-collective')]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByText('Automatic Payments')).toBeInTheDocument();
      });
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByTestId('edit-connected-account-stripe')).toBeInTheDocument();
    });

    it('renders PayPal section when feature is enabled', async () => {
      const collectiveWithPayPal = {
        ...mockCollective,
        features: { PAYPAL_DONATIONS: 'ACTIVE' },
        settings: { ...mockCollective.settings, features: { paypalDonations: true } },
      };

      render(
        withRequiredProviders(
          <MockedProvider mocks={[createHostQueryMock('test-collective')]}>
            <ReceivingMoney collective={collectiveWithPayPal as any} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByText('PayPal')).toBeInTheDocument();
      });
      expect(screen.getByTestId('edit-paypal-account')).toBeInTheDocument();
    });

    it('does not render PayPal section when feature is disabled', async () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[createHostQueryMock('test-collective')]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByText('Automatic Payments')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('edit-paypal-account')).not.toBeInTheDocument();
    });
  });

  describe('Manual Payments Section', () => {
    it('renders bank transfers section', async () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[createHostQueryMock('test-collective')]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByText('Manual Payments')).toBeInTheDocument();
      });
      expect(screen.getByText('Bank Transfers')).toBeInTheDocument();
      expect(screen.getByTestId('bank-transfer-methods')).toBeInTheDocument();
    });

    it('renders custom payment methods section', async () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[createHostQueryMock('test-collective')]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Payment Methods')).toBeInTheDocument();
      });
      expect(screen.getByTestId('custom-payment-methods')).toBeInTheDocument();
    });

    it('passes correct props to BankTransferMethods', async () => {
      const bankTransferMethods = [
        { id: '1', type: ManualPaymentProviderType.BANK_TRANSFER, name: 'Bank 1', __typename: 'ManualPaymentProvider' },
        { id: '2', type: ManualPaymentProviderType.BANK_TRANSFER, name: 'Bank 2', __typename: 'ManualPaymentProvider' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider
            mocks={[createHostQueryMock('test-collective', { manualPaymentProviders: bankTransferMethods })]}
          >
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('bank-transfer-methods')).toBeInTheDocument();
      });
      const bankTransferComponent = screen.getByTestId('bank-transfer-methods');
      expect(bankTransferComponent).toHaveTextContent('count: 2');
      expect(bankTransferComponent).toHaveTextContent('canEdit: true');
    });

    it('passes correct props to CustomPaymentMethods', async () => {
      const customMethods = [
        { id: '1', type: ManualPaymentProviderType.OTHER, name: 'Venmo', __typename: 'ManualPaymentProvider' },
        { id: '2', type: ManualPaymentProviderType.OTHER, name: 'CashApp', __typename: 'ManualPaymentProvider' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[createHostQueryMock('test-collective', { manualPaymentProviders: customMethods })]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-payment-methods')).toBeInTheDocument();
      });
      const customMethodsComponent = screen.getByTestId('custom-payment-methods');
      expect(customMethodsComponent).toHaveTextContent('count: 2');
      expect(customMethodsComponent).toHaveTextContent('canEdit: true');
    });

    it('partitions bank transfers and custom payment methods correctly', async () => {
      const mixedMethods = [
        { id: '1', type: ManualPaymentProviderType.BANK_TRANSFER, name: 'Bank 1', __typename: 'ManualPaymentProvider' },
        { id: '2', type: ManualPaymentProviderType.OTHER, name: 'Venmo', __typename: 'ManualPaymentProvider' },
        { id: '3', type: ManualPaymentProviderType.BANK_TRANSFER, name: 'Bank 2', __typename: 'ManualPaymentProvider' },
        { id: '4', type: ManualPaymentProviderType.OTHER, name: 'CashApp', __typename: 'ManualPaymentProvider' },
      ];

      render(
        withRequiredProviders(
          <MockedProvider mocks={[createHostQueryMock('test-collective', { manualPaymentProviders: mixedMethods })]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('bank-transfer-methods')).toBeInTheDocument();
      });
      const bankTransferComponent = screen.getByTestId('bank-transfer-methods');
      const customMethodsComponent = screen.getByTestId('custom-payment-methods');

      // Both components receive the full manualPaymentProviders array
      // The filtering is done inside the child components themselves
      expect(bankTransferComponent).toHaveTextContent('count: 4');
      expect(customMethodsComponent).toHaveTextContent('count: 4');
    });

    it('passes canEdit as false when plan does not have manualPayments', async () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[createHostQueryMock('test-collective', { manualPayments: false })]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('bank-transfer-methods')).toBeInTheDocument();
      });
      const bankTransferComponent = screen.getByTestId('bank-transfer-methods');
      const customMethodsComponent = screen.getByTestId('custom-payment-methods');

      expect(bankTransferComponent).toHaveTextContent('canEdit: false');
      expect(customMethodsComponent).toHaveTextContent('canEdit: false');
    });
  });
});
