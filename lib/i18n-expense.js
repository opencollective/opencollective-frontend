import ExpenseTypes from './constants/expenseTypes';
import { defineMessages } from 'react-intl';
import expenseStatus from './constants/expense-status';

const i18nCategories = defineMessages({
  Communications: {
    id: 'Expense.Category.Communications',
    defaultMessage: 'Communications',
  },
  Design: {
    id: 'Expense.Category.Design',
    defaultMessage: 'Design',
  },
  Donation: {
    id: 'Expense.Category.Donation',
    defaultMessage: 'Donation',
  },
  Engineering: {
    id: 'Expense.Category.Engineering',
    defaultMessage: 'Engineering',
  },
  Fund: {
    id: 'Expense.Category.Fund',
    defaultMessage: 'Fund',
  },
  'Food & Beverage': {
    id: 'Expense.Category.FoodBeverage',
    defaultMessage: 'Food & Beverage',
  },
  Marketing: {
    id: 'Expense.Category.Marketing',
    defaultMessage: 'Marketing',
  },
  Legal: {
    id: 'Expense.Category.Legal',
    defaultMessage: 'Legal',
  },
  'Supplies & materials': {
    id: 'Expense.Category.SuppliesAndMaterials',
    defaultMessage: 'Supplies & materials',
  },
  Travel: {
    id: 'Expense.Category.Travel',
    defaultMessage: 'Travel',
  },
  Team: {
    id: 'Expense.Category.Team',
    defaultMessage: 'Team',
  },
  Office: {
    id: 'Expense.Category.Office',
    defaultMessage: 'Office',
  },
  Other: {
    id: 'Expense.Category.Other',
    defaultMessage: 'Other',
  },
  'Web services': {
    id: 'Expense.Category.WebServices',
    defaultMessage: 'Web services',
  },
});

const i18nTypes = defineMessages({
  [ExpenseTypes.INVOICE]: {
    id: 'Expense.Type.Invoice',
    defaultMessage: 'Invoice',
  },
  [ExpenseTypes.RECEIPT]: {
    id: 'Expense.Type.Receipt',
    defaultMessage: 'Receipt',
  },
});

const i18nStatus = defineMessages({
  [expenseStatus.PENDING]: {
    id: 'expense.pending',
    defaultMessage: 'pending',
  },
  [expenseStatus.APPROVED]: {
    id: 'expense.approved',
    defaultMessage: 'approved',
  },
  [expenseStatus.REJECTED]: {
    id: 'expense.rejected',
    defaultMessage: 'rejected',
  },
  [expenseStatus.PAID]: {
    id: 'expense.paid',
    defaultMessage: 'paid',
  },
});

/**
 * Translate the category for an expense
 */
export const i18nExpenseCategory = (intl, category) => {
  return i18nCategories[category] ? intl.formatMessage(i18nCategories[category]) : category;
};

/**
 * Translate the type of an expense
 */
export const i18nExpenseType = (intl, type) => {
  return i18nTypes[type] ? intl.formatMessage(i18nTypes[type]) : type;
};

/**
 * Translate the status of an expense
 */
export const i18nExpenseStatus = (intl, status) => {
  return i18nStatus[status] ? intl.formatMessage(i18nStatus[status]) : status;
};
