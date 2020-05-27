import { get, set } from 'lodash';

import { createError, ERROR, formatErrorMessage } from './errors';

const isEmpty = value => {
  if (!value) {
    return true;
  } else if (Array.isArray(value) && value.length === 0) {
    return true;
  } else if (typeof value === 'string' && !value.trim()) {
    return true;
  } else {
    return false;
  }
};

/**
 * Will return an object of errors for all fields defined in `requiredFields`
 * that are not in `data`.
 */
export const requireFields = (data, requiredFields, { stopOnFirstError = false } = {}) => {
  const errors = {};

  for (const field of requiredFields) {
    const value = get(data, field);
    if (isEmpty(value)) {
      set(errors, field, createError(ERROR.FORM_FIELD_REQUIRED));
      if (stopOnFirstError) {
        return errors;
      }
    }
  }

  return errors;
};

/**
 * A superset of `formatErrorMessage` that fallsback on `FORM_FIELD_INVALID_VALUE` for unknown errors.
 */
export const formatFormErrorMessage = (intl, error) => {
  return formatErrorMessage(intl, error, ERROR.FORM_FIELD_INVALID_VALUE);
};
