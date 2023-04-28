import React from 'react';
import { useIntl } from 'react-intl';

import { formatCurrency, getCurrencySymbol } from '../lib/currency-utils';
import { Currency as CurrencyEnum } from '../lib/graphql/types/v2/graphql';

import { Span, TextProps } from './Text';

type CurrencyProps = {
  /** The amount to display, in cents */
  value: number;
  /** The currency (eg. `USD`, `EUR`...etc) */
  currency: CurrencyEnum;
  /** Format the currency value to display with separators such as 100,000 instead of 100000 */
  formatWithSeparators?: boolean;
  /** How many numbers should we display after the comma. When `auto` is given, decimals are only displayed if necessary. */
  precision?: number | 'auto';
  /** An optional set of props passed to the `Span` */
  styles?: TextProps;
  'data-cy'?: string;
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
  styles = {},
  'data-cy': dataCy,
}: CurrencyProps) => {
  const { locale } = useIntl();
  if (precision === 'auto') {
    precision = value % 100 === 0 ? 0 : 2;
  } else if (precision < 2 && value < 100) {
    // Force precision if number is < $1 to never display $0 for small amounts
    precision = 2;
  }

  if (formatWithSeparators) {
    // TODO: This approach is not great because the position of the currency depends on the locale
    const floatAmount = value / 100;
    return (
      <Span whiteSpace="nowrap" {...styles} data-cy={dataCy} as={undefined}>
        {getCurrencySymbol(currency)}
        {floatAmount.toLocaleString(locale)}
      </Span>
    );
  } else {
    return (
      <Span whiteSpace="nowrap" {...styles} data-cy={dataCy} as={undefined}>
        {formatCurrency(value, currency, { precision, locale })}
      </Span>
    );
  }
};

export default Currency;
