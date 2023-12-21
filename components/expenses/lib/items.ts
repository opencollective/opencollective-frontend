import { FormikProps } from 'formik';
import { omit } from 'lodash';
import { v4 as uuid } from 'uuid';

import { ExpenseType } from '../../../lib/graphql/types/v2/graphql';

import { ExpenseFormValues, ExpenseItemFormValues } from '../types/FormValues';

/**
 * When building expenses from drafts, amounts are returned in the database format.
 */
const getAmountV2FromNewAttrs = (attrs, expenseCurrency: string): ExpenseItemFormValues['amountV2'] | undefined => {
  if (attrs['amountV2']) {
    return attrs['amountV2'];
  } else if (attrs['amount']) {
    return {
      value: attrs['amount'],
      currency: attrs['currency'] || expenseCurrency,
      exchangeRate: attrs['expenseCurrencyFxRate']
        ? {
            value: attrs['expenseCurrencyFxRate'],
            source: attrs['expenseCurrencyFxRateSource'],
            fromCurrency: attrs['currency'],
            toCurrency: attrs['currency'],
            date: attrs['incurredAt'],
          }
        : null,
    };
  }
};

/**
 * Init a new expense item with default attributes
 */
export const newExpenseItem = (attrs = {}, expenseCurrency: string): ExpenseItemFormValues => ({
  id: uuid(), // we generate it here to properly key lists, but it won't be submitted to API
  incurredAt: null,
  description: '',
  url: '',
  __isNew: true,
  __isUploading: false,
  ...omit(attrs, ['amount', 'amountV2']),
  amountV2: getAmountV2FromNewAttrs(attrs, expenseCurrency),
});

/**
 * Returns true if the item has been touched by the user
 */
export const expenseItemIsTouched = (item: ExpenseItemFormValues): boolean => {
  return Boolean(item.incurredAt || item.description || item.amountV2 || item.url);
};

/** Helper to add a new item to the form */
export const addNewExpenseItem = (
  formik: FormikProps<ExpenseFormValues>,
  defaultValues: ExpenseItemFormValues,
): void => {
  formik.setFieldValue('items', [
    ...(formik.values.items || []),
    newExpenseItem(defaultValues, formik.values.currency),
  ]);
};

/**
 * Returns true if the attachment require adding a file
 */
export const expenseItemsMustHaveFiles = (expenseType: string): boolean => {
  return expenseType === ExpenseType.RECEIPT || expenseType === ExpenseType.CHARGE;
};
