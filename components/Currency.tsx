import React from 'react';
import { useIntl } from 'react-intl';

import { ZERO_DECIMAL_CURRENCIES } from '../lib/constants/currency';
import { formatCurrency, getCurrencySymbol } from '../lib/currency-utils';
import type { Currency as CurrencyEnum } from '../lib/graphql/types/v2/schema';
import { cn } from '../lib/utils';

type CurrencyProps = {
  /** The amount to display, in cents */
  value: number;
  /** The currency (eg. `USD`, `EUR`...etc) */
  currency: CurrencyEnum;
  /** Format the currency value to display with separators such as 100,000 instead of 100000 */
  formatWithSeparators?: boolean;
  /** How many numbers should we display after the comma. When `auto` is given, decimals are only displayed if necessary. */
  precision?: number | 'auto';
  className?: string;
  /** Whether the amount is approximate, if true amount is prefixed by ~ */
  isApproximate?: boolean;
};

/**
 * Shows a money amount with the currency.
 *
 * ⚠️ Abbreviated mode is only for English at the moment. Abbreviated amount will not be internationalized.
 */
const Currency = ({
  value,
  currency,
  formatWithSeparators = false,
  precision = 0,
  isApproximate = false,
  className,
}: CurrencyProps) => {
  const { locale } = useIntl();
  if (precision === 'auto') {
    precision = value % 100 === 0 ? 0 : 2;
  } else if (precision < 2 && value < 100) {
    // Force precision if number is < $1 to never display $0 for small amounts
    precision = 2;
  } else if (ZERO_DECIMAL_CURRENCIES.includes(currency)) {
    precision = 0;
  }

  if (formatWithSeparators) {
    // TODO: This approach is not great because the position of the currency depends on the locale
    const floatAmount = value / 100;
    return (
      <span className={cn('whitespace-nowrap', className)}>
        {isApproximate ? `~` : ''}
        {getCurrencySymbol(currency)}
        {floatAmount.toLocaleString(locale)}
      </span>
    );
  } else {
    return (
      <span className={cn('whitespace-nowrap', className)}>
        {isApproximate ? `~` : ''}
        {formatCurrency(value, currency, { precision, locale })}
      </span>
    );
  }
};

export default Currency;
