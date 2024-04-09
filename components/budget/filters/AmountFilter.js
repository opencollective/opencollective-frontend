import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';

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

const getOption = (intl, currency, minAmount, maxAmount) => {
  const { locale } = intl;
  return {
    value: maxAmount ? `${minAmount}-${maxAmount}` : `${minAmount}+`,
    label: intl.formatMessage(OPTION_LABELS[maxAmount ? 'rangeFromTo' : 'rangeFrom'], {
      minAmount: formatCurrency(minAmount * 100, currency, { precision: 0, locale }),
      maxAmount: formatCurrency(maxAmount * 100, currency, { precision: 0, locale }),
    }),
  };
};

const AmountFilter = ({ currency, onChange, value, steps, ...props }) => {
  const intl = useIntl();
  const allExpensesOption = React.useMemo(
    () => ({ label: intl.formatMessage(OPTION_LABELS.ALL), value: 'ALL' }),
    [intl],
  );
  const options = React.useMemo(() => {
    return [allExpensesOption, ...steps.map((step, idx) => getOption(intl, currency, step, steps[idx + 1]))];
  }, [steps, currency, intl, allExpensesOption]);

  return (
    <StyledSelectFilter
      inputId="expenses-amount-filter"
      data-cy="expenses-filter-amount"
      value={value ? getOption(intl, currency, ...parseAmountRange(value)) : allExpensesOption}
      onChange={({ value }) => onChange(value)}
      options={options}
      {...props}
    />
  );
};

AmountFilter.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.number).isRequired,
  currency: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

AmountFilter.defaultProps = {
  steps: [0, 50, 500, 5000],
};

export default AmountFilter;
