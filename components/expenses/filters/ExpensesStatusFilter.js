import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import expenseStatus from '../../../lib/constants/expense-status';
import { i18nExpenseStatus } from '../../../lib/i18n/expense';
import { sortSelectOptions } from '../../../lib/utils';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const IGNORED_EXPENSE_STATUS = [expenseStatus.DRAFT, expenseStatus.UNVERIFIED];

const getOption = (intl, value) => ({ label: i18nExpenseStatus(intl, value), value });

const getOptions = (intl, ignoredExpenseStatus) => {
  const filteredStatuses = ignoredExpenseStatus
    ? Object.values(expenseStatus).filter(s => !ignoredExpenseStatus.includes(s))
    : Object.values(expenseStatus);

  return ['ALL', ...filteredStatuses, 'READY_TO_PAY'].map(status => getOption(intl, status));
};

const ExpenseStatusFilter = ({ value, onChange, ignoredExpenseStatus = IGNORED_EXPENSE_STATUS, ...props }) => {
  const intl = useIntl();
  const sortedOptions = React.useMemo(
    () => getOptions(intl, ignoredExpenseStatus).sort(sortSelectOptions),
    [ignoredExpenseStatus],
  );

  return (
    <StyledSelectFilter
      inputId="expenses-status-filter"
      data-cy="expenses-filter-status"
      options={sortedOptions}
      onChange={({ value }) => onChange(value)}
      value={getOption(intl, value || 'ALL')}
      {...props}
    />
  );
};

ExpenseStatusFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOf([...Object.values(expenseStatus), 'READY_TO_PAY']),
  ignoredExpenseStatus: PropTypes.arrayOf(PropTypes.oneOf(Object.values(expenseStatus))),
};

export default ExpenseStatusFilter;
