import { FormikProps } from 'formik';
import { cloneDeep, get, partition, set } from 'lodash';

import { Account, UploadFileResult } from '../../../lib/graphql/types/v2/graphql';

import type { ExpenseFormValues } from '../types/FormValues';

import { expenseItemsMustHaveFiles, newExpenseItem } from './items';
import { getSupportedCurrencies } from './utils';

/**
 * This function mutates formValues, make sure to clone it first
 * @returns true if the item was updated, false otherwise
 */
const updateExpenseItemWithUploadResult = (
  formValues: ExpenseFormValues,
  parsingResult: UploadFileResult['parsingResult']['expense'],
  itemIdx: number,
): boolean => {
  const itemPath = `items[${itemIdx}]`;
  const itemValues = get(formValues, itemPath) || newExpenseItem();

  // Store the parsing result in the item so that it can be later split if needed
  itemValues.__parsingResult = parsingResult;

  // Set item URL
  const fileUrl = get(parsingResult, 'items[0].url'); // All items are supposed to have the same URL
  if (fileUrl) {
    if (expenseItemsMustHaveFiles(formValues.type)) {
      itemValues.url = fileUrl;
    } else if (!formValues.attachedFiles?.find(file => file.url === fileUrl)) {
      formValues.attachedFiles = [...formValues.attachedFiles, { url: fileUrl }];
    }
  }

  // Set item description
  if (parsingResult.description) {
    itemValues.description = parsingResult.description;
  }

  // We don't allow changing the date or amount for virtual cards
  if (formValues.type !== 'CHARGE') {
    if (parsingResult.date) {
      itemValues.incurredAt = parsingResult.date;
    }

    if (parsingResult.amount?.valueInCents && parsingResult.amount.currency === formValues.currency) {
      itemValues.amount = parsingResult.amount.valueInCents;
    }
  }

  set(formValues, itemPath, itemValues);

  return true;
};

const updateExpenseItemWithUploadItem = (
  formValues: ExpenseFormValues,
  uploadItem: UploadFileResult['parsingResult']['expense']['items'][0],
  itemIdx: number,
): boolean => {
  const itemPath = `items[${itemIdx}]`;
  const itemValues = get(formValues, itemPath) || newExpenseItem();
  delete itemValues.__parsingResult;

  // Set item URL
  if (uploadItem.url) {
    if (expenseItemsMustHaveFiles(formValues.type)) {
      itemValues.url = uploadItem.url;
    } else if (!formValues.attachedFiles?.find(file => file.url === uploadItem.url)) {
      formValues.attachedFiles = [...formValues.attachedFiles, { url: uploadItem.url }];
    }
  }

  // Set item description
  if (uploadItem.description) {
    itemValues.description = uploadItem.description;
  }

  // We don't allow changing the date or amount for virtual cards
  if (formValues.type !== 'CHARGE') {
    if (uploadItem.incurredAt) {
      itemValues.incurredAt = uploadItem.incurredAt;
    }

    if (uploadItem.amount?.valueInCents && uploadItem.amount.currency === formValues.currency) {
      itemValues.amount = uploadItem.amount.valueInCents;
    }
  }

  set(formValues, itemPath, itemValues);
  return true;
};

const canSetCurrency = (formValues: ExpenseFormValues, collective, currency: string) => {
  return (
    currency &&
    !formValues.items.some(item => item.amount) &&
    getSupportedCurrencies(collective, formValues.payoutMethod).includes(currency)
  );
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
  collective: Account,
  form: FormikProps<ExpenseFormValues>,
  uploadResults: UploadFileResult[],
  itemIdxToReplace: number = 0,
) => {
  const formValues = cloneDeep(form.values);
  const getParsedExpense = (uploadResult: UploadFileResult) => get(uploadResult, 'parsingResult.expense');
  const [resultsWithOCR, resultsWithoutOCR] = partition(uploadResults, getParsedExpense);
  const isVirtualCardCharge = formValues.type === 'CHARGE';

  const firstParsingResult = resultsWithOCR?.[0]?.parsingResult?.expense;
  if (firstParsingResult) {
    // Update global values if there's a single document
    if (uploadResults.length === 1) {
      // Expense title/description
      if (!form.values.description) {
        formValues.description = firstParsingResult.description;
      }

      // Currency - we only force it if no amount have been set yet
      if (form.values.type !== 'CHARGE') {
        const parsedCurrency = firstParsingResult.amount?.currency;
        if (canSetCurrency(formValues, collective, parsedCurrency)) {
          formValues.currency = parsedCurrency;
        }
      }
    }

    // Update first item
    updateExpenseItemWithUploadResult(formValues, firstParsingResult, itemIdxToReplace);
  }

  // Append other items at the end
  resultsWithOCR.slice(1).forEach(uploadResult => {
    updateExpenseItemWithUploadResult(formValues, uploadResult.parsingResult.expense, formValues.items.length);
  });

  // We still want to add any unparsed files as items/attachments
  if (!isVirtualCardCharge && resultsWithoutOCR.length > 0) {
    if (expenseItemsMustHaveFiles(formValues.type)) {
      formValues.items = [
        ...formValues.items,
        ...resultsWithoutOCR.map(result => newExpenseItem({ url: result.file.url })),
      ];
    } else {
      formValues.attachedFiles = [
        ...formValues.attachedFiles,
        ...resultsWithoutOCR.map(result => ({ url: result.file.url })),
      ];
    }
  }

  form.setValues(formValues);
};

export const filterParsableItems = (items: UploadFileResult['parsingResult']['expense']['items']) => {
  if (!items) {
    return [];
  } else {
    return items.filter(item => item.amount?.valueInCents && item.amount.currency);
  }
};

export const itemCanBeSplit = (item: ExpenseFormValues['items'][0]): boolean => {
  return filterParsableItems(item.__parsingResult?.items).length > 1;
};

export const splitExpenseItem = (form: FormikProps<ExpenseFormValues>, itemIdx: number): boolean => {
  const newFormValues = cloneDeep(form.values);
  const item = get(newFormValues, `items[${itemIdx}]`);

  if (!item || !itemCanBeSplit(item)) {
    return false;
  }

  const parsedItems = filterParsableItems(item.__parsingResult.items);

  // Update the item itself with the first parsing result
  updateExpenseItemWithUploadItem(newFormValues, parsedItems[0], itemIdx);

  // Create new items for the other parsing results
  parsedItems.slice(1).forEach((parsedItem, idx) => {
    const newItemIdx = itemIdx + idx + 1;
    newFormValues.items.splice(newItemIdx, 0, null);
    updateExpenseItemWithUploadItem(newFormValues, parsedItem, newItemIdx);
  });

  form.setValues(newFormValues);

  return true;
};
