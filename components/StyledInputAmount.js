import React from 'react';
import PropTypes from 'prop-types';
import { isUndefined } from 'lodash';

import { getCurrencySymbol } from '../lib/currency-utils';
import { floatAmountToCents } from '../lib/math';

import StyledInputGroup from './StyledInputGroup';

const getPrepend = (currency, currencyDisplay) => {
  if (currencyDisplay === 'SYMBOL') {
    return getCurrencySymbol(currency);
  } else if (currencyDisplay === 'CODE') {
    return currency;
  } else {
    return `${getCurrencySymbol(currency)} ${currency}`;
  }
};

const parseValueFromEvent = (e, precision, ignoreComma) => {
  if (e.target.value === '') {
    return null;
  } else {
    const parsedNumber = parseFloat(ignoreComma ? e.target.value.replace(',', '') : e.target.value);
    return isNaN(parsedNumber) ? NaN : parsedNumber.toFixed(precision);
  }
};

/** Formats value is valid, fallsback on rawValue otherwise */
const getValue = (value, rawValue, isEmpty) => {
  if (isEmpty) {
    return '';
  }

  return isNaN(value) || value === null ? rawValue : value / 100;
};

/**
 * An input for amount inputs. Accepts all props from [StyledInputGroup](/#!/StyledInputGroup).
 */
const StyledInputAmount = ({
  currency,
  currencyDisplay,
  min,
  max,
  precision,
  defaultValue,
  value,
  onBlur,
  onChange,
  isEmpty,
  ...props
}) => {
  const [rawValue, setRawValue] = React.useState(value || defaultValue || '');
  const isControlled = !isUndefined(value);
  const dispatchValue = (e, parsedValue) => {
    if (isControlled) {
      setRawValue(e.target.value);
    }
    if (onChange) {
      const valueWithIgnoredComma = parseValueFromEvent(e, precision, true);
      if (parsedValue === null || isNaN(parsedValue)) {
        onChange(parsedValue, e);
      } else if (!e.target.checkValidity() || parsedValue !== valueWithIgnoredComma) {
        onChange(e.target.value ? NaN : null, e);
      } else {
        onChange(floatAmountToCents(parsedValue), e);
      }
    }
  };

  return (
    <StyledInputGroup
      maxWidth="10em"
      step="0.01"
      {...props}
      min={isUndefined(min) ? min : min / 100}
      max={isUndefined(max) ? max : max / 100}
      prepend={getPrepend(currency, currencyDisplay)}
      type="number"
      inputMode="decimal"
      defaultValue={isUndefined(defaultValue) ? undefined : defaultValue / 100}
      value={isControlled ? getValue(value, rawValue, isEmpty) : undefined}
      onWheel={e => {
        e.preventDefault();
        e.target.blur();
      }}
      onChange={e => {
        e.stopPropagation();
        dispatchValue(e, parseValueFromEvent(e, precision));
      }}
      onBlur={e => {
        // Clean number if valid (ie. 41.1 -> 41.10)
        const parsedNumber = parseValueFromEvent(e, precision);
        const valueWithIgnoredComma = parseValueFromEvent(e, precision, true);
        if (
          e.target.checkValidity() &&
          !isNaN(parsedNumber) &&
          parsedNumber !== null &&
          valueWithIgnoredComma === parsedNumber
        ) {
          e.target.value = parsedNumber.toString();
          dispatchValue(e, parsedNumber);
        }

        if (onBlur) {
          onBlur(e);
        }
      }}
    />
  );
};

StyledInputAmount.propTypes = {
  /** The currency (eg. `USD`, `EUR`...) */
  currency: PropTypes.string.isRequired,
  /** OnChange function. Gets passed the amount in cents as first param, and the event as second param. */
  onChange: PropTypes.func,
  /** OnChange function */
  onBlur: PropTypes.func,
  /** Minimum amount (in CENTS) */
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Maximum amount (in CENTS) */
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  /** Value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Currency style */
  currencyDisplay: PropTypes.oneOf(['SYMBOL', 'CODE', 'FULL']),
  /** Number of decimals */
  precision: PropTypes.number,
  /** A special prop to force the empty state */
  isEmpty: PropTypes.bool,
  /** Accept all PropTypes from `StyledInputGroup` */
  ...StyledInputGroup.propTypes,
};

StyledInputAmount.defaultProps = {
  min: 0,
  max: 1000000000,
  precision: 2,
  currencyDisplay: 'SYMBOL',
  name: 'amount',
};

export default StyledInputAmount;
