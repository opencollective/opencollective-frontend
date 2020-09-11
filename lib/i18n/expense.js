import { defineMessages } from 'react-intl';

import expenseStatus from '../constants/expense-status';
import ExpenseTypes from '../constants/expenseTypes';

const i18nTypes = defineMessages({
  ALL: {
    id: 'AllExpenses',
    defaultMessage: 'All expenses',
  },
  [ExpenseTypes.INVOICE]: {
    id: 'Expense.Type.Invoice',
    defaultMessage: 'Invoice',
  },
  [ExpenseTypes.RECEIPT]: {
    id: 'Expense.Type.Receipt',
    defaultMessage: 'Receipt',
  },
  [ExpenseTypes.FUNDING_REQUEST]: {
    id: 'Expense.Type.FundingRequest',
    defaultMessage: 'Grant',
  },
  [ExpenseTypes.UNCLASSIFIED]: {
    id: 'Expense.Type.Unclassified',
    defaultMessage: 'Unclassified',
  },
});

const i18nStatus = defineMessages({
  ALL: {
    id: 'Expenses.AllShort',
    defaultMessage: 'All',
  },
  [expenseStatus.PENDING]: {
    id: 'expense.pending',
    defaultMessage: 'Pending',
  },
  [expenseStatus.APPROVED]: {
    id: 'expense.approved',
    defaultMessage: 'Approved',
  },
  [expenseStatus.REJECTED]: {
    id: 'expense.rejected',
    defaultMessage: 'Rejected',
  },
  [expenseStatus.PAID]: {
    id: 'expense.paid',
    defaultMessage: 'Paid',
  },
  [expenseStatus.PROCESSING]: {
    id: 'expense.processing',
    defaultMessage: 'Processing',
  },
  [expenseStatus.ERROR]: {
    id: 'expense.error',
    defaultMessage: 'Error',
  },
  [expenseStatus.SCHEDULED_FOR_PAYMENT]: {
    id: 'expense.scheduledForPayment',
    defaultMessage: 'Scheduled for payment',
  },
  READY_TO_PAY: {
    id: 'expenses.ready',
    defaultMessage: 'Ready to pay',
  },
});

/**
 * Translate the type of an expense
 */
export const i18nExpenseType = (intl, type, id) => {
  let formattedType = i18nTypes[type] ? intl.formatMessage(i18nTypes[type]) : type;
  if (id) {
    formattedType = `${formattedType} #${id}`;
  }
  return formattedType;
};

/**
 * Translate the status of an expense
 */
export const i18nExpenseStatus = (intl, status) => {
  return i18nStatus[status] ? intl.formatMessage(i18nStatus[status]) : status;
};
