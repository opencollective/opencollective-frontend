import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { ArrowDownNarrowWide } from 'lucide-react';
import SelectFilter from './SelectFilter';

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
  const option = options.find(o => o.value === value) || options[0];
  console.log({ option, options });
  return (
    <SelectFilter
      inputId="expenses-order"
      onChange={value => onChange(value)}
      value={option.value}
      options={options}
      trigger={
        <div className="flex items-center gap-2 font-medium">
          <ArrowDownNarrowWide className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />

          <span className="block truncate">{option.label}</span>
        </div>
      }
    />
  );
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
