import React from 'react';
import { omit } from 'lodash';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { boolean, isMulti, limit, offset } from '../../../../lib/filters/schemas';
import type {
  AccountExpensesQueryVariables,
  Currency,
  HostDashboardExpensesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { ExpenseStatusFilter, ExpenseType, PayoutMethodType } from '../../../../lib/graphql/types/v2/graphql';
import { i18nExpenseStatus, i18nExpenseType } from '../../../../lib/i18n/expense';
import i18nPayoutMethodType from '../../../../lib/i18n/payout-method-type';
import { i18nChargeHasReceipts } from '../../../../lib/i18n/receipts-filter';
import { sortSelectOptions } from '../../../../lib/utils';

import { amountFilter } from '../../filters/AmountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { expenseTagFilter } from '../../filters/ExpenseTagsFilter';
import { orderByFilter } from '../../filters/OrderFilter';
import { searchFilter } from '../../filters/SearchFilter';
import { VirtualCardRenderer } from '../../filters/VirtualCardsFilter';

export const schema = z.object({
  limit: limit.default(10),
  offset,
  orderBy: orderByFilter.schema,
  searchTerm: searchFilter.schema,
  date: dateFilter.schema,
  amount: amountFilter.schema,
  status: z.nativeEnum(ExpenseStatusFilter).optional(),
  type: z.nativeEnum(ExpenseType).optional(),
  payout: z.nativeEnum(PayoutMethodType).optional(),
  tag: expenseTagFilter.schema,
  chargeHasReceipts: boolean.optional(),
  virtualCard: isMulti(z.string()).optional(),
});

export type FilterValues = z.infer<typeof schema>;

export type FilterMeta = {
  currency?: Currency;
};

// Only needed when either the key or the expected query variables are different
export const toVariables: FiltersToVariables<
  FilterValues,
  HostDashboardExpensesQueryVariables & AccountExpensesQueryVariables
> = {
  orderBy: orderByFilter.toVariables,
  date: dateFilter.toVariables,
  amount: amountFilter.toVariables,
  payout: value => ({ payoutMethodType: value }),
  tag: value => ({ tags: value }),
  virtualCard: virtualCardIds => ({ virtualCards: virtualCardIds.map(id => ({ id })) }),
};

// The filters config is used to populate the Filters component.
export const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  orderBy: orderByFilter.filter,
  searchTerm: searchFilter.filter,
  date: dateFilter.filter,
  amount: amountFilter.filter,
  status: {
    static: true,
    labelMsg: defineMessage({ id: 'expense.status', defaultMessage: 'Status' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(ExpenseStatusFilter)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => i18nExpenseStatus(intl, value),
  },
  type: {
    labelMsg: defineMessage({ id: 'expense.type', defaultMessage: 'Type' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(omit(ExpenseType, ExpenseType.FUNDING_REQUEST))
          .map(value => ({ label: valueRenderer({ value, intl }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nExpenseType(intl, value),
  },
  payout: {
    labelMsg: defineMessage({ id: 'ExpenseForm.PayoutOptionLabel', defaultMessage: 'Payout method' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(PayoutMethodType).map(value => ({
          label: valueRenderer({ value, intl }),
          value,
        }))}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nPayoutMethodType(intl, value),
  },
  chargeHasReceipts: {
    labelMsg: defineMessage({ id: 'expenses.chargeHasReceiptsFilter', defaultMessage: 'Virtual Card Charge Receipts' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={[true, false].map(value => ({ value, label: valueRenderer({ value, intl }) }))}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nChargeHasReceipts(intl, value),
  },
  virtualCard: {
    labelMsg: defineMessage({ id: 'PayoutMethod.Type.VirtualCard', defaultMessage: 'Virtual Card' }),
    valueRenderer: ({ value }) => <VirtualCardRenderer id={value} />,
  },
};
