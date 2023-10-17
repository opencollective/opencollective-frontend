import { FormikProps } from 'formik';
import { cloneDeep, get, isNil, set } from 'lodash';

import { Account, ExpenseType, UploadFileResult } from '../../../lib/graphql/types/v2/graphql';

import type { ExpenseFormValues, ExpenseItemFormValues } from '../types/FormValues';

import { expenseItemsMustHaveFiles, newExpenseItem } from './items';
import { getSupportedCurrencies } from './utils';

/**
 * This function mutates formValues, make sure to clone it first
 * @returns true if the item was updated, false otherwise
 */
const updateExpenseItemWithUploadResult = (
  formValues: ExpenseFormValues,
  uploadResult: UploadFileResult,
  itemIdx: number,
): boolean => {
  const itemPath = `items[${itemIdx}]`;
  const itemValues = get(formValues, itemPath) || newExpenseItem();

  // Set item URL
  const fileUrl = uploadResult.file?.url;
  if (fileUrl) {
    if (expenseItemsMustHaveFiles(formValues.type)) {
      itemValues.url = fileUrl;
    } else if (!formValues.attachedFiles?.find(file => file.url === fileUrl)) {
      formValues.attachedFiles = [...formValues.attachedFiles, { url: fileUrl }];
    }
  }

  // Store the parsing result in the item so that it can be later split if needed
  const parsingResult = uploadResult.parsingResult?.expense;
  if (!parsingResult) {
    return Boolean(fileUrl);
  }

  // Update internal form props
  itemValues.__isUploading = false;
  itemValues.__parsingResult = parsingResult;
  itemValues.__canBeSplit = filterParsableItems(parsingResult.items).length > 1;
  itemValues.__file = uploadResult.file;

  // We don't allow changing the date or amount for virtual cards
  if (formValues.type !== 'CHARGE') {
    if (parsingResult.date && isNil(itemValues.incurredAt)) {
      itemValues.incurredAt = parsingResult.date;
    }

    if (
      parsingResult.amount?.valueInCents &&
      parsingResult.amount.currency === formValues.currency &&
      !itemValues.amount
    ) {
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
  defaultAttributes = {},
): boolean => {
  const itemPath = `items[${itemIdx}]`;
  const itemValues = get(formValues, itemPath) || newExpenseItem();

  // Merge default attributes
  Object.assign(itemValues, defaultAttributes);

  // Update internal form props
  itemValues.__isUploading = false;
  itemValues.__canBeSplit = false;
  itemValues.__itemParsingResult = uploadItem;

  // Set item URL
  if (uploadItem.url) {
    if (expenseItemsMustHaveFiles(formValues.type)) {
      itemValues.url = uploadItem.url;
    } else if (!formValues.attachedFiles?.find(file => file.url === uploadItem.url)) {
      formValues.attachedFiles = [...formValues.attachedFiles, { url: uploadItem.url }];
    }
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
  /** Keep this to null to append items at the end */
  itemIndexesToReplace: number[] = null,
) => {
  const formValues = cloneDeep(form.values);
  const resultsThatReplaceItems = uploadResults.slice(0, itemIndexesToReplace?.length || 0);
  const resultsToAppend = uploadResults.slice(itemIndexesToReplace?.length || 0);

  // Update global values if there's a single document
  const uniqueOCRResult = uploadResults.length === 1 && uploadResults.find(result => result.parsingResult?.expense);
  if (uniqueOCRResult) {
    // Expense title/description
    if (!form.values.description) {
      formValues.description = uniqueOCRResult.parsingResult.expense.description;
    }

    // Currency - we only force it if no amount have been set yet
    if (form.values.type !== 'CHARGE') {
      const parsedCurrency = uniqueOCRResult.parsingResult.expense.amount?.currency;
      if (canSetCurrency(formValues, collective, parsedCurrency)) {
        formValues.currency = parsedCurrency;
      }
    }
  }

  // Replace items specified with `itemIndexesToReplace`
  resultsThatReplaceItems.forEach((uploadResult, idx) => {
    updateExpenseItemWithUploadResult(formValues, uploadResult, itemIndexesToReplace[idx]);
  });

  // Append other items at the end
  resultsToAppend.forEach(uploadResult => {
    updateExpenseItemWithUploadResult(formValues, uploadResult, formValues.items.length);
  });

  // Make sure all items are marked as uploaded, even if there's no parsing result
  itemIndexesToReplace?.forEach(idx => {
    if (formValues.items[idx]?.__isUploading) {
      formValues.items[idx].__isUploading = false;
    }
  });

  // Update form with the new values
  form.setValues(formValues);

  return true;
};

export const filterParsableItems = (items: UploadFileResult['parsingResult']['expense']['items']) => {
  if (!items) {
    return [];
  } else {
    return items.filter(item => item.amount?.valueInCents && item.amount.currency);
  }
};

export const splitExpenseItem = (form: FormikProps<ExpenseFormValues>, itemIdx: number): boolean => {
  const newFormValues = cloneDeep(form.values);
  const item = get(newFormValues, `items[${itemIdx}]`);

  if (!item?.__canBeSplit) {
    return false;
  }

  const parsedItems = filterParsableItems(item.__parsingResult.items);

  // Reset the first item's description and update it with the first parsing result
  newFormValues.items[itemIdx].description = '';
  updateExpenseItemWithUploadItem(newFormValues, parsedItems[0], itemIdx);

  // Create new items for the other parsing results
  parsedItems.slice(1).forEach((parsedItem, idx) => {
    const newItemIdx = itemIdx + idx + 1;
    newFormValues.items.splice(newItemIdx, 0, null);
    updateExpenseItemWithUploadItem(newFormValues, parsedItem, newItemIdx, { __file: item.__file, url: item.url });
  });

  form.setValues(newFormValues);

  return true;
};

export const checkExpenseSupportsOCR = (expenseType: ExpenseType, loggedInUser): boolean => {
  if (['RECEIPT', 'CHARGE'].includes(expenseType)) {
    return true;
  } else if (expenseType === 'INVOICE') {
    return Boolean(loggedInUser?.isRoot);
  } else {
    return false;
  }
};

export const checkExpenseItemCanBeSplit = (item: ExpenseItemFormValues, expenseType: ExpenseType): boolean => {
  return Boolean(item.__canBeSplit && [ExpenseType.RECEIPT, ExpenseType.INVOICE].includes(expenseType));
};

type FieldsWithOCRSupport = 'description' | 'incurredAt' | 'amount' | 'url';

type ExpenseItemFields = Extract<keyof ExpenseItemFormValues, FieldsWithOCRSupport>;

export const ITEM_OCR_ROOT_FIELD_MAPPING: Record<ExpenseItemFields, string> = {
  url: '__file.url',
  incurredAt: '__parsingResult.date',
  description: '__parsingResult.description',
  amount: '__parsingResult.amount',
};

export const ITEM_OCR_FIELD_MAPPING: Record<Exclude<ExpenseItemFields, 'url'>, string> = {
  incurredAt: '__itemParsingResult.incurredAt',
  description: '__itemParsingResult.description',
  amount: '__itemParsingResult.amount',
};

/**
 * Check whether there's a mismatch between the OCR value and the value entered by the user.
 */
const compareItemOCRValue = (
  item: ExpenseItemFormValues,
  field: Omit<keyof ExpenseItemFormValues, `_${string}`>,
  expenseCurrency: string,
): {
  hasMismatch: boolean;
  ocrValue: any;
} => {
  const existingValue = item[field as keyof ExpenseItemFormValues];
  const checkValue = ocrValue => {
    if (isNil(existingValue) || isNil(ocrValue)) {
      return { hasMismatch: false, ocrValue };
    } else if (field === 'amount') {
      return {
        hasMismatch: ocrValue.currency !== expenseCurrency || existingValue !== ocrValue.valueInCents,
        ocrValue,
      };
    } else {
      return { hasMismatch: existingValue !== ocrValue, ocrValue };
    }
  };

  // If there's an item available, we try to match on it
  const itemOCRValue = get(item, ITEM_OCR_FIELD_MAPPING[field as keyof ExpenseItemFormValues]);
  if (!isNil(itemOCRValue)) {
    return checkValue(itemOCRValue);
  }

  // Otherwise we match on the root value
  const rootOCRValue = get(item, ITEM_OCR_ROOT_FIELD_MAPPING[field as keyof ExpenseItemFormValues]);
  return checkValue(rootOCRValue);
};

type ExpenseOCRValuesComparison = Record<FieldsWithOCRSupport, { hasMismatch: boolean; ocrValue: any }>;

export const compareItemOCRValues = (
  item: ExpenseItemFormValues,
  expenseCurrency: string,
): ExpenseOCRValuesComparison => {
  return Object.keys(ITEM_OCR_FIELD_MAPPING).reduce((result, field) => {
    result[field as keyof ExpenseItemFormValues] = compareItemOCRValue(
      item,
      field as Omit<keyof ExpenseItemFormValues, `_${string}`>,
      expenseCurrency,
    );
    return result;
  }, {} as ExpenseOCRValuesComparison);
};

/** Return true if the item has an OCR parsing result */
export const itemHasOCR = (item: ExpenseItemFormValues): boolean => {
  return Boolean(item.__parsingResult || item.__itemParsingResult);
};
