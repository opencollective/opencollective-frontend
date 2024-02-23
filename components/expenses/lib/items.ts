import type { FormikProps } from 'formik';
import { omit } from 'lodash';
import { v4 as uuid } from 'uuid';

import { ExpenseType } from '../../../lib/graphql/types/v2/graphql';

import type { ExpenseFormValues, ExpenseItemFormValues } from '../types/FormValues';

/**
 * When building expenses from drafts, amounts are returned in the database format.
 */
export const getExpenseItemAmountV2FromNewAttrs = (
  attrs,
  expenseCurrency: string,
): ExpenseItemFormValues['amountV2'] | undefined => {
  if (attrs['amountV2']) {
    return attrs['amountV2'];
  } else if (attrs['amount']) {
    return {
      valueInCents: attrs['amount'],
      value: attrs['amount'] / 100,
      currency: attrs['currency'] || expenseCurrency,
      exchangeRate:
        attrs['expenseCurrencyFxRate'] && attrs['expenseCurrencyFxRate'] !== 1
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
  amountV2: getExpenseItemAmountV2FromNewAttrs(attrs, expenseCurrency),
});

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
