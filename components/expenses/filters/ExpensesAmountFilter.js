import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';

import { ExpensesFilter } from './ExpensesFilter';

const OPTION_LABELS = defineMessages({
  ALL: {
    id: 'Expenses.AllShort',
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

export const parseAmountRange = strValue => {
  if (!strValue) {
    return [];
  } else if (strValue.endsWith('+')) {
    return [parseInt(strValue.slice(0, -1))];
  } else {
    const [minStr, maxStr] = strValue.split('-');
    return [parseInt(minStr), parseInt(maxStr)];
  }
};

const ExpensesAmountFilter = ({ currency, onChange, value, ...props }) => {
  const intl = useIntl();
  const allExpensesOption = { label: intl.formatMessage(OPTION_LABELS.ALL), value: 'ALL' };
  const getOption = (minAmount, maxAmount) => {
    return {
      value: maxAmount ? `${minAmount}-${maxAmount}` : `${minAmount}+`,
      label: intl.formatMessage(OPTION_LABELS[maxAmount ? 'rangeFromTo' : 'rangeFrom'], {
        minAmount: formatCurrency(minAmount * 100, currency, { precision: 0 }),
        maxAmount: formatCurrency(maxAmount * 100, currency, { precision: 0 }),
      }),
    };
  };

  return (
    <ExpensesFilter
      isSearchable={false}
      value={value ? getOption(...parseAmountRange(value)) : allExpensesOption}
      onChange={({ value }) => onChange(value)}
      options={[allExpensesOption, getOption(0, 50), getOption(50, 500), getOption(500, 5000), getOption(5000)]}
      {...props}
    />
  );
};

ExpensesAmountFilter.propTypes = {
  currency: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default ExpensesAmountFilter;
