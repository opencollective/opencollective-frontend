import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { ArrowDownNarrowWide } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
const OrderFilter = ({ onChange, options, value, ...props }) => {
  const intl = useIntl();

  options = options ?? [
    {
      label: intl.formatMessage({ id: 'ExpensesOrder.NewestFirst', defaultMessage: 'Newest first' }),
      value: 'CREATED_AT,DESC',
    },
    {
      label: intl.formatMessage({ id: 'ExpensesOrder.OldestFirst', defaultMessage: 'Oldest first' }),
      value: 'CREATED_AT,ASC',
    },
  ];
  // const option = options.find(o => o.value === value) || options[0];

  return (
    <Select onValueChange={onChange} defaultValue={value}>
      <SelectTrigger className="w-[180px]">
        <ArrowDownNarrowWide className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
        <SelectValue placeholder="Order by" />
      </SelectTrigger>
      <SelectContent>
        {options.map(({ label, value }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  // return (
  //   <SelectFilter
  //     inputId="expenses-order"
  //     onChange={({ value }) => onChange(value)}
  //     value={option}
  //     options={options}
  //     trigger={
  //       <React.Fragment>
  //         <span className="block truncate">{option.label}</span>
  //       </React.Fragment>
  //     }
  //   />
  // );
};

OrderFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export const parseChronologicalOrderInput = str => {
  const [field, direction] = str.split(',');
  return { field, direction };
};

export default OrderFilter;
