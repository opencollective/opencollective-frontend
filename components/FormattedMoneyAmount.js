import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CurrencyPrecision } from '../lib/constants/currency-precision';
import INTERVALS from '../lib/constants/intervals';
import { getIntervalFromContributionFrequency } from '../lib/date-utils';

import Currency from './Currency';
import { Span } from './Text';

/** Default styles for the amount (not including currency) */
export const DEFAULT_AMOUNT_STYLES = { letterSpacing: 0, fontWeight: 'bold', color: 'black.900' };

const EMPTY_AMOUNT_PLACEHOLDER = '--.--';

/**
 * A practical component to format amounts and their intervals with proper
 * internationalization support.
 */
const FormattedMoneyAmount = ({
  formatWithSeparators,
  abbreviateInterval,
  currency,
  precision,
  amount,
  interval,
  frequency,
  amountStyles,
  showCurrencyCode,
  currencyCodeStyles,
}) => {
  if (!currency) {
    return <Span {...amountStyles}>{EMPTY_AMOUNT_PLACEHOLDER}</Span>;
  }

  const formattedAmount =
    isNaN(amount) || isNil(amount) ? (
      <Span {...amountStyles}>{EMPTY_AMOUNT_PLACEHOLDER}</Span>
    ) : (
      <Currency
        value={amount}
        currency={currency}
        precision={precision}
        formatWithSeparators={formatWithSeparators}
        {...amountStyles}
      />
    );

  if (frequency) {
    interval = getIntervalFromContributionFrequency(frequency);
  }

  const currencyCode = showCurrencyCode ? <Span {...currencyCodeStyles}>{currency}</Span> : '';
  if (!interval || interval === INTERVALS.flexible || interval === INTERVALS.oneTime) {
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
        defaultMessage="{amount} {currencyCode} / {interval, select, month {mo.} year {yr.} other{}}"
        values={{ amount: formattedAmount, interval, currencyCode }}
      />
    );
  } else {
    return (
      <FormattedMessage
        id="AmountIntervalLong"
        defaultMessage="{amount} {currencyCode} / {interval, select, month {month} year {year} other {}}"
        values={{ amount: formattedAmount, interval, currencyCode }}
      />
    );
  }
};

FormattedMoneyAmount.propTypes = {
  /** The amount to display, in cents */
  amount: PropTypes.number,
  /** The currency (eg. `USD`, `EUR`...etc) */
  currency: PropTypes.string,
  /** Abbreviate the interval (eg. year => yr.) */
  abbreviateInterval: PropTypes.bool,
  /** Whether to show the full currency code (ie. USD) */
  showCurrencyCode: PropTypes.bool,
  /** How many numbers should we display after the comma */
  precision: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['auto'])]),
  /** An interval that goes with the amount */
  interval: PropTypes.oneOf(['month', 'year', 'oneTime']),
  /** ContributionFrequency from GQLV2 */
  frequency: PropTypes.oneOf(['MONTHLY', 'YEARLY', 'ONETIME']),
  /** Style for the amount (eg. `$10`). Doesn't apply on interval */
  amountStyles: PropTypes.object,
  currencyCodeStyles: PropTypes.object,
  formatWithSeparators: PropTypes.bool,
};

FormattedMoneyAmount.defaultProps = {
  abbreviate: false,
  abbreviateInterval: false,
  precision: CurrencyPrecision.DEFAULT,
  amountStyles: DEFAULT_AMOUNT_STYLES,
  showCurrencyCode: true,
};

export default FormattedMoneyAmount;
