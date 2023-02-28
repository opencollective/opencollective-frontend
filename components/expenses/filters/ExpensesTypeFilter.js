import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import expenseTypes from '../../../lib/constants/expenseTypes';
import { i18nExpenseType } from '../../../lib/i18n/expense';
import { sortSelectOptions } from '../../../lib/utils';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const ExpenseTypeFilter = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: i18nExpenseType(intl, value), value });

  const expenseTypeKeys = Object.keys(expenseTypes);
  expenseTypeKeys.unshift('ALL');
  const options = expenseTypeKeys.map(getOption);

  return (
    <StyledSelectFilter
      inputId="expenses-type-filter"
      onChange={({ value }) => onChange(value)}
      value={getOption(value || 'ALL')}
      options={options.sort(sortSelectOptions)}
      {...props}
    />
  );
};

ExpenseTypeFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default ExpenseTypeFilter;
