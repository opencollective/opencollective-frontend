import React from 'react';
import PropTypes from 'prop-types';

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

StyledSelectFilter.propTypes = {
  /** The id of the search input */
  inputId: PropTypes.string.isRequired,
  /** Define an id prefix for the select components e.g. {your-id}-value */
  instanceId: PropTypes.string,
};
