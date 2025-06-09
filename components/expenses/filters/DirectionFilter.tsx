import React, { useMemo } from 'react';
import { defineMessage, defineMessages } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '@/lib/filters/filter-types';

import ComboSelectFilter from '@/components/dashboard/filters/ComboSelectFilter';

export enum EXPENSE_DIRECTION {
  RECEIVED = 'RECEIVED',
  SUBMITTED = 'SUBMITTED',
}

const AccountStatusMessages = defineMessages({
  [EXPENSE_DIRECTION.RECEIVED]: { id: 'Expense.Direction.Received', defaultMessage: 'Received' },
  [EXPENSE_DIRECTION.SUBMITTED]: { id: 'Expense.Direction.Submitted', defaultMessage: 'Submitted' },
});

const schema = z.nativeEnum(EXPENSE_DIRECTION).optional();

type ExpenseDirectionFilterValue = z.infer<typeof schema>;

export const expenseDirectionFilter: FilterConfig<ExpenseDirectionFilterValue> = {
  schema,
  filter: {
    static: true,
    labelMsg: defineMessage({ id: 'Direction', defaultMessage: 'Direction' }),
    Component: ({ intl, ...props }) => {
      const options = useMemo(
        () => [
          {
            label: intl.formatMessage(AccountStatusMessages[EXPENSE_DIRECTION.RECEIVED]),
            value: EXPENSE_DIRECTION.RECEIVED,
          },
          {
            label: intl.formatMessage(AccountStatusMessages[EXPENSE_DIRECTION.SUBMITTED]),
            value: EXPENSE_DIRECTION.SUBMITTED,
          },
        ],
        [intl],
      );
      return <ComboSelectFilter options={options} {...props} />;
    },
    valueRenderer: ({ value, intl }) => intl.formatMessage(AccountStatusMessages[value]),
  },
  toVariables: value => {
    switch (value) {
      case EXPENSE_DIRECTION.RECEIVED:
        return { direction: true };
      case EXPENSE_DIRECTION.SUBMITTED:
        return { isActive: false };
    }
  },
};
