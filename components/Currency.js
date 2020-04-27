import React from 'react';
import PropTypes from 'prop-types';

import { abbreviateNumber, formatCurrency, getCurrencySymbol } from '../lib/utils';

import { Span } from './Text';

/**
 * Shows a money amount with the currency.
 *
 * ⚠️ Abbreviated mode is only for English at the moment. Abbreviated amount will not be internationalized.
 */
const Currency = ({ abbreviate, currency, precision, value, ...styles }) => {
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
  /** How many numbers should we display after the comma */
  precision: PropTypes.number,
  /** An optional set of props passed to the `Span` */
  style: PropTypes.object,
};

Currency.defaultProps = {
  abbreviate: false,
  precision: 0,
};

export default Currency;
