import React from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import type {
  Currency,
  DashboardRecurringContributionsQueryVariables,
  HostContributionsQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { ContributionFrequency, OrderStatus } from '../../../../lib/graphql/types/v2/graphql';
import i18nOrderStatus from '../../../../lib/i18n/order-status';
import { sortSelectOptions } from '../../../../lib/utils';

import { amountFilter } from '../../filters/AmountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { orderByFilter } from '../../filters/OrderFilter';
import { searchFilter } from '../../filters/SearchFilter';

// Pseudo type filter
export enum OrderTypeFilter {
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
}
const i18nOrderType = (intl, value) => {
  const langs = {
    [OrderTypeFilter.RECURRING]: intl.formatMessage({ defaultMessage: 'Recurring' }),
    [OrderTypeFilter.ONETIME]: intl.formatMessage({ defaultMessage: 'One-time' }),
  };
  return langs[value] ?? value;
};

const PAGE_SIZE = 20;

export const schema = z.object({
  limit: integer.default(PAGE_SIZE),
  offset: integer.default(0),
  orderBy: orderByFilter.schema,
  searchTerm: searchFilter.schema,
  date: dateFilter.schema,
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
  amount: { ...amountFilter.filter, labelMsg: defineMessage({ id: 'TotalAmount', defaultMessage: 'Total amount' }) },
  orderBy: orderByFilter.filter,
  status: {
    labelMsg: defineMessage({ defaultMessage: 'Status' }),
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
