import React from 'react';
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import type { MessageDescriptor } from 'react-intl';
import { defineMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentProps, FilterConfig } from '../../../lib/filters/filter-types';

import { Button } from '../../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../../ui/Select';

const parseChronologicalOrderInput = str => {
  const [field, direction] = str.split(',');
  return { field, direction };
};

export const orderByFilter = buildOrderByFilter(
  z.enum(['CREATED_AT,DESC', 'CREATED_AT,ASC']).default('CREATED_AT,DESC'),
  {
    'CREATED_AT,DESC': defineMessage({ id: 'ExpensesOrder.NewestFirst', defaultMessage: 'Newest First' }),
    'CREATED_AT,ASC': defineMessage({ id: 'ExpensesOrder.OldestFirst', defaultMessage: 'Oldest First' }),
  },
);

type OrderFilterKey = `${string},DESC` | `${string},ASC`;
export function buildOrderByFilter<T extends [OrderFilterKey, ...OrderFilterKey[]]>(
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

function buildOrderByFilterComponent<T extends [string, ...string[]]>(
  schema: z.ZodDefault<z.ZodEnum<T>>,
  i18nLabels: Record<z.infer<z.ZodEnum<T>>, MessageDescriptor>,
): React.FunctionComponent<FilterComponentProps<z.infer<z.ZodEnum<T>>>> {
  return function OrderFilter({ onChange, value }) {
    const intl = useIntl();
    const options = schema.removeDefault().options.map(value => ({
      value,
      label: intl.formatMessage(i18nLabels[value]),
    }));
    const option = options.find(o => o.value === value) || options[0];
    const Icon = value.endsWith(',DESC') ? ArrowDownNarrowWide : ArrowDownWideNarrow;
    return (
      <Select onValueChange={value => onChange(value)} value={value}>
        <Button size="sm" variant="outline" asChild className="max-w-fit rounded-full">
          <SelectTrigger>
            <div className="flex items-center gap-2 overflow-hidden font-medium">
              <Icon className="-ml-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="block truncate">{option.label}</span>
            </div>
          </SelectTrigger>
        </Button>

        <SelectContent>
          {options.map(option => (
            <SelectItem value={option.value} key={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };
}

// function OrderFilter({ onChange, value }) {
//   const intl = useIntl();
//   const options = ['CREATED_AT,DESC', 'CREATED_AT,ASC'].map(value => ({
//     value,
//     label: i18nOrderByLabel(intl, value),
//   }));
//   const option = options.find(o => o.value === value) || options[0];
//   return (
//     <Select onValueChange={value => onChange(value)} value={value}>
//       <SelectTrigger className="h-9 max-w-[160px] rounded-full">
//         <Button size="sm" variant="outline">

//         <div className="flex items-center gap-2 font-medium">
//           <ArrowDownNarrowWide className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />

//           <span className="block truncate">{option.label}</span>
//         </div>
//         </Button>
//       </SelectTrigger>
//       <SelectContent>
//         {options.map(option => (
//           <SelectItem value={option.value} key={option.value}>
//             {option.label}
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );
// }
