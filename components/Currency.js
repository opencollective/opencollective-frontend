import React from 'react';
import PropTypes from 'prop-types';
import { FormattedNumber } from 'react-intl';

import { abbreviateNumber } from '../lib/utils';

import { Span } from './Text';

const Currency = ({ abbreviate, currency, precision, value, ...styles }) => (
  <FormattedNumber
    value={value / 100}
    currency={currency}
    style="currency"
    currencyDisplay="symbol"
    minimumFractionDigits={precision}
    maximumFractionDigits={precision}
  >
    {formattedNumber =>
      abbreviate ? (
        <Span {...styles} whiteSpace="nowrap">
          {formattedNumber.slice(0, 1)}
          {value > 0 && abbreviateNumber(value / 100, precision)}
        </Span>
      ) : (
        <Span {...styles} whiteSpace="nowrap">
          {formattedNumber}
        </Span>
      )
    }
  </FormattedNumber>
);

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
