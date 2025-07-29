import React from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages, useIntl } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';
import type { Currency } from '../../../lib/graphql/types/v2/schema';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const OPTION_LABELS = defineMessages({
  ALL: {
    id: 'Amount.AllShort',
    defaultMessage: 'All',
  },
  rangeFrom: {
    id: 'Amount.RangeFrom',
    defaultMessage: '{minAmount} and above',
  },
  rangeFromTo: {
    id: 'Amount.RangeFromTo',
    defaultMessage: '{minAmount} to {maxAmount}',
  },
});

export const parseAmountRange = (strValue: string): [] | [number] | [number, number] => {
  if (!strValue) {
    return [];
  } else if (strValue.endsWith('+')) {
    return [parseInt(strValue.slice(0, -1))];
  } else {
    const [minStr, maxStr] = strValue.split('-');
    return [parseInt(minStr), parseInt(maxStr)];
  }
};

const getOption = (
  intl: IntlShape,
  currency: Currency,
  minAmount: number = undefined,
  maxAmount: number = undefined,
) => {
  const { locale } = intl;
  return {
    value: maxAmount ? `${minAmount}-${maxAmount}` : `${minAmount}+`,
    label: intl.formatMessage(OPTION_LABELS[maxAmount ? 'rangeFromTo' : 'rangeFrom'], {
      minAmount: formatCurrency(minAmount * 100, currency, { precision: 0, locale }),
      maxAmount: formatCurrency(maxAmount * 100, currency, { precision: 0, locale }),
    }),
  };
};

interface AmountFilterProps {
  steps: number[];
  currency?: Currency;
  onChange: (...args: unknown[]) => unknown;
  value?: string;
}

const AmountFilter = ({ currency, onChange, value, steps = [0, 50, 500, 5000], ...props }: AmountFilterProps) => {
  const intl = useIntl();
  const allExpensesOption = { label: intl.formatMessage(OPTION_LABELS.ALL), value: 'ALL' };
  const options = React.useMemo(() => {
    return [allExpensesOption, ...steps.map((step, idx) => getOption(intl, currency, step, steps[idx + 1]))];
  }, [steps]);
  const [min, max] = parseAmountRange(value);

  return (
    <StyledSelectFilter
      inputId="expenses-amount-filter"
      data-cy="expenses-filter-amount"
      value={value ? getOption(intl, currency, min, max) : allExpensesOption}
      onChange={({ value }) => onChange(value)}
      options={options}
      {...props}
    />
  );
};

export default AmountFilter;
