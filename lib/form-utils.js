import { get } from 'lodash';
import { createError, ERROR, formatErrorMessage } from './errors';

/**
 * Will return an object of errors for all fields defined in `requiredFields`
 * that are not in `data`.
 */
export const requireFields = (data, requiredFields, { stopOnFirstError = false } = {}) => {
  const errors = {};

  for (const field of requiredFields) {
    const value = get(data, field);
    if (!value || (Array.isArray(value) && value.length === 0)) {
      errors[field] = createError(ERROR.FORM_FIELD_REQUIRED);
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
