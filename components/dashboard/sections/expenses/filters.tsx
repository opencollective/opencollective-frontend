import React from 'react';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { boolean, isMulti, limit, offset } from '../../../../lib/filters/schemas';
import type {
  AccountExpensesQueryVariables,
  HostDashboardExpensesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import type { Currency } from '../../../../lib/graphql/types/v2/schema';
import { AccountingCategoryKind, LastCommentBy, PayoutMethodType } from '../../../../lib/graphql/types/v2/schema';
import { LastCommentByFilterLabels } from '../../../../lib/i18n/last-comment-by-filter';
import i18nPayoutMethodType from '../../../../lib/i18n/payout-method-type';
import { i18nChargeHasReceipts } from '../../../../lib/i18n/receipts-filter';

import { accountingCategoryFilter } from '../../filters/AccountingCategoryFilter';
import { amountFilter } from '../../filters/AmountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { expensePayeeFilter, type ExpensePayeeFilterMeta } from '../../filters/ExpensePayeeFilter';
import { expenseStatusFilter, type ExpenseStatusFilterMeta } from '../../filters/ExpenseStatusFilter';
import { expenseTagFilter } from '../../filters/ExpenseTagsFilter';
import { expenseTypeFilter, type ExpenseTypeFilterMeta } from '../../filters/ExpenseTypeFilter';
import { searchFilter } from '../../filters/SearchFilter';
import { buildSortFilter } from '../../filters/SortFilter';
import { VirtualCardRenderer } from '../../filters/VirtualCardsFilter';

const sortFilter = buildSortFilter({
  fieldSchema: z.enum(['CREATED_AT']),
  defaultValue: {
    field: 'CREATED_AT',
    direction: 'DESC',
  },
  i18nCustomLabels: {
    CREATED_AT: defineMessage({ defaultMessage: 'Date Submitted', id: 'jS+tfC' }),
  },
});

export const schema = z.object({
  limit: limit.default(10),
  offset,
  sort: sortFilter.schema,
  searchTerm: searchFilter.schema,
  date: dateFilter.schema,
  amount: amountFilter.schema,
  status: expenseStatusFilter.schema,
  type: expenseTypeFilter.schema,
  payout: z.nativeEnum(PayoutMethodType).optional(),
  lastCommentBy: isMulti(z.nativeEnum(LastCommentBy)).optional(),
  tag: expenseTagFilter.schema,
  chargeHasReceipts: boolean.optional(),
  virtualCard: isMulti(z.string()).optional(),
  accountingCategory: accountingCategoryFilter.schema,
  payoutMethodId: z.string().optional(),
  fromAccounts: expensePayeeFilter.schema,
});

export type FilterValues = z.infer<typeof schema>;

export const ExpenseAccountingCategoryKinds = [AccountingCategoryKind.EXPENSE] as const;

export type FilterMeta = ExpensePayeeFilterMeta &
  ExpenseTypeFilterMeta &
  ExpenseStatusFilterMeta & {
    currency?: Currency;
    accountingCategoryKinds?: readonly AccountingCategoryKind[];
  };

// Only needed when either the key or the expected query variables are different
export const toVariables: FiltersToVariables<
  FilterValues,
  HostDashboardExpensesQueryVariables & AccountExpensesQueryVariables
> = {
  date: dateFilter.toVariables,
  amount: amountFilter.toVariables,
  payout: value => ({ payoutMethodType: value }),
  tag: expenseTagFilter.toVariables,
  virtualCard: virtualCardIds => ({ virtualCards: virtualCardIds.map(id => ({ id })) }),
  payoutMethodId: id => ({ payoutMethod: { id } }),
  type: expenseTypeFilter.toVariables,
  status: expenseStatusFilter.toVariables,
  fromAccounts: expensePayeeFilter.toVariables,
};

// The filters config is used to populate the Filters component.
export const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  sort: sortFilter.filter,
  searchTerm: searchFilter.filter,
  date: { ...dateFilter.filter, labelMsg: defineMessage({ defaultMessage: 'Date Submitted', id: 'jS+tfC' }) },
  amount: amountFilter.filter,
  accountingCategory: accountingCategoryFilter.filter,
  status: expenseStatusFilter.filter,
  type: expenseTypeFilter.filter,
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
  tag: expenseTagFilter.filter,
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
  lastCommentBy: {
    labelMsg: defineMessage({ id: 'expenses.lastCommentByFilter', defaultMessage: 'Last Comment By' }),
    Component: ({ valueRenderer, intl, ...props }) => {
      const options = React.useMemo(
        () =>
          Object.values(LastCommentBy).map(value => ({
            value,
            label: valueRenderer({ value, intl }),
          })),
        [valueRenderer, intl],
      );
      return <ComboSelectFilter options={options} isMulti {...props} />;
    },
    valueRenderer: ({ value, intl }) => intl.formatMessage(LastCommentByFilterLabels[value]),
  },
  fromAccounts: expensePayeeFilter.filter,
  virtualCard: {
    labelMsg: defineMessage({ id: 'PayoutMethod.Type.VirtualCard', defaultMessage: 'Virtual Card' }),
    valueRenderer: ({ value }) => <VirtualCardRenderer id={value} />,
  },
  payoutMethodId: {
    labelMsg: defineMessage({ defaultMessage: 'Payout Method', id: 'PayoutMethod' }),
    valueRenderer: ({ value }) => value.split('-')[0],
  },
};
