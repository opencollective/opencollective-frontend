import React from 'react';

import StyledSelect from './StyledSelect';

/**
 * A superset of `StyledSelect` with custom styles, to use for selects that contains
 * filters for lists.
 */
export const StyledSelectFilter = props => {
  return (
    <StyledSelect
      minWidth={80}
      fontSize="12px"
      lineHeight="14px"
      isSearchable={false}
      styles={{
        control: {
          borderRadius: 100,
          background: '#F7F8FA',
          padding: '0 8px',
          fontWeight: 500,
        },
      }}
      {...props}
    />
  );
};
