import { defineMessage, MessageDescriptor } from 'react-intl';
import { z } from 'zod';

import { FilterConfig } from '../../../lib/filters/filter-types';

import { buildOrderByFilterComponent } from './OrderFilter';

const parseChronologicalOrderInput = str => {
  const [field, direction] = str.split(',');
  return { field, direction };
};

export const accountOrderByFilter = buildAccountOrderBy(
  z
    .enum(['CREATED_AT,DESC', 'CREATED_AT,ASC', 'BALANCE,DESC', 'BALANCE,ASC', 'NAME,ASC', 'NAME,DESC'])
    .default('CREATED_AT,DESC'),
  {
    'CREATED_AT,DESC': defineMessage({
      id: 'HostedAccountsOrder.NewestFirst',
      defaultMessage: 'Newly Hosted',
    }),
    'CREATED_AT,ASC': defineMessage({
      id: 'HostedAccountsOrder.OldestFirst',
      defaultMessage: 'Oldest Hosted',
    }),
    'BALANCE,DESC': defineMessage({
      id: 'HostedAccountsOrder.HighestBalance',
      defaultMessage: 'Highest Balance',
    }),
    'BALANCE,ASC': defineMessage({
      id: 'HostedAccountsOrder.LowestBalance',
      defaultMessage: 'Lowest Balance',
    }),
    'NAME,DESC': defineMessage({
      id: 'HostedAccountsOrder.NameDesc',
      defaultMessage: 'Z to A',
    }),
    'NAME,ASC': defineMessage({
      id: 'HostedAccountsOrder.NameAsc',
      defaultMessage: 'A to Z',
    }),
  },
);

type OrderFilterKey = `${string},DESC` | `${string},ASC`;
function buildAccountOrderBy<T extends [OrderFilterKey, ...OrderFilterKey[]]>(
  schema: z.ZodDefault<z.ZodEnum<T>>,
  i18nLabels: Record<z.infer<z.ZodEnum<T>>, MessageDescriptor>,
): FilterConfig<z.infer<z.ZodEnum<T>>> {
  return {
    schema,
    toVariables: (value, key) => ({ [key]: parseChronologicalOrderInput(value) }),
    filter: {
      labelMsg: defineMessage({ id: 'OrderBy', defaultMessage: 'Order by' }),
      static: true,
      StandaloneComponent: buildOrderByFilterComponent(schema, i18nLabels),
      valueRenderer: ({ value, intl }) => intl.formatMessage(i18nLabels[value]),
    },
  };
}
