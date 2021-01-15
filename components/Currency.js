import React from 'react';
import PropTypes from 'prop-types';

import { formatCurrency, getCurrencySymbol } from '../lib/currency-utils';
import { abbreviateNumber } from '../lib/math';

import { Span } from './Text';

/**
 * Shows a money amount with the currency.
 *
 * ⚠️ Abbreviated mode is only for English at the moment. Abbreviated amount will not be internationalized.
 */
const Currency = ({ abbreviate, currency, precision, value, ...styles }) => {
  if (precision === 'auto') {
    precision = value % 100 === 0 ? 0 : 2;
  } else if (precision < 2 && value < 100) {
    // Force precision if number is < $1 to never display $0 for small amounts
    precision = 2;
  }

  if (abbreviate) {
    return (
      <Span {...styles} whiteSpace="nowrap">
        {getCurrencySymbol(currency)}
        {abbreviateNumber(value / 100, precision)}
      </Span>
    );
  } else {
    return (
      <Span {...styles} whiteSpace="nowrap">
        {formatCurrency(value, currency, { precision })}
      </Span>
    );
  }
};

Currency.propTypes = {
  /** The amount to display, in cents */
  value: PropTypes.number.isRequired,
  /** The currency (eg. `USD`, `EUR`...etc) */
  currency: PropTypes.string.isRequired,
  /** Abbreviate the name to display 100k instead of 100.000 */
  abbreviate: PropTypes.bool,
  /** How many numbers should we display after the comma. When `auto` is given, decimals are only displayed if necessary. */
  precision: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['auto'])]),
  /** An optional set of props passed to the `Span` */
  style: PropTypes.object,
};

Currency.defaultProps = {
  abbreviate: false,
  precision: 0,
};

export default Currency;
