import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

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
    id: 'ExpenseForm.ReceiptLabel',
    defaultMessage: 'Reimbursement',
  },
  [ExpenseTypes.GRANT]: {
    id: 'Expense.Type.FundingRequest',
    defaultMessage: 'Grant',
  },
  [ExpenseTypes.UNCLASSIFIED]: {
    id: 'Expense.Type.Unclassified',
    defaultMessage: 'Unclassified',
  },
  [ExpenseTypes.CHARGE]: {
    id: 'Expense.Type.Charge',
    defaultMessage: 'Charge',
  },
  [ExpenseTypes.SETTLEMENT]: {
    id: 'Expense.Type.Settlement',
    defaultMessage: 'Settlement',
  },
});

const i18nStatus = defineMessages({
  ALL: {
    id: 'Expenses.AllShort',
    defaultMessage: 'All',
  },
  [expenseStatus.DRAFT]: {
    id: 'expense.draft',
    defaultMessage: 'Draft',
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
    id: 'processing',
    defaultMessage: 'Processing',
  },
  [expenseStatus.ERROR]: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  [expenseStatus.SCHEDULED_FOR_PAYMENT]: {
    id: 'expense.scheduledForPayment',
    defaultMessage: 'Scheduled for payment',
  },
  [expenseStatus.UNVERIFIED]: {
    id: 'Unverified',
    defaultMessage: 'Unverified',
  },
  READY_TO_PAY: {
    id: 'expenses.ready',
    defaultMessage: 'Ready to pay',
  },
  COMPLETED: {
    id: 'expense.completed',
    defaultMessage: 'Completed',
  },
  REFUNDED: {
    id: 'Expense.Status.Refunded',
    defaultMessage: 'Refunded',
  },
  [expenseStatus.INCOMPLETE]: {
    defaultMessage: 'Incomplete',
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

export const RecurringExpenseIntervals = {
  week: <FormattedMessage id="week" defaultMessage="Weekly" />,
  month: <FormattedMessage id="Frequency.Monthly" defaultMessage="Monthly" />,
  quarter: <FormattedMessage id="quarter" defaultMessage="Quarterly" />,
  year: <FormattedMessage id="Frequency.Yearly" defaultMessage="Yearly" />,
};

export const RecurringIntervalOptions = Object.keys(RecurringExpenseIntervals).reduce(
  (values, key) => [...values, { value: key, label: RecurringExpenseIntervals[key] }],
  [],
);
