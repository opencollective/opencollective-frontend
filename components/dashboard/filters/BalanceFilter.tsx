import { defineMessage } from 'react-intl';
import { z } from 'zod';

import { FilterConfig } from '../../../lib/filters/filter-types';

import { amountFilterSchema } from './AmountFilter/schema';
import { amountFilter } from './AmountFilter';

export const balanceFilter: FilterConfig<z.infer<typeof amountFilterSchema>> = {
  schema: amountFilterSchema,
  toVariables: (value: z.infer<typeof amountFilterSchema>) => ({
    balance: {
      gte: 'gte' in value ? { valueInCents: value.gte } : undefined,
      lte: 'lte' in value ? { valueInCents: value.lte } : undefined,
    },
  }),
  filter: {
    ...amountFilter.filter,
    labelMsg: defineMessage({ id: 'Balance', defaultMessage: 'Balance' }),
  },
};

export const consolidatedBalanceFilter: FilterConfig<z.infer<typeof amountFilterSchema>> = {
  ...balanceFilter,
  toVariables: (value: z.infer<typeof amountFilterSchema>) => ({
    consolidatedBalance: {
      gte: 'gte' in value ? { valueInCents: value.gte } : undefined,
      lte: 'lte' in value ? { valueInCents: value.lte } : undefined,
    },
  }),
  filter: {
    ...balanceFilter.filter,
    labelMsg: defineMessage({ id: 'Balance', defaultMessage: 'Balance' }),
  },
};
