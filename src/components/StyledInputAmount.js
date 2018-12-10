import React from 'react';
import PropTypes from 'prop-types';
import StyledInputGroup from './StyledInputGroup';
import { getCurrencySymbol } from '../lib/utils';

/**
 * An input for amount inputs. Accepts all props from [StyledInputGroup](/#!/StyledInputGroup).
 */
const StyledInputAmount = ({ currency, min = 0, ...props }) => {
  return (
    <StyledInputGroup
      name="amount"
      maxWidth="10em"
      type="number"
      step="1"
      min={min}
      prepend={getCurrencySymbol(currency)}
      {...props}
    />
  );
};

StyledInputAmount.propTypes = {
  /** The currency (eg. `USD`, `EUR`...) */
  currency: PropTypes.string.isRequired,
  /** Minimum amount */
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Accept all PropTypes from `StyledInputGroup` */
  ...StyledInputGroup.propTypes,
};

export default StyledInputAmount;
