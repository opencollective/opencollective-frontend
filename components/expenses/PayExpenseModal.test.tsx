import '@testing-library/jest-dom';

jest.mock('../../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: { hasPreviewFeatureEnabled: () => true } }),
}));

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../../lib/theme';

import { balanceAccountingCategoryPickerQuery } from '../accounting/BalanceAccountingCategoryPicker';
import { TooltipProvider } from '../ui/Tooltip';

import PayExpenseModal, { quoteExpenseQuery } from './PayExpenseModal';

const pickerMock = {
  request: {
    query: balanceAccountingCategoryPickerQuery,
    variables: {
      hostSlug: 'test-host',
      account: { slug: 'test-collective' },
      order: null,
      expense: { id: 'expense-1' },
    },
  },
  result: {
    data: {
      host: {
        __typename: 'Host',
        id: 'host-1',
        balanceAccountingCategories: {
          __typename: 'AccountingCategoryCollection',
          nodes: [
            {
              __typename: 'AccountingCategory',
              id: 'cat-1',
              code: '1051',
              name: 'Mercury Checking',
              friendlyName: null,
              kind: 'BALANCE_ACCOUNT',
            },
            {
              __typename: 'AccountingCategory',
              id: 'cat-2',
              code: '1030',
              name: 'Stripe Clearing',
              friendlyName: null,
              kind: 'CLEARING_ACCOUNT',
            },
          ],
        },
        suggestedBalanceAccountingCategories: [],
      },
    },
  },
};

const host = {
  slug: 'test-host',
  currency: 'USD',
  settings: {},
  transferwise: null,
  features: { __typename: 'CollectiveFeatures', CHART_OF_ACCOUNTS: 'ACTIVE' },
  supportedPayoutMethods: ['OTHER', 'BANK_ACCOUNT'],
  platformSubscription: null,
} as unknown as React.ComponentProps<typeof PayExpenseModal>['host'];

const expense = {
  id: 'expense-1',
  legacyId: 1,
  currency: 'USD',
  amount: 10000,
  reference: null,
  feesPayer: 'COLLECTIVE',
  type: 'INVOICE',
  payoutMethod: { id: 'pm-1', type: 'OTHER', data: {} },
  amountInHostCurrency: { valueInCents: 10000, currency: 'USD' },
  taxes: [],
  account: { name: 'Test Collective', slug: 'test-collective' },
} as unknown as React.ComponentProps<typeof PayExpenseModal>['expense'];

describe('PayExpenseModal balance category picker', () => {
  it('shows and searches balance categories for manual payments', async () => {
    render(
      <IntlProvider locale="en">
        <ThemeProvider theme={theme}>
          <MockedProvider mocks={[pickerMock, pickerMock]} addTypename>
            <PayExpenseModal
              expense={expense}
              collective={{ currency: 'USD' } as never}
              host={host}
              onClose={jest.fn()}
              onSubmit={jest.fn()}
              canPayWithAutomaticPayment={false}
            />
          </MockedProvider>
        </ThemeProvider>
      </IntlProvider>,
    );

    const label = await screen.findByText('Paid from');
    expect(label).toBeInTheDocument();

    const input = document.getElementById('balanceAccountingCategory');
    expect(input).toBeTruthy();
    await userEvent.click(input);
    await waitFor(() => {
      expect(screen.getByText('1051 - Mercury Checking')).toBeInTheDocument();
    });

    await userEvent.type(input, 'stripe');
    await waitFor(() => {
      expect(screen.getByText('1030 - Stripe Clearing')).toBeInTheDocument();
    });
    expect(screen.queryByText('1051 - Mercury Checking')).not.toBeInTheDocument();
  });
});

const wiseHost = {
  ...host,
  transferwise: { __typename: 'TransferWise', id: 'tw-1' },
} as unknown as React.ComponentProps<typeof PayExpenseModal>['host'];

const bankExpense = {
  ...expense,
  payoutMethod: { id: 'pm-1', type: 'BANK_ACCOUNT', data: {} },
} as unknown as React.ComponentProps<typeof PayExpenseModal>['expense'];

const quoteMockWith = (transferwise: unknown) => ({
  request: {
    query: quoteExpenseQuery,
    variables: { id: 'expense-1' },
  },
  result: {
    data: {
      expense: {
        __typename: 'Expense',
        id: 'expense-1',
        currency: 'USD',
        reference: null,
        amountInHostCurrency: { __typename: 'Amount', exchangeRate: null },
        host: { __typename: 'Host', id: 'host-1', transferwise },
        quote: {
          __typename: 'ExpenseQuote',
          paymentProcessorFeeAmount: { __typename: 'Amount', valueInCents: 0, currency: 'USD' },
          sourceAmount: { __typename: 'Amount', valueInCents: 10000, currency: 'USD' },
          estimatedDeliveryAt: null,
          notices: [],
        },
      },
    },
  },
});

const renderPayModal = (
  hostProp: React.ComponentProps<typeof PayExpenseModal>['host'],
  quoteMock: ReturnType<typeof quoteMockWith>,
) =>
  render(
    <IntlProvider locale="en">
      <ThemeProvider theme={theme}>
        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
          <MockedProvider mocks={[quoteMock] as never[]} addTypename>
            <PayExpenseModal
              expense={bankExpense}
              collective={{ currency: 'USD' } as never}
              host={hostProp}
              onClose={jest.fn()}
              onSubmit={jest.fn()}
              canPayWithAutomaticPayment={true}
            />
          </MockedProvider>
        </TooltipProvider>
      </ThemeProvider>
    </IntlProvider>,
  );

describe('PayExpenseModal when Wise data is unavailable', () => {
  it('does not crash when the quote query returns transferwise: null', async () => {
    renderPayModal(wiseHost, quoteMockWith(null));

    expect(await screen.findByText('Pay expense')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Not Enough Funds')).not.toBeInTheDocument());
  });

  it('does not crash when balances is null (eg. non-admin or Wise error)', async () => {
    renderPayModal(
      wiseHost,
      quoteMockWith({ __typename: 'TransferWise', id: 'tw-1', amountBatched: null, balances: null }),
    );

    expect(await screen.findByText('Pay expense')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Not Enough Funds')).not.toBeInTheDocument());
  });
});
