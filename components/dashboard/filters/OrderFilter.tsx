import React from 'react';
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import { defineMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { FilterConfig } from '../../../lib/filters/filter-types';

import { Button } from '../../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../../ui/Select';

const OrderFilterSchema = z.enum(['CREATED_AT,DESC', 'CREATED_AT,ASC']).default('CREATED_AT,DESC');

type OrderFilterValue = z.infer<typeof OrderFilterSchema>;
const i18nOrderByLabel = (intl, value) => {
  const labels = {
    'CREATED_AT,DESC': intl.formatMessage({ id: 'ExpensesOrder.NewestFirst', defaultMessage: 'Newest First' }),
    'CREATED_AT,ASC': intl.formatMessage({ id: 'ExpensesOrder.OldestFirst', defaultMessage: 'Oldest First' }),
  };
  return labels[value];
};

const parseChronologicalOrderInput = str => {
  const [field, direction] = str.split(',');
  return { field, direction };
};

function toApiVariables(value, key) {
  return { [key]: parseChronologicalOrderInput(value) };
}

export const orderByFilter: FilterConfig<z.infer<typeof OrderFilterSchema>> = {
  schema: OrderFilterSchema,
  toVariables: toApiVariables,
  filter: {
    labelMsg: defineMessage({ id: 'OrderBy', defaultMessage: 'Order by' }),
    static: true,
    StandaloneComponent: OrderFilter,
    valueRenderer: ({ value, intl }) => i18nOrderByLabel(intl, value),
  },
};

function OrderFilter({ onChange, value }: { onChange: (value: OrderFilterValue) => void; value: OrderFilterValue }) {
  const intl = useIntl();
  const options = ['CREATED_AT,DESC', 'CREATED_AT,ASC'].map(value => ({
    value,
    label: i18nOrderByLabel(intl, value),
  }));
  const option = options.find(o => o.value === value) || options[0];
  const Icon = value === 'CREATED_AT,DESC' ? ArrowDownNarrowWide : ArrowDownWideNarrow;
  return (
    <Select onValueChange={value => onChange(value as OrderFilterValue)} value={value}>
      <Button size="sm" variant="outline" asChild className="w-fit rounded-full">
        <SelectTrigger>
          <div className="flex items-center gap-2 font-medium">
            <Icon className="-ml-0.5 h-5 w-5 text-slate-400" aria-hidden="true" />

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
