import React from 'react';
import PropTypes from 'prop-types';
import { clamp } from 'lodash';

import StyledInputGroup from './StyledInputGroup';
import { getCurrencySymbol } from '../lib/utils';

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
      step="1"
      min={min}
      max={max}
      value={value === undefined ? undefined : clamp(value, min, max)}
      prepend={getCurrencySymbol(currency)}
      onChange={e => {
        e.target.value = clamp(e.target.value, min, max);
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
