import { isEmpty, isObject } from 'lodash';

import type { CSVConfig } from './types';

const recursivelyRemoveEmptyValues = (obj: Record<string, any>): Record<string, any> => {
  if (!isObject(obj) || isEmpty(obj)) {
    return obj;
  }

  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (isObject(value) && !Array.isArray(value)) {
        const nestedValue = recursivelyRemoveEmptyValues(value);
        if (!isEmpty(nestedValue)) {
          acc[key] = nestedValue;
        }
      } else if (!isEmpty(value)) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>,
  );
};

export const removeEmptyValues = (entry: [string, unknown]): [string, unknown] => {
  if (isObject(entry[1]) && !isEmpty(entry[1])) {
    return [entry[0], recursivelyRemoveEmptyValues(entry[1])];
  } else {
    return entry;
  }
};

export const filterRawValueEntries = ([key, value]: [string, unknown], csvConfig?: CSVConfig | undefined): boolean => {
  // Ignore empty values
  if (isEmpty(value)) {
    return false;
  }

  if (csvConfig) {
    const { columns } = csvConfig;
    if ([columns.credit.target, columns.debit.target, columns.date.target].includes(key)) {
      return false;
    }
  } else {
    if (
      [
        // Ignore columns that are already displayed
        'date',
        'description',
        'amount',
        'name',
        'transaction_id',
        // Ignore some irrelevant columns
        'personal_finance_category',
        'personal_finance_category_icon_url',
      ].includes(key)
    ) {
      return false;
    }
  }

  return true;
};
