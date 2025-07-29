import React from 'react';
import { isNil } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CurrencyPrecision } from '../lib/constants/currency-precision';
import INTERVALS from '../lib/constants/intervals';
import { getIntervalFromContributionFrequency } from '../lib/date-utils';
import type { Currency as GraphQLCurrency, TierFrequency } from '../lib/graphql/types/v2/schema';
import { cn } from '../lib/utils';

import Currency from './Currency';

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
  formatWithSeparators?: boolean;
  /** Classnames for the amount (eg. `$10`). Doesn't apply on interval */
  amountClassName?: string;
  /** Classnames for the currency code (eg. `USD`). Doesn't apply on interval */
  currencyCodeClassName?: string;
  /** Whether the amount is approximate, if true amount is prefixed by ~ */
  isApproximate?: boolean;
}

const DEFAULT_AMOUNT_CLASSES = '';
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
  amountClassName,
  showCurrencyCode = true,
  currencyCodeClassName,
  isApproximate,
}: FormattedMoneyAmountProps) => {
  if (!currency) {
    return <span className={cn(DEFAULT_AMOUNT_CLASSES, amountClassName)}>{EMPTY_AMOUNT_PLACEHOLDER}</span>;
  }

  const formattedAmount =
    isNaN(amount) || isNil(amount) ? (
      <span className={cn(DEFAULT_AMOUNT_CLASSES, amountClassName)}>{EMPTY_AMOUNT_PLACEHOLDER}</span>
    ) : (
      <Currency
        value={amount}
        currency={currency as GraphQLCurrency}
        precision={precision}
        formatWithSeparators={formatWithSeparators}
        className={cn(DEFAULT_AMOUNT_CLASSES, amountClassName)}
        isApproximate={isApproximate}
      />
    );

  if (frequency) {
    interval = getIntervalFromContributionFrequency(frequency);
  }

  const currencyCode = showCurrencyCode ? <span className={currencyCodeClassName}>{currency}</span> : '';
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
