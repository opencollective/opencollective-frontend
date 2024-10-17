import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const ExpensesOrder = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const options = [
    {
      label: intl.formatMessage({ id: 'ExpensesOrder.NewestFirst', defaultMessage: 'Newest First' }),
      value: 'CREATED_AT,DESC',
    },
    {
      label: intl.formatMessage({ id: 'ExpensesOrder.OldestFirst', defaultMessage: 'Oldest First' }),
      value: 'CREATED_AT,ASC',
    },
  ];

  return (
    <StyledSelectFilter
      inputId="expenses-order"
      onChange={({ value }) => onChange(value)}
      value={options.find(o => o.value === value) || options[0]}
      options={options}
      {...props}
    />
  );
};

ExpensesOrder.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export const parseChronologicalOrderInput = str => {
  const [field, direction] = str.split(',');
  return { field, direction };
};

export default ExpensesOrder;
