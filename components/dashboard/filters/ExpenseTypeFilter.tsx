import React from 'react';
import { isEmpty, omit } from 'lodash';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { isMulti, isNullable } from '../../../lib/filters/schemas';
import { ExpenseType } from '../../../lib/graphql/types/v2/graphql';
import { i18nExpenseType } from '../../../lib/i18n/expense';
import { sortSelectOptions } from '../../../lib/utils';

import ComboSelectFilter from './ComboSelectFilter';

const expenseTypeFilterSchema = isNullable(isMulti(z.nativeEnum(ExpenseType)));

type ExpenseTypeFilterValue = z.infer<typeof expenseTypeFilterSchema>;

export type ExpenseTypeFilterMeta = {
  omitExpenseTypes?: ExpenseType[];
};

function ExpenseTypeFilter({
  meta,
  valueRenderer,
  intl,
  ...props
}: FilterComponentProps<ExpenseTypeFilterValue, ExpenseTypeFilterMeta>) {
  return (
    <ComboSelectFilter
      isMulti
      options={Object.values(omit(ExpenseType, [ExpenseType.FUNDING_REQUEST, ...(meta?.omitExpenseTypes ?? [])]))
        .map(value => ({ label: valueRenderer({ value, intl }), value }))
        .sort(sortSelectOptions)}
      {...props}
    />
  );
}

export const expenseTypeFilter: FilterConfig<ExpenseTypeFilterValue> & {
  toVariables: (value: ExpenseTypeFilterValue, key: string, meta?: ExpenseTypeFilterMeta) => Record<string, unknown>;
} = {
  schema: expenseTypeFilterSchema,
  filter: {
    labelMsg: defineMessage({ id: 'expense.type', defaultMessage: 'Type' }),
    Component: ExpenseTypeFilter,
    valueRenderer: ({ value, intl }) => i18nExpenseType(intl, value),
  },
  toVariables: (value, key, meta) => {
    // Note: Using the `types` GraphQL query variable to allow multi-selection
    return isEmpty(value)
      ? meta?.omitExpenseTypes
        ? { types: Object.values(ExpenseType).filter(v => !meta.omitExpenseTypes.includes(v)) }
        : undefined
      : { types: value };
  },
};
