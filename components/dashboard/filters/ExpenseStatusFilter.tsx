import React from 'react';
import { isEmpty, omit, uniq } from 'lodash';
import { defineMessage } from 'react-intl';
import { z } from 'zod';

import { ExpenseMetaStatuses } from '../../../lib/expense';
import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { isMulti } from '../../../lib/filters/schemas';
import { ExpenseStatusFilter as ExpenseStatusFilterEnum } from '../../../lib/graphql/types/v2/schema';
import { i18nExpenseStatus } from '../../../lib/i18n/expense';
import { sortSelectOptions } from '../../../lib/utils';

import ComboSelectFilter from './ComboSelectFilter';

const expenseStatusFilterSchema = isMulti(z.nativeEnum(ExpenseStatusFilterEnum)).optional();

type ExpenseStatusFilterValue = z.infer<typeof expenseStatusFilterSchema>;

export type ExpenseStatusFilterMeta = {
  hideExpensesMetaStatuses?: boolean;
};

function ExpenseStatusFilter({
  meta,
  valueRenderer,
  intl,
  ...props
}: FilterComponentProps<ExpenseStatusFilterValue, ExpenseStatusFilterMeta>) {
  return (
    <ComboSelectFilter
      isMulti
      options={Object.values(omit(ExpenseStatusFilterEnum, ExpenseStatusFilterEnum.UNVERIFIED))
        .filter(value => !meta?.hideExpensesMetaStatuses || !(ExpenseMetaStatuses as readonly string[]).includes(value))
        .map(value => ({ label: valueRenderer({ intl, value }), value }))
        .sort(sortSelectOptions)}
      {...props}
    />
  );
}

export const expenseStatusFilter: FilterConfig<ExpenseStatusFilterValue> & {
  toVariables: (value: ExpenseStatusFilterValue) => Record<string, unknown> | undefined;
} = {
  schema: expenseStatusFilterSchema,
  filter: {
    static: true,
    labelMsg: defineMessage({ id: 'expense.status', defaultMessage: 'Status' }),
    Component: ExpenseStatusFilter,
    valueRenderer: ({ intl, value }) => i18nExpenseStatus(intl, value),
  },
  toVariables: value => {
    return isEmpty(value)
      ? undefined
      : value.includes(ExpenseStatusFilterEnum.PENDING)
        ? {
            status: uniq([...value, ExpenseStatusFilterEnum.UNVERIFIED]), // include "Unverified" as "PENDING"
          }
        : { status: value };
  },
};
