import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Currency from './Currency';

/** Default styles for the amount (not including currency) */
export const DEFAULT_AMOUNT_STYLES = { letterSpacing: 0, fontWeight: 'bold', color: 'black.900' };

/**
 * A practical component to format amounts and their intervals with proper
 * internationalization support.
 */
const FormattedMoneyAmount = ({
  abbreviateAmount,
  abbreviateInterval,
  currency,
  precision,
  amount,
  interval,
  amountStyles,
  showCurrencyCode,
}) => {
  const formattedAmount = (
    <Currency
      value={amount}
      currency={currency}
      precision={precision}
      abbreviate={abbreviateAmount}
      {...amountStyles}
    />
  );

  const currencyCode = showCurrencyCode ? currency : '';
  if (!interval) {
    return (
      <FormattedMessage
        id="Amount"
        defaultMessage="{amount} {currencyCode}"
        values={{ amount: formattedAmount, currencyCode }}
      />
    );
  } else if (abbreviateInterval) {
    return (
      <FormattedMessage
        id="AmountInterval"
        defaultMessage="{amount} {currencyCode} / {interval, select, month {mo.} year {yr.}}"
        values={{ amount: formattedAmount, interval: interval, currencyCode }}
      />
    );
  } else {
    return (
      <FormattedMessage
        id="AmountIntervalLong"
        defaultMessage="{amount} {currencyCode} / {interval, select, month {month} year {year}}"
        values={{ amount: formattedAmount, interval: interval, currencyCode }}
      />
    );
  }
};

FormattedMoneyAmount.propTypes = {
  /** The amount to display, in cents */
  amount: PropTypes.number.isRequired,
  /** The currency (eg. `USD`, `EUR`...etc) */
  currency: PropTypes.string.isRequired,
  /** Abbreviate the name to display 100k instead of 100.000 */
  abbreviateAmount: PropTypes.bool,
  /** Abbreviate the interval (eg. year => yr.) */
  abbreviateInterval: PropTypes.bool,
  /** Whether to show the full currency code (ie. USD) */
  showCurrencyCode: PropTypes.bool,
  /** How many numbers should we display after the comma */
  precision: PropTypes.number,
  /** An interval that goes with the amount */
  interval: PropTypes.oneOf(['month', 'year']),
  /** Style for the amount (eg. `$10`). Doesn't apply on interval */
  amountStyles: PropTypes.object,
};

FormattedMoneyAmount.defaultProps = {
  abbreviate: false,
  abbreviateInterval: false,
  precision: 0,
  amountStyles: DEFAULT_AMOUNT_STYLES,
  showCurrencyCode: true,
};

export default FormattedMoneyAmount;
