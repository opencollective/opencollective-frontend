import React from 'react';
import PropTypes from 'prop-types';
import { clamp, round } from 'lodash';

import StyledInputGroup from './StyledInputGroup';

const StyledInputPercentage = ({ value, onChange, onBlur = null, ...props }) => {
  return (
    <StyledInputGroup
      append="%"
      type="number"
      min="0"
      max="100"
      appendProps={{ color: 'black.600' }}
      fontWeight="normal"
      maxWidth={100}
      step="0.01"
      {...props}
      value={isNaN(value) ? '' : value}
      onChange={e => onChange(parseFloat(e.target.value))}
      onWheel={e => {
        // Prevent changing the value when scrolling on the input
        e.preventDefault();
        e.target.blur();
      }}
      onBlur={e => {
        const newValue = clamp(round(parseFloat(e.target.value), 2), 0, 100);
        onChange(isNaN(newValue) ? value : newValue);
        if (onBlur) {
          onBlur(e);
        }
      }}
    />
  );
};

StyledInputPercentage.propTypes = {
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  value: PropTypes.number,
};

export default StyledInputPercentage;
