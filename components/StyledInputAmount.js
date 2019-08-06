import React from 'react';
import PropTypes from 'prop-types';
import { clamp, isNil } from 'lodash';

import StyledInputGroup from './StyledInputGroup';

/**
 * An input for amount inputs. Accepts all props from [StyledInputGroup](/#!/StyledInputGroup).
 * The value returned by this component is always limited by `min` and `max`.
 */
const StyledInputAmount = ({ currency, min, max, value, onChange, ...props }) => {
  return (
    <StyledInputGroup
      name="amount"
      maxWidth="10em"
      type="number"
      step="0.01"
      min={min}
      max={max}
      value={isNil(value) || value === '' ? '' : clamp(value, !min ? 0 : 1, max)}
      prepend={currency}
      onChange={e => {
        // We don't cap on min because we want the user to be able to erase the input
        // and to progressively type the number without forcing a value.
        if (e.target.value !== '' && !isNil(e.target.value)) {
          e.target.value = clamp(e.target.value, !min ? 0 : 1, max);
        }

        onChange(e);
      }}
      {...props}
    />
  );
};

StyledInputAmount.propTypes = {
  /** The currency (eg. `USD`, `EUR`...) */
  currency: PropTypes.string.isRequired,
  /** OnChange function */
  onChange: PropTypes.func.isRequired,
  /** Minimum amount */
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Maximum amount */
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Accept all PropTypes from `StyledInputGroup` */
  ...StyledInputGroup.propTypes,
};

StyledInputAmount.defaultProps = {
  min: 0,
  max: 1000000000,
};

export default StyledInputAmount;
