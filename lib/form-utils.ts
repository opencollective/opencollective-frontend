import { get, set } from 'lodash';
import { defineMessages } from 'react-intl';
import { isEmail, isURL } from 'validator';

import { createError, ERROR, formatErrorMessage } from './errors';

export const RICH_ERROR_MESSAGES = defineMessages({
  minLength: {
    id: 'FormError.minLengthRich',
    defaultMessage: 'Please use more than {count} characters',
  },
  maxLength: {
    id: 'FormError.maxLengthRich',
    defaultMessage: 'Please use fewer than {count} characters',
  },
  notInRange: {
    defaultMessage: 'Value must be between {min} and {max}',
  },
  format: {
    id: 'FormError.pattern',
    defaultMessage: 'This value is not formatted properly',
  },
  enum: {
    id: 'FormError.enum',
    defaultMessage: 'Must be one of: {options}',
  },
  invalidValue: {
    id: 'FormError.InvalidValue',
    defaultMessage: 'Invalid value',
  },
  requiredValue: {
    id: 'Error.FieldRequired',
    defaultMessage: 'This field is required',
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
export const requireFields = (data, requiredFields, { stopOnFirstError = false, allowNull = false } = {}) => {
  const errors = {};

  for (const field of requiredFields) {
    const value = get(data, field);
    if (isEmpty(value) && (!allowNull || value !== null)) {
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
      const message = intl.formatMessage(RICH_ERROR_MESSAGES.minLength, { count: min });
      set(errors, field, createError(ERROR.FORM_FIELD_MIN_LENGTH, { message, hasI18nMessage: true }));
    } else if (length > max) {
      const message = intl.formatMessage(RICH_ERROR_MESSAGES.maxLength, { count: max });
      set(errors, field, createError(ERROR.FORM_FIELD_MAX_LENGTH, { message, hasI18nMessage: true }));
    }
  }

  return errors;
};

export const verifyValueInRange = (intl, errors, data, field, min, max, multiplier = 1) => {
  const value = get(data, field);

  // Ignore if there's already an error on the field
  if (!errors[field] && (value < min || value > max)) {
    const message = intl.formatMessage(RICH_ERROR_MESSAGES.notInRange, {
      min: min * multiplier,
      max: max * multiplier,
    });
    set(errors, field, createError(ERROR.FORM_FIELD_VALUE_NOT_IN_RANGE, { message, hasI18nMessage: true }));
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

export const verifyURLPattern = (errors, data, field) => {
  const value = get(data, field);
  if (!errors[field] && value && !isURL(value)) {
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
