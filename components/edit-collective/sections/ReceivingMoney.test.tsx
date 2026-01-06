import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';

import { AccountType } from '@/lib/graphql/types/v2/graphql';
import { withRequiredProviders } from '../../../test/providers';

import ReceivingMoney from './ReceivingMoney';

// Mock child components that have their own tests
jest.mock('./receive-money/BankTransferMethods', () => ({
  __esModule: true,
  default: ({ manualBankTransferMethods, canEdit }: any) => (
    <div data-testid="bank-transfer-methods">
      Bank Transfer Methods (canEdit: {String(canEdit)}, count: {manualBankTransferMethods?.length || 0})
    </div>
  ),
}));

jest.mock('./receive-money/CustomPaymentMethods', () => ({
  __esModule: true,
  default: ({ customPaymentProviders, canEdit }: any) => (
    <div data-testid="custom-payment-methods">
      Custom Payment Methods (canEdit: {String(canEdit)}, count: {customPaymentProviders?.length || 0})
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

const mockCollective = {
  id: 'collective-1',
  slug: 'test-collective',
  type: AccountType.COLLECTIVE,
  isHost: false,
  hasMoneyManagement: true,
  currency: 'USD',
  connectedAccounts: [],
  settings: {},
  plan: { manualPayments: true },
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
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={collectiveWithoutFeature as any} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText(/Page inaccessible/i)).toBeInTheDocument();
    });
  });

  describe('Automatic Payments Section', () => {
    it('renders Stripe section', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText('Automatic Payments')).toBeInTheDocument();
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByTestId('edit-connected-account-stripe')).toBeInTheDocument();
    });

    it('renders PayPal section when feature is enabled', () => {
      const collectiveWithPayPal = {
        ...mockCollective,
        features: { PAYPAL_DONATIONS: 'ACTIVE' },
        settings: { ...mockCollective.settings, features: { paypalDonations: true } },
      };

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={collectiveWithPayPal as any} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText('PayPal')).toBeInTheDocument();
      expect(screen.getByTestId('edit-paypal-account')).toBeInTheDocument();
    });

    it('does not render PayPal section when feature is disabled', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      expect(screen.queryByTestId('edit-paypal-account')).not.toBeInTheDocument();
    });
  });

  describe('Manual Payments Section', () => {
    it('renders bank transfers section', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText('Manual Payments')).toBeInTheDocument();
      expect(screen.getByText('Bank Transfers')).toBeInTheDocument();
      expect(screen.getByTestId('bank-transfer-methods')).toBeInTheDocument();
    });

    it('renders custom payment methods section', () => {
      render(
        withRequiredProviders(
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={mockCollective as any} />
          </MockedProvider>,
        ),
      );

      expect(screen.getByText('Custom Payment Methods')).toBeInTheDocument();
      expect(screen.getByTestId('custom-payment-methods')).toBeInTheDocument();
    });

    it('passes correct props to BankTransferMethods', () => {
      const bankTransferMethods = [
        { id: '1', type: 'BANK_TRANSFER', name: 'Bank 1' },
        { id: '2', type: 'BANK_TRANSFER', name: 'Bank 2' },
      ];
      const collective = {
        ...mockCollective,
        settings: { customPaymentProviders: bankTransferMethods },
      };

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={collective as any} />
          </MockedProvider>,
        ),
      );

      const bankTransferComponent = screen.getByTestId('bank-transfer-methods');
      expect(bankTransferComponent).toHaveTextContent('count: 2');
      expect(bankTransferComponent).toHaveTextContent('canEdit: true');
    });

    it('passes correct props to CustomPaymentMethods', () => {
      const customMethods = [
        { id: '1', type: 'OTHER', name: 'Venmo' },
        { id: '2', type: 'OTHER', name: 'CashApp' },
      ];
      const collective = {
        ...mockCollective,
        settings: { customPaymentProviders: customMethods },
      };

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={collective as any} />
          </MockedProvider>,
        ),
      );

      const customMethodsComponent = screen.getByTestId('custom-payment-methods');
      expect(customMethodsComponent).toHaveTextContent('count: 2');
      expect(customMethodsComponent).toHaveTextContent('canEdit: true');
    });

    it('partitions bank transfers and custom payment methods correctly', () => {
      const mixedMethods = [
        { id: '1', type: 'BANK_TRANSFER', name: 'Bank 1' },
        { id: '2', type: 'OTHER', name: 'Venmo' },
        { id: '3', type: 'BANK_TRANSFER', name: 'Bank 2' },
        { id: '4', type: 'OTHER', name: 'CashApp' },
      ];
      const collective = {
        ...mockCollective,
        settings: { customPaymentProviders: mixedMethods },
      };

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={collective as any} />
          </MockedProvider>,
        ),
      );

      const bankTransferComponent = screen.getByTestId('bank-transfer-methods');
      const customMethodsComponent = screen.getByTestId('custom-payment-methods');

      expect(bankTransferComponent).toHaveTextContent('count: 2');
      expect(customMethodsComponent).toHaveTextContent('count: 2');
    });

    it('passes canEdit as false when plan does not have manualPayments', () => {
      const collectiveWithoutPlan = {
        ...mockCollective,
        plan: { manualPayments: false },
      };

      render(
        withRequiredProviders(
          <MockedProvider mocks={[]}>
            <ReceivingMoney collective={collectiveWithoutPlan as any} />
          </MockedProvider>,
        ),
      );

      const bankTransferComponent = screen.getByTestId('bank-transfer-methods');
      const customMethodsComponent = screen.getByTestId('custom-payment-methods');

      expect(bankTransferComponent).toHaveTextContent('canEdit: false');
      expect(customMethodsComponent).toHaveTextContent('canEdit: false');
    });
  });
});
