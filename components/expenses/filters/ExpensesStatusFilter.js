import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import expenseStatus from '../../../lib/constants/expense-status';
import { i18nExpenseStatus } from '../../../lib/i18n/expense';
import { sortSelectOptions } from '../../../lib/utils';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const IGNORED_EXPENSE_STATUS = [expenseStatus.UNVERIFIED];

const getOption = (intl, value) => ({ label: i18nExpenseStatus(intl, value), value });

const getOptions = (intl, ignoredExpenseStatus = []) => {
  return ['ALL', ...Object.values(expenseStatus), 'READY_TO_PAY', 'ON_HOLD']
    .filter(s => !ignoredExpenseStatus.includes(s))
    .map(status => getOption(intl, status));
};

const ExpenseStatusFilter = ({
  value,
  onChange,
  ignoredExpenseStatus = IGNORED_EXPENSE_STATUS,
  displayOnHoldPseudoStatus = false,
  ...props
}) => {
  const intl = useIntl();
  ignoredExpenseStatus = ignoredExpenseStatus || [];

  if (!displayOnHoldPseudoStatus) {
    ignoredExpenseStatus.push('ON_HOLD');
  }
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
  value: PropTypes.oneOf([...Object.values(expenseStatus), 'ALL', 'READY_TO_PAY']),
  ignoredExpenseStatus: PropTypes.arrayOf(PropTypes.oneOf(Object.values(expenseStatus))),
  displayOnHoldPseudoStatus: PropTypes.bool,
};

export default ExpenseStatusFilter;
