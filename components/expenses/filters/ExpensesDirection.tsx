import React from 'react';
import { useIntl } from 'react-intl';

import { StyledSelectFilter } from '../../StyledSelectFilter';

export const ExpensesDirection = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const options = React.useMemo(
    () => [
      { value: 'RECEIVED', label: intl.formatMessage({ defaultMessage: 'Received' }) },
      { value: 'SUBMITTED', label: intl.formatMessage({ defaultMessage: 'Submitted' }) },
    ],
    [],
  );

  return (
    <StyledSelectFilter
      inputId="expenses-direction-filter"
      options={options}
      onChange={({ value }) => onChange(value)}
      value={options.find(option => option.value === value) || options[0]}
    />
  );
};
