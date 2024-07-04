import React from 'react';
import { isNil } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CurrencyPrecision } from '../lib/constants/currency-precision';
import INTERVALS from '../lib/constants/intervals';
import { getIntervalFromContributionFrequency } from '../lib/date-utils';
import type { Currency as GraphQLCurrency, TierFrequency } from '../lib/graphql/types/v2/graphql';

import Currency from './Currency';
import type { TextProps } from './Text';
import { Span } from './Text';

/** Default styles for the amount (not including currency) */
export const DEFAULT_AMOUNT_STYLES: Omit<TextProps, 'color'> & {
  color?: string;
} = {
  letterSpacing: 0,
  fontWeight: 'bold',
  color: 'black.900',
};

const EMPTY_AMOUNT_PLACEHOLDER = '--.--';

interface FormattedMoneyAmountProps {
  /** The amount to display, in cents */
  amount?: number;
  /** The currency (eg. `USD`, `EUR`...etc) */
  currency?: GraphQLCurrency | string;
  /** Abbreviate the interval (eg. year => yr.) */
  abbreviateInterval?: boolean;
  /** Whether to show the full currency code (ie. USD) */
  showCurrencyCode?: boolean;
  /** How many numbers should we display after the comma */
  precision?: number | 'auto';
  /** An interval that goes with the amount */
  interval?: (typeof INTERVALS)[keyof typeof INTERVALS];
  /** ContributionFrequency from GQLV2 */
  frequency?: TierFrequency;
  /** Style for the amount (eg. `$10`). Doesn't apply on interval */
  amountStyles?: object;
  currencyCodeStyles?: object;
  formatWithSeparators?: boolean;
}

/**
 * A practical component to format amounts and their intervals with proper
 * internationalization support.
 */
const FormattedMoneyAmount = ({
  formatWithSeparators,
  abbreviateInterval = false,
  currency,
  precision = CurrencyPrecision.DEFAULT,
  amount,
  interval,
  frequency,
  amountStyles = DEFAULT_AMOUNT_STYLES,
  showCurrencyCode = true,
  currencyCodeStyles,
}: FormattedMoneyAmountProps) => {
  if (!currency) {
    return <Span {...amountStyles}>{EMPTY_AMOUNT_PLACEHOLDER}</Span>;
  }

  const formattedAmount =
    isNaN(amount) || isNil(amount) ? (
      <Span {...amountStyles}>{EMPTY_AMOUNT_PLACEHOLDER}</Span>
    ) : (
      <Currency
        value={amount}
        currency={currency as GraphQLCurrency}
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
    return showCurrencyCode ? (
      <FormattedMessage
        id="Amount"
        defaultMessage="{amount} {currencyCode}"
        values={{ amount: formattedAmount, currencyCode }}
      />
    ) : (
      formattedAmount
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

export default FormattedMoneyAmount;
