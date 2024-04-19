import React from 'react';
import { omit } from 'lodash';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { boolean, integer, isMulti, limit, offset } from '../../../../lib/filters/schemas';
import {
  Currency,
  ExpenseType,
  PaymentMethodType,
  TransactionKind,
  TransactionsTableQueryVariables,
  TransactionType,
} from '../../../../lib/graphql/types/v2/graphql';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import { i18nIsRefund } from '../../../../lib/i18n/is-refund';
import { i18nTransactionKind, i18nTransactionType } from '../../../../lib/i18n/transaction';
import { sortSelectOptions } from '../../../../lib/utils';

import { Input } from '../../../ui/Input';
import { amountFilter } from '../../filters/AmountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { dateToVariables } from '../../filters/DateFilter/schema';
import { buildOrderByFilter, orderByFilter } from '../../filters/OrderFilter';
import { paymentMethodFilter } from '../../filters/PaymentMethodFilter';
import { searchFilter } from '../../filters/SearchFilter';
import { VirtualCardRenderer } from '../../filters/VirtualCardsFilter';

const clearedAtDateFilter = {
  ...dateFilter,
  toVariables: value => dateToVariables(value, 'cleared'),
  filter: {
    ...dateFilter.filter,
    labelMsg: defineMessage({ id: 'Gh3Obs', defaultMessage: 'Effective Date' }),
  },
};

export const schema = z.object({
  limit: limit.default(20),
  offset,
  date: dateFilter.schema,
  clearedAt: clearedAtDateFilter.schema,
  amount: amountFilter.schema,
  orderBy: orderByFilter.schema,
  searchTerm: searchFilter.schema,
  kind: isMulti(z.nativeEnum(TransactionKind)).optional(),
  type: z.nativeEnum(TransactionType).optional(),
  paymentMethod: paymentMethodFilter.schema,
  virtualCard: isMulti(z.string()).optional(),
  expenseType: isMulti(z.nativeEnum(ExpenseType)).optional(),
  expenseId: integer.optional(),
  orderId: integer.optional(),
  merchantId: z.string().optional(),
  openTransactionId: z.string().optional(),
  group: isMulti(z.string().uuid()).optional(),
  isRefund: boolean.optional(),
  dateField: z.enum(['createdAt', 'clearedAt']).default('createdAt'),
});

type FilterValues = z.infer<typeof schema>;

export type FilterMeta = {
  currency?: Currency;
  paymentMethodTypes?: PaymentMethodType[];
  kinds?: TransactionKind[];
};

// Only needed when values and key of filters are different
// to expected key and value of QueryVariables
export const toVariables: FiltersToVariables<FilterValues, TransactionsTableQueryVariables, FilterMeta> = {
  orderBy: orderByFilter.toVariables,
  date: dateFilter.toVariables,
  clearedAt: clearedAtDateFilter.toVariables,
  amount: amountFilter.toVariables,
  virtualCard: (virtualCardIds, key) => ({ [key]: virtualCardIds.map(id => ({ id })) }),
  expenseId: id => ({ expense: { legacyId: id } }),
  orderId: id => ({ order: { legacyId: id } }),
  paymentMethod: paymentMethodFilter.toVariables,
};

// export const orderByFilter = buildOrderByFilter(
//   z.enum(['CREATED_AT,DESC', 'CREATED_AT,ASC', 'EFFECTIVE_DATE,DESC', 'EFFECTIVE_DATE,ASC']).default('CREATED_AT,DESC'),
//   {
//     'CREATED_AT,DESC': defineMessage({ id: 'ExpensesOrder.NewestFirst', defaultMessage: 'Newest First' }),
//     'CREATED_AT,ASC': defineMessage({ id: 'ExpensesOrder.OldestFirst', defaultMessage: 'Oldest First' }),
//   },
// );

// The filters config is used to populate the Filters component.
export const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  searchTerm: searchFilter.filter,
  date: dateFilter.filter,
  clearedAt: clearedAtDateFilter.filter,
  amount: amountFilter.filter,
  orderBy: orderByFilter.filter,
  type: {
    labelMsg: defineMessage({ id: 'Type', defaultMessage: 'Type' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(TransactionType).map(value => ({ label: i18nTransactionType(intl, value), value }))}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nTransactionType(intl, value),
  },
  kind: {
    labelMsg: defineMessage({ id: 'Transaction.Kind', defaultMessage: 'Kind' }),
    Component: ({ meta, intl, ...props }) => {
      const kinds = meta?.kinds || TransactionKind;
      return (
        <ComboSelectFilter
          isMulti
          options={Object.values(kinds)
            .map(value => {
              const label = i18nTransactionKind(intl, value);
              return {
                label,
                value,
                keywords: [label],
              };
            })
            .sort(sortSelectOptions)}
          {...props}
        />
      );
    },
    valueRenderer: ({ value, intl }) => i18nTransactionKind(intl, value),
  },
  paymentMethod: paymentMethodFilter.filter,
  virtualCard: {
    labelMsg: defineMessage({ id: 'PayoutMethod.Type.VirtualCard', defaultMessage: 'Virtual Card' }),
    valueRenderer: ({ value }) => <VirtualCardRenderer id={value} />,
  },

  isRefund: {
    labelMsg: defineMessage({ defaultMessage: 'Is Refund', id: 'o+jEZR' }),
    Component: ({ intl, ...props }) => {
      const options = React.useMemo(() => {
        return [true, false].map(value => ({
          label: i18nIsRefund(intl, value),
          value,
        }));
      }, [intl]);
      return <ComboSelectFilter options={options} {...props} />;
    },
  },
  expenseType: {
    labelMsg: defineMessage({ defaultMessage: 'Expense type', id: '9cwufA' }),

    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(omit(ExpenseType, ExpenseType.FUNDING_REQUEST))
          .map(value => ({ label: valueRenderer({ value, intl }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nExpenseType(intl, value),
  },
  orderId: {
    labelMsg: defineMessage({ defaultMessage: 'Contribution ID', id: 'cVkF3C' }),
    Component: ({ value, onChange }) => {
      return (
        <div className="p-2">
          <Input
            autoFocus
            placeholder="1234"
            value={value}
            onChange={e => onChange(e.target.value.length ? Number(e.target.value) : undefined)}
          />
        </div>
      );
    },
  },
  expenseId: {
    labelMsg: defineMessage({ defaultMessage: 'Expense ID', id: 'aJWAKv' }),
    Component: ({ value, onChange }) => {
      return (
        <div className="p-2">
          <Input
            type="number"
            autoFocus
            placeholder="1234"
            value={value}
            onChange={e => onChange(e.target.value.length ? Number(e.target.value) : undefined)}
          />
        </div>
      );
    },
  },
  merchantId: {
    labelMsg: defineMessage({ defaultMessage: 'Merchant ID', id: 'EvIfQD' }),
    Component: ({ value, intl, onChange }) => {
      return (
        <div className="p-2">
          <Input
            autoFocus
            placeholder={intl.formatMessage({ defaultMessage: 'Merchant ID', id: 'EvIfQD' })}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      );
    },
  },
  group: {
    labelMsg: defineMessage({ defaultMessage: 'Group ID', id: 'nBKj/i' }),
    valueRenderer: ({ value }) => value.substring(0, 8),
    Component: props => <ComboSelectFilter isMulti creatable {...props} valueRenderer={undefined} />, // undefined valueRenderer to show full group ID in select filter
  },
};
