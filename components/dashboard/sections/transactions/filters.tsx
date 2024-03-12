import React from 'react';
import { omit } from 'lodash';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import { PAYMENT_METHOD_TYPE } from '../../../../lib/constants/payment-methods';
import { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { boolean, integer, isMulti, isNullable, limit, offset } from '../../../../lib/filters/schemas';
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
import { i18nPaymentMethodType } from '../../../../lib/i18n/payment-method-type';
import { i18nTransactionKind, i18nTransactionType } from '../../../../lib/i18n/transaction';
import { sortSelectOptions } from '../../../../lib/utils';

import { Input } from '../../../ui/Input';
import { amountFilter } from '../../filters/AmountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { dateFilter } from '../../filters/DateFilter';
import { orderByFilter } from '../../filters/OrderFilter';
import { searchFilter } from '../../filters/SearchFilter';
import { VirtualCardRenderer } from '../../filters/VirtualCardsFilter';

export const schema = z.object({
  limit: limit.default(20),
  offset,
  date: dateFilter.schema,
  amount: amountFilter.schema,
  orderBy: orderByFilter.schema,
  searchTerm: searchFilter.schema,
  kind: isMulti(z.nativeEnum(TransactionKind)).optional(),
  type: z.nativeEnum(TransactionType).optional(),
  paymentMethodType: isMulti(isNullable(z.nativeEnum(PaymentMethodType))).optional(),
  virtualCard: isMulti(z.string()).optional(),
  expenseType: isMulti(z.nativeEnum(ExpenseType)).optional(),
  expenseId: integer.optional(),
  contributionId: integer.optional(),
  openTransactionId: z.string().optional(),
  group: z.string().optional(),
  isRefund: boolean.optional(),
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
  amount: amountFilter.toVariables,
  virtualCard: (virtualCardIds, key) => ({ [key]: virtualCardIds.map(id => ({ id })) }),
  expenseId: id => ({ expense: { legacyId: id } }),
  contributionId: id => ({ order: { legacyId: id } }),
};

// The filters config is used to populate the Filters component.
export const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  searchTerm: searchFilter.filter,
  date: dateFilter.filter,
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
            .map(value => ({
              label: i18nTransactionKind(intl, value),
              value,
            }))
            .sort(sortSelectOptions)}
          {...props}
        />
      );
    },
    valueRenderer: ({ value, intl }) => i18nTransactionKind(intl, value),
  },
  paymentMethodType: {
    labelMsg: defineMessage({ id: 'Fields.paymentMethod', defaultMessage: 'Payment method' }),
    Component: ({ value, meta, intl, ...props }) => {
      const paymentMethodTypes = meta?.paymentMethodTypes || PAYMENT_METHOD_TYPE;
      return (
        <ComboSelectFilter
          isMulti
          value={value?.map(v => String(v))} // Turn into string to make the `null` value work with the component
          options={Object.values(paymentMethodTypes).map(value => ({
            label: i18nPaymentMethodType(intl, value),
            value: String(value),
          }))}
          {...props}
        />
      );
    },
    valueRenderer: ({ value, intl }) => i18nPaymentMethodType(intl, value),
  },
  virtualCard: {
    labelMsg: defineMessage({ id: 'PayoutMethod.Type.VirtualCard', defaultMessage: 'Virtual Card' }),
    valueRenderer: ({ value }) => <VirtualCardRenderer id={value} />,
  },
  group: {
    labelMsg: defineMessage({ defaultMessage: 'Transaction group' }),
    valueRenderer: ({ value }) => value.substring(0, 8),
  },
  expenseType: {
    labelMsg: defineMessage({ defaultMessage: 'Expense type' }),

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
  contributionId: {
    labelMsg: defineMessage({ defaultMessage: 'Contribution ID' }),
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
    labelMsg: defineMessage({ defaultMessage: 'Expense ID' }),
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
  isRefund: {
    labelMsg: defineMessage({ defaultMessage: 'Is Refund' }),
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
};
