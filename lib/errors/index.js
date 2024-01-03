/**
 * A library to standardize errors.
 *
 * It relies on the OCError type to store all information related to the error, especially:
 * - Its type, identified with the `id` column that must match one of `ERROR`
 * - An optional payload
 *
 * ## Philosophy
 *
 * ### You generate standard errors...
 * - with `createError`, the base entry point to create any error
 * - with `getErrorFromGraphqlException`, to easily generate a standard error from a GraphQL error
 * - with `getErrorFromInvoiceServiceException` (todo, for the invoice service)
 * - or with other helpers like `generateNotFoundError`, or `requireFields` in `lib/form-utils.js` for forms
 *
 * ### You manipulate them...
 * - `isErrorType`: to check if an error is of the given type
 *
 * ### You display them...
 * With the `formatErrorMessage` helper, that will:
 * - Translate the error
 * - Display a fallback error message if the type is unknown
 *
 */
import { get, has, isError } from 'lodash';
import { defineMessages } from 'react-intl';

import I18nFormatters from '../../components/I18nFormatters';

import { TRANSFERWISE_ERROR, transferwiseMsg } from './transferwise';

// ---- Types & constants ----

/** Defines error types */
export const ERROR = {
  UNKNOWN: 'UNKNOWN',
  NETWORK: 'NETWORK',
  NOT_FOUND: 'NOT_FOUND',
  NotFound: 'NOT_FOUND',
  BAD_COLLECTIVE_TYPE: 'BAD_COLLECTIVE_TYPE',
  FORM_FIELD_MIN: 'FORM_FIELD_MIN',
  FORM_FIELD_MAX: 'FORM_FIELD_MAX',
  FORM_FIELD_REQUIRED: 'FORM_FIELD_REQUIRED',
  FORM_FIELD_CHECK_REQUIRED: 'FORM_FIELD_CHECK_REQUIRED',
  FORM_FIELD_MIN_LENGTH: 'FORM_FIELD_MIN_LENGTH',
  FORM_FIELD_MAX_LENGTH: 'FORM_FIELD_MAX_LENGTH',
  FORM_FIELD_PATTERN: 'FORM_FIELD_PATTERN',
  FORM_FIELD_VALUE_NOT_IN_RANGE: 'FORM_FIELD_VALUE_NOT_IN_RANGE',
  FORM_FIELD_INVALID_VALUE: 'FORM_FIELD_INVALID_VALUE',
  FORM_FILE_UPLOADING: 'FORM_FILE_UPLOADING',
  ACCOUNT_EMAIL_ALREADY_EXISTS: 'ACCOUNT_EMAIL_ALREADY_EXISTS',
  INVALID_FILE_SIZE_TOO_BIG: 'INVALID_FILE_SIZE_TOO_BIG',
  INVALID_FILE_MIME_TYPE: 'INVALID_FILE_MIME_TYPE',
  JWT_EXPIRED: 'JWT_EXPIRED',
  TWO_FACTOR_AUTH_CANCELED: 'TWO_FACTOR_AUTH_CANCELED',
  'PM.Remove.HasActiveSubscriptions': 'PM.Remove.HasActiveSubscriptions',
  ...TRANSFERWISE_ERROR,
};

/**
 * An error generated under the Open Collective namespace.
 */
export class OCError extends Error {
  constructor(type, errorParams) {
    super();
    const { message, payload, hasI18nMessage } = errorParams || {};
    this.type = has(ERROR, type) ? ERROR[type] : ERROR.UNKNOWN;
    this.message = message;
    this.payload = payload;
    this.hasI18nMessage = Boolean(hasI18nMessage);
  }
}

export class ApiError extends Error {
  constructor(errorParams) {
    super();
    const { code, type, message } = errorParams || {};
    this.code = code;
    this.type = type;
    this.message = message;
  }
}

// ---- Helpers to manipulate errors ----

/**
 * Generate a standard error object.
 *
 * @param type: One of `ERROR`
 * @param errorParams {object}:
 *    - message: A default message for this error
 *    - payload: Any data you want to add to the error
 */
export const createError = (type, errorParams = undefined) => {
  return new OCError(type, errorParams);
};

/** Returns true if object is a valid OCError */
export const isOCError = error => {
  if (!error) {
    return false;
  } else if (error instanceof OCError) {
    return true;
  } else {
    // Accept objects if they have a valid error `type`
    return typeof error === 'object' && Boolean(error.type && ERROR[error.type]);
  }
};

/**
 * returns true if the error is of the given type.
 *
 * @param error {OCError}
 * @param errorType {ERROR}
 * @returns {boolean}
 */
export const isErrorType = (error, errorType) => {
  return isOCError(error) && error.type === errorType;
};

/**
 * A specialization of `createError` to generate "NOT_FOUND" errors.
 *
 * @param searchTerm: A term that will be used on the "Not found" page to trigger the search
 * @param return404Status: If true, an exception will be thrown on server-side to force the render of the 404 page
 * @returns {OCError}
 */
export const generateNotFoundError = searchTerm => {
  return createError(ERROR.NOT_FOUND, { payload: { searchTerm } });
};

/**
 * From a GraphQL error exception, returns an object like:
 *
 * @returns {OCError}
 */
export const getErrorFromGraphqlException = exception => {
  const firstGraphqlError = get(exception, 'graphQLErrors.0');
  if (firstGraphqlError) {
    let message = get(firstGraphqlError, 'message');
    let errorCode = get(firstGraphqlError, 'extensions.code');

    // Collective not found (the error for findBySlug is not typed)
    if (message?.startsWith('No collective found with slug')) {
      errorCode = ERROR.NOT_FOUND;
    }

    // Sequelize validation
    const sequelizeErrorMessage = get(firstGraphqlError, 'extensions.exception.errors[0].message');
    if (sequelizeErrorMessage) {
      message = `${message}: ${sequelizeErrorMessage}`;
    }
    return createError(errorCode, { message, payload: firstGraphqlError?.extensions });
  }
  // Handle networkError with error codes
  const httpErrorCode = get(exception, 'networkError.result.error.code');
  if (httpErrorCode) {
    return createError(ERROR.UNKNOWN, { message: get(exception, 'networkError.result.error.message') });
  }

  if (isError(exception) && (exception.networkError || exception.message.startsWith('Network'))) {
    return createError(ERROR.NETWORK, { message: exception.message });
  } else if (typeof exception === 'string') {
    // When throwing errors directly from API (`throw new Error('...')`)
    return createError(ERROR.UNKNOWN, { message: exception });
  } else if (exception && Object.hasOwn(exception, 'message')) {
    return createError(ERROR.UNKNOWN, { message: exception.message });
  } else {
    return createError();
  }
};

export const isNotFoundGraphQLException = exception => {
  return exception && isErrorType(getErrorFromGraphqlException(exception), ERROR.NOT_FOUND);
};

/**
 * getErrorFromGraphqlException + formatErrorMessage
 * @param {*} exception
 */
export const i18nGraphqlException = (intl, exception) => {
  return formatErrorMessage(intl, getErrorFromGraphqlException(exception));
};

/**
 * From an XMLHttpRequest returned by the PDF service (invoice service), returns a standard error.
 *
 * @returns {OCError}
 */
export const getErrorFromPdfService = exception => {
  // Invoice service is reached using an XMLHTTPRequest
  if (exception instanceof TypeError && exception.message === 'Network request failed') {
    return createError(ERROR.NETWORK);
  }

  // But if something wrong happens, it returns the error from GraphQL API
  return getErrorFromGraphqlException(exception);
};

/**
 * From an XMLHttpRequest returned by the image upload endpoint, returns a standard error.
 *
 * @returns {OCError}
 */
export const getErrorFromXhrUpload = exception => {
  if (exception instanceof TypeError && exception.message === 'Network request failed') {
    return createError(ERROR.NETWORK);
  } else if (exception?.json?.error) {
    const error = exception.json.error;
    switch (error.type) {
      case 'INVALID_FILE_SIZE_TOO_BIG':
        return createError(ERROR.INVALID_FILE_SIZE_TOO_BIG, { payload: error.data });
      case 'INVALID_FILE_MIME_TYPE':
        return createError(ERROR.INVALID_FILE_MIME_TYPE);
    }
  }

  // But if something wrong happens, it returns the error from GraphQL API
  return getErrorFromGraphqlException(exception);
};

// ---- Internationalization (i18n) ----

const msg = {
  ...defineMessages({
    [ERROR.UNKNOWN]: {
      id: 'Error.Unknown',
      defaultMessage: 'An unknown error occurred',
    },
    [ERROR.BAD_COLLECTIVE_TYPE]: {
      id: 'Error.BadCollectiveType',
      defaultMessage: 'This profile type is not supported',
    },
    [ERROR.NETWORK]: {
      id: 'Error.Network',
      defaultMessage: 'A network error occurred, please check your connectivity or try again later',
    },
    [ERROR.FORM_FIELD_MIN]: {
      id: 'FormError.min',
      defaultMessage: 'The value is too low',
    },
    [ERROR.FORM_FIELD_MAX]: {
      id: 'FormError.max',
      defaultMessage: 'The value is too high',
    },
    [ERROR.FORM_FIELD_REQUIRED]: {
      id: 'Error.FieldRequired',
      defaultMessage: 'This field is required',
    },
    [ERROR.FORM_FIELD_CHECK_REQUIRED]: {
      id: 'Error.FieldCheckRequired',
      defaultMessage: 'This must be checked',
    },
    [ERROR.FORM_FIELD_MIN_LENGTH]: {
      id: 'FormError.minLength',
      defaultMessage: 'The value is too short',
    },
    [ERROR.FORM_FIELD_MAX_LENGTH]: {
      id: 'FormError.maxLength',
      defaultMessage: 'The value is too long',
    },
    [ERROR.FORM_FIELD_PATTERN]: {
      id: 'FormError.pattern',
      defaultMessage: 'This value is not formatted properly',
    },
    [ERROR.FORM_FIELD_INVALID_VALUE]: {
      id: 'FormError.InvalidValue',
      defaultMessage: 'Invalid value',
    },
    [ERROR.FORM_FILE_UPLOADING]: {
      defaultMessage: 'The file is still uploading, please wait',
    },
    [ERROR.ACCOUNT_EMAIL_ALREADY_EXISTS]: {
      id: 'Error.AccountEmailAlreadyExists',
      defaultMessage: 'An account already exists for this email, please <SignInLink>sign in</SignInLink>.',
    },
    [ERROR.INVALID_FILE_SIZE_TOO_BIG]: {
      defaultMessage: 'The file is larger than the maximum allowed ({max})',
    },
    [ERROR.INVALID_FILE_MIME_TYPE]: {
      defaultMessage: 'The file type is invalid',
    },
    [ERROR.TWO_FACTOR_AUTH_CANCELED]: {
      defaultMessage: 'Two Factor Authentication Cancelled',
    },
    [ERROR.JWT_EXPIRED]: {
      defaultMessage: 'Your session has expired. Please sign-in again.',
    },
  }),
  ...transferwiseMsg,
};

export const formatErrorType = (intl, errorType) => {
  if (msg[errorType]) {
    return intl.formatMessage(msg[errorType], I18nFormatters);
  } else {
    return null;
  }
};

/**
 * Translate an error as returned to a human-readable, internationalized error message.
 *
 * @param {function} formatMessage react-intl's formatMessage
 * @param {FormError} error - as returned by `createError`
 */
export const formatErrorMessage = (intl, error, fallback = ERROR.UNKNOWN) => {
  if (typeof error === 'string') {
    return error;
  }
  // No error
  else if (!isOCError(error)) {
    return null;
  }

  // Known error
  if (error.type !== ERROR.UNKNOWN) {
    if (error.hasI18nMessage && error.message) {
      return error.message;
    } else if (msg[error.type]) {
      return intl.formatMessage(msg[error.type], { ...I18nFormatters, ...error.payload, ...error });
    }
  }

  // Won't be translated
  if (error.message) {
    return error.message;
  }

  // Fallback
  return intl.formatMessage(msg[fallback] || msg[ERROR.UNKNOWN]);
};

/**
 * An error that can safely be ignored by logging and reporting. Useful to trick
 * the behavior of libraries/frameworks like NextJS by throwing exceptions at them.
 */
export class IgnorableError extends Error {
  constructor(message, ...args) {
    super(message, ...args);
    this.message = `[Please ignore this error] ${message || ''}`;
  }
}
