import { FormikProps } from 'formik';
import { v4 as uuid } from 'uuid';

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
  ...attrs,
});

/** Helper to add a new item to the form */
export const addNewExpenseItem = (
  formik: FormikProps<ExpenseFormValues>,
  defaultValues: ExpenseItemFormValues,
): void => {
  formik.setFieldValue('items', [...(formik.values.items || []), newExpenseItem(defaultValues)]);
};
