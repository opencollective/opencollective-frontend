import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import ExpenseTypes from '../constants/expenseTypes';
import { ExpenseStatus } from '../graphql/types/v2/graphql';

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
    defaultMessage: 'Virtual Card Charge',
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
  [ExpenseStatus.DRAFT]: {
    id: 'expense.draft',
    defaultMessage: 'Draft',
  },
  [ExpenseStatus.PENDING]: {
    id: 'expense.pending',
    defaultMessage: 'Pending',
  },
  [ExpenseStatus.APPROVED]: {
    id: 'expense.approved',
    defaultMessage: 'Approved',
  },
  [ExpenseStatus.REJECTED]: {
    id: 'expense.rejected',
    defaultMessage: 'Rejected',
  },
  [ExpenseStatus.PAID]: {
    id: 'expense.paid',
    defaultMessage: 'Paid',
  },
  [ExpenseStatus.PROCESSING]: {
    id: 'processing',
    defaultMessage: 'Processing',
  },
  [ExpenseStatus.ERROR]: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  [ExpenseStatus.SCHEDULED_FOR_PAYMENT]: {
    id: 'expense.scheduledForPayment',
    defaultMessage: 'Scheduled for payment',
  },
  [ExpenseStatus.UNVERIFIED]: {
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
  ON_HOLD: {
    id: 'expense.onHold',
    defaultMessage: 'On Hold',
  },
  REFUNDED: {
    id: 'Expense.Status.Refunded',
    defaultMessage: 'Refunded',
  },
  [ExpenseStatus.INCOMPLETE]: {
    defaultMessage: 'Incomplete',
  },
  [ExpenseStatus.SPAM]: {
    defaultMessage: 'Spam',
  },
  [ExpenseStatus.CANCELED]: {
    id: 'expense.canceled',
    defaultMessage: 'Canceled',
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
