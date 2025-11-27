import React from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import type { Currency, DashboardRecurringContributionsQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { ContributionFrequency, OrderStatus } from '../../../../lib/graphql/types/v2/graphql';
import { i18nFrequency, i18nOrderStatus } from '../../../../lib/i18n/order';
import { sortSelectOptions } from '../../../../lib/utils';
import type { Account } from '@/lib/graphql/types/v2/schema';
import { AccountingCategoryKind } from '@/lib/graphql/types/v2/schema';

import { accountingCategoryFilter } from '../../filters/AccountingCategoryFilter';
import { amountFilter } from '../../filters/AmountFilter';
import { childAccountFilter } from '../../filters/ChildAccountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { expectedDateFilter, orderChargeDateFilter, orderCreateDateFilter } from '../../filters/DateFilter';
import { expectedFundsFilter } from '../../filters/ExpectedFundsFilter';
import { hostContextFilter } from '../../filters/HostContextFilter';
import { paymentMethodFilter } from '../../filters/PaymentMethodFilter';
import { searchFilter } from '../../filters/SearchFilter';
import { buildSortFilter } from '../../filters/SortFilter';
import { tierFilter } from '../../filters/TierFilter';

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
  paymentMethod: paymentMethodFilter.schema,
  accountingCategory: accountingCategoryFilter.schema,
  tier: tierFilter.schema,
  account: childAccountFilter.schema,
});

export const hostSchema = schema.extend({ hostContext: hostContextFilter.schema });

type FilterValues = z.infer<typeof schema>;

export const ContributionAccountingCategoryKinds = [
  AccountingCategoryKind.CONTRIBUTION,
  AccountingCategoryKind.ADDED_FUNDS,
] as const;

export type FilterMeta = {
  currency?: Currency;
  childrenAccounts?: Account[];
  accountSlug?: string;
  showChildAccountFilter?: boolean;
  hostSlug?: string;
  includeUncategorized?: boolean;
  accountingCategoryKinds?: readonly AccountingCategoryKind[];
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
  paymentMethod: paymentMethodFilter.toVariables,
  accountingCategory: value => ({ accountingCategory: value }),
  tier: tierFilter.toVariables,
  account: (value, key, meta) => {
    if (meta?.childrenAccounts && !meta.childrenAccounts.length) {
      return { includeChildrenAccounts: false };
    } else if (!value) {
      return { includeChildrenAccounts: true };
    } else {
      return { slug: value, includeChildrenAccounts: false };
    }
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
  tier: tierFilter.filter,
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
  paymentMethod: paymentMethodFilter.filter,
  accountingCategory: accountingCategoryFilter.filter,
  account: {
    ...childAccountFilter.filter,
    hide: ({ meta }) => !meta?.showChildAccountFilter || !meta?.childrenAccounts || meta.childrenAccounts.length === 0,
  },
};
