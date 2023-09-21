import { FormikProps } from 'formik';
import { cloneDeep, get, partition, set, uniq } from 'lodash';

import { UploadFileResult } from '../../../lib/graphql/types/v2/graphql';

import type { ExpenseFormValues } from '../types/FormValues';

import { expenseItemsMustHaveFiles, newExpenseItem } from './items';

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

  const itemValues = get(formValues, itemPath) || newExpenseItem();

  if (parsedItem.url) {
    if (expenseItemsMustHaveFiles(formValues.type)) {
      itemValues.url = parsedItem.url;
    } else if (!formValues.attachedFiles?.find(file => file.url === parsedItem.url)) {
      formValues.attachedFiles = [...formValues.attachedFiles, { url: parsedItem.url }];
    }
  }

  if (parsedItem.description) {
    itemValues.description = parsedItem.description;
  }

  // We don't allow changing the date or amount for virtual cards
  if (formValues.type !== 'CHARGE') {
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
  const getItemsFromUploadResult = (uploadResult: UploadFileResult) => get(uploadResult, 'parsingResult.expense.items');
  const [resultWithItems, resultsWithoutItems] = partition(uploadResults, getItemsFromUploadResult);
  const allParsedItems = resultWithItems.map(getItemsFromUploadResult).flat();
  const isVirtualCardCharge = formValues.type === 'CHARGE';

  // Update global values
  // TOOD(OCR): Figure a strategy for multiple files
  const firstParsingResult = uploadResults[0].parsingResult?.expense;
  if (firstParsingResult && uploadResults.length === 1) {
    // Expense title/description
    if (!form.values.description) {
      formValues.description = firstParsingResult.description;
    }

    // Currency - we only force it if all items have the same currency
    if (form.values.type !== 'CHARGE') {
      const allCurrencies = uniq(allParsedItems.map(item => item.amount.currency));
      if (allCurrencies.length === 1) {
        formValues.currency = allCurrencies[0];
      }
    }
  }

  // Update items
  if (isVirtualCardCharge) {
    // Virtual cards are a special case, we don't want to touch most fields (amount, date)
    set(formValues, 'items[0].description', firstParsingResult?.description);
    set(formValues, 'items[0].url', allParsedItems?.[0]?.url);
  } else if (allParsedItems.length > 0) {
    // Feed items (or attached files) with uploaded files
    allParsedItems.forEach(parsedItem => {
      // If there's an item to replace, we replace it then append the other lines as new items
      const itemIdx = itemIdxToReplace ?? formValues.items.length;
      if (updateExpenseItemWithUploadResult(formValues, parsedItem, `items[${itemIdx}]`)) {
        itemIdxToReplace = null;
      }
    });
  }

  // We still want to add any unparsed files as items/attachments
  if (!isVirtualCardCharge && resultsWithoutItems.length > 0) {
    if (expenseItemsMustHaveFiles(formValues.type)) {
      formValues.items = [
        ...formValues.items,
        ...resultsWithoutItems.map(result => newExpenseItem({ url: result.file.url })),
      ];
    } else {
      formValues.attachedFiles = [
        ...formValues.attachedFiles,
        ...resultsWithoutItems.map(result => ({ url: result.file.url })),
      ];
    }
  }

  form.setValues(formValues);
};
