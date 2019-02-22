import React from 'react';
import { FormattedNumber } from 'react-intl';

import { abbreviateNumber } from '../lib/utils';

import { Span } from './Text';

const Currency = ({ abbreviate = false, currency, precision = 0, value, ...styles }) => (
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
          {abbreviateNumber(value / 100, precision)}
        </Span>
      ) : (
        <Span {...styles} whiteSpace="nowrap">
          {formattedNumber}
        </Span>
      )
    }
  </FormattedNumber>
);

export default Currency;
