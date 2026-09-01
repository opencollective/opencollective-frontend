import '@testing-library/jest-dom';

import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import theme from '../../lib/theme';

import { DashboardContext } from '../dashboard/DashboardContext';

import {
  BalanceAccountingCategoryPicker,
  balanceAccountingCategoryPickerQuery,
} from './BalanceAccountingCategoryPicker';

const mocks = [
  {
    request: { query: balanceAccountingCategoryPickerQuery, variables: { hostSlug: 'test-host', account: null, order: null, expense: null } },
    result: {
      data: {
        host: {
          __typename: 'Host',
          id: 'host-1',
          balanceAccountingCategories: {
            __typename: 'AccountingCategoryCollection',
            nodes: [
              { __typename: 'AccountingCategory', id: 'cat-1', code: '1051', name: 'Mercury Checking', friendlyName: null, kind: 'BALANCE_ACCOUNT' },
              { __typename: 'AccountingCategory', id: 'cat-2', code: '1030', name: 'Stripe Clearing', friendlyName: null, kind: 'BALANCE_ACCOUNT' },
              { __typename: 'AccountingCategory', id: 'cat-3', code: '1052', name: 'Umpqua Savings', friendlyName: null, kind: 'BALANCE_ACCOUNT' },
            ],
          },
          suggestedBalanceAccountingCategories: [],
        },
      },
    },
  },
];

const dashboardContext = {
  account: { features: { CHART_OF_ACCOUNTS: 'ACTIVE' } },
} as unknown as React.ContextType<typeof DashboardContext>;

const renderPicker = (props: Partial<React.ComponentProps<typeof BalanceAccountingCategoryPicker>> = {}) =>
  render(
    <IntlProvider locale="en">
      <ThemeProvider theme={theme}>
        <MockedProvider mocks={mocks} addTypename>
          <DashboardContext.Provider value={dashboardContext}>
            <BalanceAccountingCategoryPicker
              hostSlug="test-host"
              inputId="balance-category-picker"
              value={null}
              onChange={jest.fn()}
              {...props}
            />
          </DashboardContext.Provider>
        </MockedProvider>
      </ThemeProvider>
    </IntlProvider>,
  );

describe('BalanceAccountingCategoryPicker', () => {
  it('renders nothing when the host has no balance/clearing categories', async () => {
    const emptyMock = {
      request: { query: balanceAccountingCategoryPickerQuery, variables: { hostSlug: 'empty-host', account: null, order: null, expense: null } },
      result: {
        data: {
          host: {
            __typename: 'Host',
            id: 'host-2',
            balanceAccountingCategories: { __typename: 'AccountingCategoryCollection', nodes: [] },
            suggestedBalanceAccountingCategories: [],
          },
        },
      },
    };
    const { container } = render(
      <IntlProvider locale="en">
        <ThemeProvider theme={theme}>
          <MockedProvider mocks={[emptyMock]} addTypename>
            <DashboardContext.Provider value={dashboardContext}>
              <BalanceAccountingCategoryPicker
                hostSlug="empty-host"
                inputId="empty-picker"
                value={null}
                onChange={jest.fn()}
              />
            </DashboardContext.Provider>
          </MockedProvider>
        </ThemeProvider>
      </IntlProvider>,
    );
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('lists all categories when opened', async () => {
    renderPicker();
    const input = await screen.findByRole('combobox');
    await userEvent.click(input);
    await waitFor(() => {
      expect(screen.getByText('1051 - Mercury Checking')).toBeInTheDocument();
    });
    expect(screen.getByText('1030 - Stripe Clearing')).toBeInTheDocument();
    expect(screen.getByText('1052 - Umpqua Savings')).toBeInTheDocument();
  });

  it('filters categories when searching by name', async () => {
    renderPicker();
    const input = await screen.findByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'mercury');
    await waitFor(() => {
      expect(screen.getByText('1051 - Mercury Checking')).toBeInTheDocument();
    });
    expect(screen.queryByText('1030 - Stripe Clearing')).not.toBeInTheDocument();
  });

  it('filters categories when searching by code', async () => {
    renderPicker();
    const input = await screen.findByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, '1030');
    await waitFor(() => {
      expect(screen.getByText('1030 - Stripe Clearing')).toBeInTheDocument();
    });
    expect(screen.queryByText('1051 - Mercury Checking')).not.toBeInTheDocument();
  });
});
