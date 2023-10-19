import { FormikProps } from 'formik';
import { v4 as uuid } from 'uuid';

import { ExpenseType } from '../../../lib/graphql/types/v2/graphql';

import { ExpenseFormValues, ExpenseItemFormValues } from '../types/FormValues';

/**
 * Init a new expense item with default attributes
 */
export const newExpenseItem = (attrs = {}): ExpenseItemFormValues => ({
  id: uuid(), // we generate it here to properly key lists, but it won't be submitted to API
  incurredAt: null,
  description: '',
  amount: null,
  url: '',
  __isNew: true,
  __isUploading: false,
  ...attrs,
});

/**
 * Returns true if the item has been touched by the user
 */
export const expenseItemIsTouched = (item: ExpenseItemFormValues): boolean => {
  return Boolean(item.incurredAt || item.description || item.amount || item.url);
};

/** Helper to add a new item to the form */
export const addNewExpenseItem = (
  formik: FormikProps<ExpenseFormValues>,
  defaultValues: ExpenseItemFormValues,
): void => {
  formik.setFieldValue('items', [...(formik.values.items || []), newExpenseItem(defaultValues)]);
};

/**
 * Returns true if the attachment require adding a file
 */
export const expenseItemsMustHaveFiles = (expenseType: string): boolean => {
  return expenseType === ExpenseType.RECEIPT || expenseType === ExpenseType.CHARGE;
};
