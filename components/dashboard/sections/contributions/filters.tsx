import React from 'react';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FilterConfig, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import {
  ContributionFrequency,
  Currency,
  DashboardRecurringContributionsQueryVariables,
  ExpectedFundsFilter,
  HostContributionsQueryVariables,
  OrderStatus,
} from '../../../../lib/graphql/types/v2/graphql';
import i18nOrderStatus from '../../../../lib/i18n/order-status';
import { sortSelectOptions } from '../../../../lib/utils';

import { amountFilter } from '../../filters/AmountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { DateFilter, dateFilter } from '../../filters/DateFilter';
import { DateFilterValue } from '../../filters/DateFilter/DateFilterValue';
import { dateFilterSchema, dateToVariables } from '../../filters/DateFilter/schema';
import { orderByFilter } from '../../filters/OrderFilter';
import { searchFilter } from '../../filters/SearchFilter';

// Pseudo type filter
export enum OrderTypeFilter {
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
}
const i18nOrderType = (intl, value) => {
  const langs = {
    [OrderTypeFilter.RECURRING]: intl.formatMessage({ defaultMessage: 'Recurring', id: 'v84fNv' }),
    [OrderTypeFilter.ONETIME]: intl.formatMessage({ defaultMessage: 'One-time', id: '/Zj5Ed' }),
  };
  return langs[value] ?? value;
};

const PAGE_SIZE = 20;

const expectedDateFilter: FilterConfig<z.infer<typeof dateFilterSchema>> = {
  schema: dateFilterSchema,
  toVariables: value => dateToVariables(value, 'expectedDate'),
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Expected Date', id: 'vNC2dX' }),
    Component: DateFilter,
    valueRenderer: DateFilterValue,
  },
};

export const schema = z.object({
  limit: integer.default(PAGE_SIZE),
  offset: integer.default(0),
  orderBy: orderByFilter.schema,
  searchTerm: searchFilter.schema,
  date: dateFilter.schema,
  expectedDate: expectedDateFilter.schema,
  expectedFundsFilter: z.nativeEnum(ExpectedFundsFilter).optional(),
  amount: amountFilter.schema,
  status: isMulti(z.nativeEnum(OrderStatus)).optional(),
  type: z.nativeEnum(OrderTypeFilter).optional(),
  paymentMethod: z.string().optional(),
});

export type FilterValues = z.infer<typeof schema>;

export type FilterMeta = {
  currency?: Currency;
};

type GraphQLQueryVariables = HostContributionsQueryVariables & DashboardRecurringContributionsQueryVariables;

// Only needed when either the values or key of filters are different
// to expected key or value of QueryVariables
export const toVariables: FiltersToVariables<FilterValues, GraphQLQueryVariables, FilterMeta> = {
  orderBy: orderByFilter.toVariables,
  date: dateFilter.toVariables,
  expectedDate: expectedDateFilter.toVariables,
  amount: amountFilter.toVariables,
  type: (value: OrderTypeFilter) => {
    switch (value) {
      case OrderTypeFilter.RECURRING:
        return {
          onlySubscriptions: true,
        };
      case OrderTypeFilter.ONETIME:
        return {
          frequency: ContributionFrequency.ONETIME,
        };
    }
  },
  paymentMethod: (value: string) => {
    if (value) {
      return { paymentMethod: { id: value } };
    }

    return null;
  },
};

export const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  searchTerm: searchFilter.filter,
  date: dateFilter.filter,
  expectedDate: expectedDateFilter.filter,
  expectedFundsFilter: {
    labelMsg: defineMessage({ defaultMessage: 'Expected Funds', id: 'ExpectedFunds' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        isMulti={false}
        options={Object.values(ExpectedFundsFilter).map(value => ({ label: valueRenderer({ intl, value }), value }))}
        {...props}
      />
    ),
    valueRenderer: ({ value }) =>
      value === ExpectedFundsFilter.MANUAL ? (
        <FormattedMessage defaultMessage="Created by contributors" id="wa5frV" />
      ) : (
        <FormattedMessage defaultMessage="Created by host admin" id="See4A8" />
      ),
  },
  amount: { ...amountFilter.filter, labelMsg: defineMessage({ id: 'TotalAmount', defaultMessage: 'Total amount' }) },
  orderBy: orderByFilter.filter,
  status: {
    labelMsg: defineMessage({ defaultMessage: 'Status', id: 'tzMNF3' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(OrderStatus)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => i18nOrderStatus(intl, value),
  },
  type: {
    labelMsg: defineMessage({ id: 'expense.type', defaultMessage: 'Type' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(OrderTypeFilter)
          .map(value => ({ label: valueRenderer({ value, intl }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nOrderType(intl, value),
  },
  paymentMethod: {
    labelMsg: defineMessage({ id: 'paymentmethod.label', defaultMessage: 'Payment Method' }),
  },
};
