import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import expenseStatus from '../../../lib/constants/expense-status';
import { i18nExpenseStatus } from '../../../lib/i18n/expense';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const IGNORED_EXPENSE_STATUS = [expenseStatus.DRAFT, expenseStatus.UNVERIFIED];

const ExpenseStatusFilter = ({ value, onChange, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: i18nExpenseStatus(intl, value), value });
  const options = [
    getOption('ALL'),
    ...Object.values(expenseStatus)
      .filter(status => !IGNORED_EXPENSE_STATUS.includes(status))
      .map(getOption),
    getOption('READY_TO_PAY'),
  ];

  return (
    <StyledSelectFilter
      data-cy="expenses-filter-status"
      options={options}
      onChange={({ value }) => onChange(value)}
      value={getOption(value || 'ALL')}
      {...props}
    />
  );
};

ExpenseStatusFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOf([...Object.values(expenseStatus), 'READY_TO_PAY']),
};

export default ExpenseStatusFilter;
