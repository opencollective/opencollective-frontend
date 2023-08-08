import { FormikProps } from 'formik';
import { cloneDeep, get, set, uniq } from 'lodash';

import { UploadFileResult } from '../../../lib/graphql/types/v2/graphql';

import type { ExpenseFormValues } from '../types/FormValues';

import { attachmentRequiresFile } from './attachments';
import { newExpenseItem } from './items';

/**
 * This function mutates formValues, make sure to clone it first
 * @returns true if the item was updated, false otherwise
 */
const updateExpenseItemWithUploadResult = (
  formValues: ExpenseFormValues,
  parsedItem: UploadFileResult['parsingResult']['expense']['items'][0],
  /** E.g., 'items[0]' */
  itemPath: string,
): boolean => {
  // We don't support items with 0 amount yet, see https://github.com/opencollective/opencollective/issues/3044
  if (parsedItem.amount?.valueInCents === 0) {
    return false;
  }

  // Small helpers
  const itemValues = get(formValues, itemPath) || newExpenseItem();

  if (parsedItem.url) {
    if (attachmentRequiresFile(formValues.type)) {
      itemValues.url = parsedItem.url;
    } else if (!formValues.attachedFiles?.find(file => file.url === parsedItem.url)) {
      formValues.attachedFiles = [...formValues.attachedFiles, { url: parsedItem.url }];
    }
  }

  if (parsedItem.description) {
    itemValues.description = parsedItem.description;
  }

  if (parsedItem.incurredAt) {
    itemValues.incurredAt = parsedItem.incurredAt;
  }

  // TODO(OCR): Figure a strategy for multiple currencies, see https://github.com/opencollective/opencollective/issues/6906
  if (!formValues.currency && parsedItem.amount?.currency) {
    itemValues.currency = parsedItem.amount?.currency;
  }

  if (parsedItem.amount && parsedItem.amount.currency === formValues.currency) {
    itemValues.amount = parsedItem.amount.valueInCents;
  }

  set(formValues, itemPath, itemValues);

  return true;
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
  itemIdxToReplace: number = undefined,
) => {
  const formValues = cloneDeep(form.values);
  const allParsedItems = uploadResults.map(uploadResult => uploadResult.parsingResult?.expense?.items).flat();

  // Currency - we only force it if all items have the same currency
  const allCurrencies = uniq(allParsedItems.map(item => item.amount.currency));
  if (allCurrencies.length === 1) {
    formValues.currency = allCurrencies[0];
  }

  // Feed items with uploaded files
  allParsedItems.forEach(parsedItem => {
    // If there's an item to replace, we replace it then append the other lines as new items
    const itemIdx = itemIdxToReplace ?? formValues.items.length;
    if (updateExpenseItemWithUploadResult(formValues, parsedItem, `items[${itemIdx}]`)) {
      itemIdxToReplace = null;
    }
  });

  // Update other values
  // TOOD(OCR): Figure a strategy for multiple files
  const firstParsingResult = uploadResults[0].parsingResult?.expense;
  if (firstParsingResult && uploadResults.length === 1) {
    if (!form.values.description) {
      formValues.description = firstParsingResult.description;
    }
  }

  form.setValues(formValues);
};
