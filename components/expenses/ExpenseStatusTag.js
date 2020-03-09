import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import expenseStatus from '../../lib/constants/expense-status';
import { i18nExpenseStatus } from '../../lib/i18n-expense';
import StyledTag from '../StyledTag';

const getExpenseStatusMsgType = status => {
  switch (status) {
    case expenseStatus.REJECTED:
      return 'error';
    case expenseStatus.PENDING:
      return 'warning';
    case expenseStatus.APPROVED:
      return 'info';
    case expenseStatus.PAID:
      return 'success';
  }
};

/**
 * Displays an i18n version of the expense status in a `StyledTag`.
 * The color change in function of the status.
 *
 * Accepts all the props exposed by `StyledTag`.
 */
const ExpenseStatusTag = ({ status, ...props }) => {
  const intl = useIntl();
  return (
    <StyledTag type={getExpenseStatusMsgType(status)} {...props}>
      {i18nExpenseStatus(intl, status)}
    </StyledTag>
  );
};

ExpenseStatusTag.propTypes = {
  status: PropTypes.oneOf(Object.values(expenseStatus)),
};

export default ExpenseStatusTag;
