import React from 'react';
import { uniq } from 'lodash';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { isMulti, isNullable, limit, offset } from '../../../../lib/filters/schemas';
import {
  Currency,
  PaymentMethodType,
  TransactionKind,
  TransactionsTableQueryVariables,
  TransactionType,
} from '../../../../lib/graphql/types/v2/graphql';
import { i18nPaymentMethodType } from '../../../../lib/i18n/payment-method-type';
import { i18nTransactionKind, i18nTransactionType } from '../../../../lib/i18n/transaction';
import { sortSelectOptions } from '../../../../lib/utils';

import { getDefaultKinds } from '../../../transactions/filters/TransactionsKindFilter';
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
  openTransactionId: z.string().optional(),
  group: z.string().optional(),
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
      const kinds = uniq([...(meta?.kinds || []), ...getDefaultKinds()]);
      return (
        <ComboSelectFilter
          isMulti
          options={kinds
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
      const paymentMethodTypes = meta?.paymentMethodTypes || PaymentMethodType;
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
};
