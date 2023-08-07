import { FormikProps } from 'formik';
import { get } from 'lodash';

import { UploadFileResult } from '../../../lib/graphql/types/v2/graphql';

import type { ExpenseFormValues } from '../types/FormValues';

export const updateExpenseItemWithUploadResult = (
  form: FormikProps<ExpenseFormValues>,
  uploadResult: UploadFileResult,
  /** E.g., 'items[0]' */
  itemPath: string,
) => {
  // Small helpers
  const getItemFieldName = field => `${itemPath}.${field}`;
  const getItemValue = field => get(form.values, getItemFieldName(field));

  // Set URL
  // TODO(OCR): if not a receipt, set as attachment
  form.setFieldValue(getItemFieldName('url'), uploadResult.file.url);

  // Integrated parsed data
  const parsedData = uploadResult.parsingResult?.expense;
  if (!parsedData) {
    return;
  }
  if (parsedData.description) {
    if (!getItemValue('description')) {
      form.setFieldValue(getItemFieldName('description'), parsedData.description);
    }
  }

  if (parsedData.amount) {
    if (!getItemValue('amount') && parsedData.amount.currency === form.values.currency) {
      form.setFieldValue(getItemFieldName('amount'), parsedData.amount.valueInCents);
    }
  }

  if (parsedData.incurredAt) {
    if (!getItemValue('incurredAt')) {
      form.setFieldValue(getItemFieldName('incurredAt'), parsedData.incurredAt);
    }
  }
};

/**
 * Updates the expense form with the OCR parsing result from API.
 *
 * @param form The formik bag
 * @param uploadResult The upload result from API
 * @param itemPath The path of the item to update
 * @returns
 */
export const updateExpenseFormWithUploadResult = (
  form: FormikProps<ExpenseFormValues>,
  uploadResults: UploadFileResult[],
) => {
  // Feed items with uploaded files
  uploadResults.forEach((uploadResult, index) => {
    updateExpenseItemWithUploadResult(form, uploadResult, `items[${index}]`);
  });

  // Update other values
  // TOOD(OCR): Figure a strategy for multiple items
  const parsingResult = uploadResults[0].parsingResult?.expense;
  if (uploadResults.length === 1 && parsingResult) {
    if (!form.values.description) {
      form.setFieldValue('description', parsingResult.description);
    }
  }
};
