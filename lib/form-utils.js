import { get, set } from 'lodash';
import { defineMessages } from 'react-intl';
import { isEmail } from 'validator';

import { createError, ERROR, formatErrorMessage } from './errors';

const messages = defineMessages({
  minLength: {
    id: 'FormError.minLengthRich',
    defaultMessage: 'Please use more than {count} characters',
  },
  maxLength: {
    id: 'FormError.maxLengthRich',
    defaultMessage: 'Please use fewer than {count} characters',
  },
});

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

export const verifyFieldLength = (intl, errors, data, field, min, max) => {
  // Ignore if there's already an error on the field
  if (!errors[field]) {
    const length = get(data, field)?.length || 0;
    if (length < min) {
      const message = intl.formatMessage(messages.minLength, { count: min });
      set(errors, field, createError(ERROR.FORM_FIELD_MIN_LENGTH, { message, hasI18nMessage: true }));
    } else if (length > max) {
      const message = intl.formatMessage(messages.maxLength, { count: max });
      set(errors, field, createError(ERROR.FORM_FIELD_MAX_LENGTH, { message, hasI18nMessage: true }));
    }
  }

  return errors;
};

export const verifyChecked = (errors, data, field) => {
  // Ignore if there's already an error on the field
  if (!errors[field] && !data[field]) {
    set(errors, field, createError(ERROR.FORM_FIELD_CHECK_REQUIRED));
  }

  return errors;
};

export const verifyEmailPattern = (errors, data, field) => {
  const value = get(data, field);
  if (!errors[field] && value && !isEmail(value)) {
    set(errors, field, createError(ERROR.FORM_FIELD_PATTERN));
  }

  return errors;
};

/**
 * A superset of `formatErrorMessage` that fallsback on `FORM_FIELD_INVALID_VALUE` for unknown errors.
 */
export const formatFormErrorMessage = (intl, error) => {
  return formatErrorMessage(intl, error, ERROR.FORM_FIELD_INVALID_VALUE);
};
