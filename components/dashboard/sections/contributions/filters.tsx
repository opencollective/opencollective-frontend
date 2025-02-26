import React from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import type { Currency, DashboardRecurringContributionsQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { ContributionFrequency, OrderStatus } from '../../../../lib/graphql/types/v2/graphql';
import { i18nFrequency, i18nOrderStatus } from '../../../../lib/i18n/order';
import { sortSelectOptions } from '../../../../lib/utils';

import { amountFilter } from '../../filters/AmountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { expectedDateFilter, orderChargeDateFilter, orderCreateDateFilter } from '../../filters/DateFilter';
import { expectedFundsFilter } from '../../filters/ExpectedFundsFilter';
import { searchFilter } from '../../filters/SearchFilter';
import { buildSortFilter } from '../../filters/SortFilter';

export const contributionsOrderFilter = buildSortFilter({
  fieldSchema: z.enum(['LAST_CHARGED_AT', 'CREATED_AT']),
  defaultValue: {
    field: 'LAST_CHARGED_AT',
    direction: 'DESC',
  },
  i18nCustomLabels: {
    LAST_CHARGED_AT: defineMessage({
      id: 'Contribution.ChargeDate',
      defaultMessage: 'Charge Date',
    }),
    CREATED_AT: defineMessage({
      id: 'Contribution.CreationDate',
      defaultMessage: 'Creation Date',
    }),
  },
});

const PAGE_SIZE = 20;

export const schema = z.object({
  limit: integer.default(PAGE_SIZE),
  offset: integer.default(0),
  orderBy: contributionsOrderFilter.schema,
  searchTerm: searchFilter.schema,
  expectedDate: expectedDateFilter.schema,
  chargeDate: orderChargeDateFilter.schema,
  date: orderCreateDateFilter.schema,
  expectedFundsFilter: expectedFundsFilter.schema,
  amount: amountFilter.schema,
  status: isMulti(z.nativeEnum(OrderStatus)).optional(),
  frequency: isMulti(z.nativeEnum(ContributionFrequency)).optional(),
  paymentMethodId: isMulti(z.string()).optional(),
  tier: isMulti(z.string()).optional(),
});

type FilterValues = z.infer<typeof schema>;

export type FilterMeta = {
  currency?: Currency;
  tierOptions?: Array<{ label: string; value: string }>;
};

type GraphQLQueryVariables = DashboardRecurringContributionsQueryVariables;

// Only needed when either the values or key of filters are different
// to expected key or value of QueryVariables
export const toVariables: FiltersToVariables<FilterValues, GraphQLQueryVariables, FilterMeta> = {
  orderBy: contributionsOrderFilter.toVariables,
  expectedDate: expectedDateFilter.toVariables,
  chargeDate: orderChargeDateFilter.toVariables,
  date: orderCreateDateFilter.toVariables,
  amount: amountFilter.toVariables,
  paymentMethodId: ids => ({ paymentMethod: ids.map(id => ({ id })) }),
  tier: (value: [string]) => {
    return { tier: value.map(id => ({ id })) };
  },
};

export const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  searchTerm: searchFilter.filter,
  expectedDate: expectedDateFilter.filter,
  chargeDate: orderChargeDateFilter.filter,
  date: orderCreateDateFilter.filter,
  expectedFundsFilter: expectedFundsFilter.filter,
  amount: { ...amountFilter.filter, labelMsg: defineMessage({ id: 'Fields.amount', defaultMessage: 'Amount' }) },
  orderBy: contributionsOrderFilter.filter,
  status: {
    labelMsg: defineMessage({ defaultMessage: 'Status', id: 'tzMNF3' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(OrderStatus)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        isMulti
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => i18nOrderStatus(intl, value),
  },
  tier: {
    labelMsg: defineMessage({ defaultMessage: 'Tier', id: 'b07w+D' }),
    Component: ({ meta, ...props }) => {
      return <ComboSelectFilter options={meta.tierOptions} isMulti {...props} />;
    },
    valueRenderer: ({ value, meta }) => meta.tierOptions?.find(tier => tier.value === value)?.label ?? value,
  },
  frequency: {
    labelMsg: defineMessage({ id: 'Frequency', defaultMessage: 'Frequency' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(ContributionFrequency)
          .map(value => ({ label: valueRenderer({ value, intl }), value }))
          .sort(sortSelectOptions)}
        isMulti
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nFrequency(intl, value),
  },
  paymentMethodId: {
    labelMsg: defineMessage({ defaultMessage: 'Payment Method', id: 'paymentmethod.label' }),
    valueRenderer: ({ value }) => value.split('-')[0],
  },
};
