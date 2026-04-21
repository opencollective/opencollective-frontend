import React from 'react';
import { isEmpty } from 'lodash';
import { defineMessage, defineMessages } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';
import { sortSelectOptions } from '../../../lib/utils';
import { ExpenseKycStatusFilter } from '@/lib/graphql/types/v2/graphql';

import ComboSelectFilter from './ComboSelectFilter';

const expenseKYCStatusFilterSchema = z.nativeEnum(ExpenseKycStatusFilter).optional();

type ExpenseKYCStatusFilterValue = z.infer<typeof expenseKYCStatusFilterSchema>;

type ExpenseKYCStatusFilterMeta = object;

const expenseKYCStatusMessages = defineMessages({
  [ExpenseKycStatusFilter.PENDING]: {
    defaultMessage: 'KYC Pending',
    id: 'YC8RDd',
  },
  [ExpenseKycStatusFilter.VERIFIED]: {
    defaultMessage: 'KYC Verified',
    id: 'eEXNr4',
  },
});

function ExpenseKYCStatusFilter({
  valueRenderer,
  intl,
  ...props
}: FilterComponentProps<ExpenseKYCStatusFilterValue, ExpenseKYCStatusFilterMeta>) {
  return (
    <ComboSelectFilter
      options={Object.values(ExpenseKycStatusFilter)
        .map(value => ({ label: valueRenderer({ value, intl }), value }))
        .sort(sortSelectOptions)}
      {...props}
    />
  );
}

export const expenseKYCStatusFilter: FilterConfig<ExpenseKYCStatusFilterValue> & {
  toVariables: (value: ExpenseKYCStatusFilterValue) => Record<string, unknown> | undefined;
} = {
  schema: expenseKYCStatusFilterSchema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Expense KYC Status', id: 'h/nFkL' }),
    Component: ExpenseKYCStatusFilter,
    valueRenderer: ({ value, intl }) => (value ? intl.formatMessage(expenseKYCStatusMessages[value]) : undefined),
  },
  toVariables: value => {
    return isEmpty(value) ? undefined : { kycStatus: value };
  },
};
