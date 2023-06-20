import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

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

  return (
    <SelectFilter
      inputId="expenses-order"
      onChange={({ value }) => onChange(value)}
      value={options.find(o => o.value === value)}
      options={options}
      defaultValue={options[0]}
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
