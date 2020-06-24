import React from 'react';

import StyledSelect from '../../StyledSelect';

export const ExpensesFilter = props => {
  return (
    <StyledSelect
      minWidth={80}
      fontSize="12px"
      lineHeight="14px"
      controlStyles={{
        borderRadius: 100,
        background: '#F7F8FA',
        padding: '0 8px',
        fontWeight: 500,
      }}
      {...props}
    />
  );
};
