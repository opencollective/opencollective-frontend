import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { BarsArrowUpIcon } from '@heroicons/react/20/solid';

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
  return (
    <SelectFilter
      inputId="expenses-order"
      onChange={({ value }) => onChange(value)}
      value={option}
      options={options}
      trigger={
        <React.Fragment>
          <BarsArrowUpIcon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />

          <span className="block truncate">{option.label}</span>
        </React.Fragment>
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
