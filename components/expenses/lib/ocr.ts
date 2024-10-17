import type { FormikProps } from 'formik';
import { cloneDeep, get, isNil, set } from 'lodash';

import type { Account, ExpenseType, UploadFileResult } from '../../../lib/graphql/types/v2/graphql';

import type { ExpenseFormValues, ExpenseItemFormValues } from '../types/FormValues';

import { expenseItemsMustHaveFiles, newExpenseItem } from './items';

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
  const itemValues: ExpenseItemFormValues = get(formValues, itemPath) || newExpenseItem({}, formValues.currency);

  // Set item URL
  const fileUrl = uploadResult.file?.url;
  if (fileUrl) {
    if (expenseItemsMustHaveFiles(formValues.type)) {
      itemValues.url = fileUrl;
    } else if (!formValues.attachedFiles?.find(file => file.url === fileUrl)) {
      formValues.attachedFiles = [...formValues.attachedFiles, { url: fileUrl }];
    }
  }

  // Store the parsing result in the item
  const parsingResult = uploadResult.parsingResult?.expense;
  if (!parsingResult) {
    return Boolean(fileUrl);
  }

  // Update internal form props
  itemValues.__isUploading = false;
  itemValues.__parsingResult = parsingResult;
  itemValues.__file = uploadResult.file;

  // We don't allow changing the date or amount for virtual cards
  if (formValues.type !== 'CHARGE') {
    if (parsingResult.date && isNil(itemValues.incurredAt)) {
      itemValues.incurredAt = parsingResult.date;
    }

    if (parsingResult.amount?.valueInCents && !itemValues.amountV2?.valueInCents) {
      itemValues.amountV2 = parsingResult.amount;
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

export const checkExpenseSupportsOCR = (expenseType: ExpenseType, loggedInUser): boolean => {
  if (['RECEIPT', 'CHARGE'].includes(expenseType)) {
    return true;
  } else if (expenseType === 'INVOICE') {
    return Boolean(loggedInUser?.isRoot);
  } else {
    return false;
  }
};

type FieldsWithOCRSupport = 'description' | 'incurredAt' | 'amountV2';

type ExpenseItemFields = Extract<keyof ExpenseItemFormValues, FieldsWithOCRSupport>;

const ITEM_OCR_FIELD_MAPPING: Record<ExpenseItemFields, string> = {
  incurredAt: '__parsingResult.date',
  description: '__parsingResult.description',
  amountV2: '__parsingResult.amount',
};

/**
 * Check whether there's a mismatch between the OCR value and the value entered by the user.
 */
const compareItemOCRValue = (
  item: ExpenseItemFormValues,
  field: Omit<keyof ExpenseItemFormValues, `_${string}`>,
): {
  hasMismatch: boolean;
  ocrValue: any;
} => {
  const existingValue = item[field as keyof ExpenseItemFormValues];
  const checkValue = ocrValue => {
    if (isNil(existingValue) || isNil(ocrValue)) {
      return { hasMismatch: false, ocrValue };
    } else if (field === 'amountV2') {
      const hasCurrencyMismatch = ocrValue.currency !== existingValue?.['currency'];
      const hasAmountMismatch = existingValue?.['valueInCents'] !== ocrValue.valueInCents;
      return {
        hasCurrencyMismatch,
        hasAmountMismatch,
        hasMismatch: hasCurrencyMismatch || hasAmountMismatch,
        ocrValue,
      };
    } else if (field === 'incurredAt') {
      const normalizeDateStr = dateStr => dateStr.split('T')[0];
      return { hasMismatch: normalizeDateStr(ocrValue) !== normalizeDateStr(existingValue), ocrValue };
    } else {
      return { hasMismatch: existingValue !== ocrValue, ocrValue };
    }
  };

  const ocrValue = get(item, ITEM_OCR_FIELD_MAPPING[field as keyof ExpenseItemFormValues]);
  return checkValue(ocrValue);
};

type ExpenseOCRValuesComparison = Record<FieldsWithOCRSupport, { hasMismatch: boolean; ocrValue: any }>;

export const compareItemOCRValues = (item: ExpenseItemFormValues): ExpenseOCRValuesComparison => {
  return Object.keys(ITEM_OCR_FIELD_MAPPING).reduce((result, field) => {
    result[field as keyof ExpenseItemFormValues] = compareItemOCRValue(
      item,
      field as Omit<keyof ExpenseItemFormValues, `_${string}`>,
    );
    return result;
  }, {} as ExpenseOCRValuesComparison);
};

/** Return true if the item has an OCR parsing result */
export const itemHasOCR = (item: ExpenseItemFormValues): boolean => {
  return Boolean(item.__parsingResult);
};
