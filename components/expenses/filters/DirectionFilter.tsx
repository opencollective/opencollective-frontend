import React, { useMemo } from 'react';
import { defineMessage, defineMessages } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '@/lib/filters/filter-types';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export enum EXPENSE_DIRECTION {
  RECEIVED = 'RECEIVED',
  SUBMITTED = 'SUBMITTED',
}

const AccountStatusMessages = defineMessages({
  [EXPENSE_DIRECTION.RECEIVED]: { id: 'Expense.Direction.Received', defaultMessage: 'Received' },
  [EXPENSE_DIRECTION.SUBMITTED]: { id: 'Expense.Direction.Submitted', defaultMessage: 'Submitted' },
});

const schema = z.nativeEnum(EXPENSE_DIRECTION).default(EXPENSE_DIRECTION.RECEIVED);

type ExpenseDirectionFilterValue = z.infer<typeof schema>;

export const expenseDirectionFilter: FilterConfig<ExpenseDirectionFilterValue> = {
  schema,
  filter: {
    static: true,
    labelMsg: defineMessage({ id: 'DZ2Koj', defaultMessage: 'Direction' }),
    StandaloneComponent: ({ intl, value, onChange }) => {
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
      return (
        <Tabs value={value} onValueChange={onChange}>
          <TabsList className="h-9">
            {options.map(option => (
              <TabsTrigger className="h-7" key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      );
    },
    valueRenderer: ({ value, intl }) => intl.formatMessage(AccountStatusMessages[value]),
  },
};
