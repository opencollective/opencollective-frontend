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
import { get, has, isError } from 'lodash-es';
import { defineMessages, type IntlShape, type MessageDescriptor } from 'react-intl';

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
  // Reserved, not currently raised: its message is the "an account already exists, please sign in"
  // copy that the account-enumeration work will need. Kept deliberately so the existing
  // translations in lang/*.json are not discarded - remove it only if that work lands elsewhere.
  ACCOUNT_EMAIL_ALREADY_EXISTS: 'ACCOUNT_EMAIL_ALREADY_EXISTS',
  INVALID_FILE_SIZE_TOO_BIG: 'INVALID_FILE_SIZE_TOO_BIG',
  INVALID_FILE_MIME_TYPE: 'INVALID_FILE_MIME_TYPE',
  JWT_EXPIRED: 'JWT_EXPIRED',
  TWO_FACTOR_AUTH_CANCELED: 'TWO_FACTOR_AUTH_CANCELED',
  SLUG_NOT_ALLOWED: 'SLUG_NOT_ALLOWED',
  SLUG_USED: 'SLUG_USED',
  'PM.Remove.HasActiveSubscriptions': 'PM.Remove.HasActiveSubscriptions',
  INVALID_OTP: 'INVALID_OTP',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_EMAIL: 'INVALID_EMAIL',
  EMAIL_SEND_ERROR: 'EMAIL_SEND_ERROR',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  CAPTCHA_REQUIRED: 'CAPTCHA_REQUIRED',
  ...TRANSFERWISE_ERROR,
};

/** Arbitrary data attached to an error (GraphQL extensions, upload failure details...). */
type OCErrorPayload = {
  code?: string;
  searchTerm?: string;
  [key: string]: unknown;
};

type OCErrorParams = {
  message?: string;
  payload?: OCErrorPayload;
  hasI18nMessage?: boolean;
};

/**
 * An error generated under the Open Collective namespace.
 */
export class OCError extends Error {
  type: string;
  payload?: OCErrorPayload;
  hasI18nMessage: boolean;

  constructor(type: string, errorParams?: OCErrorParams) {
    super();
    const message = errorParams?.message;
    const payload = errorParams?.payload;
    const hasI18nMessage = errorParams?.hasI18nMessage;
    const errorType: string = has(ERROR, type) ? (ERROR as Record<string, string>)[type] : ERROR.UNKNOWN;
    this.type = errorType;
    this.message = message;
    this.payload = payload;
    this.hasI18nMessage = Boolean(hasI18nMessage);
  }
}

type ApiErrorParams = {
  code?: string;
  type?: string;
  message?: string;
};

export class ApiError extends Error {
  code?: string;
  type?: string;

  constructor(errorParams?: ApiErrorParams) {
    super();
    const code = errorParams?.code;
    const type = errorParams?.type;
    const message = errorParams?.message;
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
export const createError = (type?: string, errorParams: OCErrorParams = undefined): OCError => {
  return new OCError(type, errorParams);
};

/** Returns true if object is a valid OCError */
export const isOCError = (error: unknown): error is OCError => {
  if (!error) {
    return false;
  } else if (error instanceof OCError) {
    return true;
  } else {
    // Accept objects if they have a valid error `type`
    const type = get(error, 'type');
    return typeof error === 'object' && Boolean(type && ERROR[type]);
  }
};

export const getErrorTypeFromHTTPCode = (code: number): string => {
  switch (code) {
    case 404:
      return ERROR.NOT_FOUND;
    default:
      return ERROR.UNKNOWN;
  }
};

/**
 * returns true if the error is of the given type.
 *
 * @param error {OCError}
 * @param errorType {ERROR}
 * @returns {boolean}
 */
export const isErrorType = (error: unknown = undefined, errorType: string = undefined): boolean => {
  return isOCError(error) && error.type === errorType;
};

/**
 * A specialization of `createError` to generate "NOT_FOUND" errors.
 *
 * @param searchTerm: A term that will be used on the "Not found" page to trigger the search
 * @param return404Status: If true, an exception will be thrown on server-side to force the render of the 404 page
 * @returns {OCError}
 */
export const generateNotFoundError = (searchTerm: string = undefined): OCError => {
  return createError(ERROR.NOT_FOUND, { payload: { searchTerm } });
};

/**
 * From a GraphQL error exception, returns an object like:
 *
 * @returns {OCError}
 */
export const getErrorFromGraphqlException = (exception: unknown = undefined): OCError => {
  const firstGraphqlError: { message?: string; extensions?: OCErrorPayload } = get(exception, 'graphQLErrors.0');
  let message: string = get(firstGraphqlError, 'message');
  let errorCode: string = get(firstGraphqlError, 'extensions.code');
  if (firstGraphqlError) {
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

  if (isError(exception) && (get(exception, 'networkError') || exception.message.startsWith('Network'))) {
    return createError(ERROR.NETWORK, { message: exception.message });
  } else if (typeof exception === 'string') {
    // When throwing errors directly from API (`throw new Error('...')`)
    return createError(ERROR.UNKNOWN, { message: exception });
  } else if (exception && Object.hasOwn(exception as object, 'message')) {
    return createError(errorCode || ERROR.UNKNOWN, { message: get(exception, 'message') });
  } else {
    return createError();
  }
};

export const isNotFoundGraphQLException = (exception: unknown = undefined): boolean => {
  return Boolean(exception && isErrorType(getErrorFromGraphqlException(exception), ERROR.NOT_FOUND));
};

/**
 * getErrorFromGraphqlException + formatErrorMessage
 * @param {*} exception
 */
export const i18nGraphqlException = (intl: IntlShape, exception: unknown = undefined): string | null => {
  return formatErrorMessage(intl, getErrorFromGraphqlException(exception));
};

/**
 * From an XMLHttpRequest returned by the PDF service (invoice service), returns a standard error.
 *
 * @returns {OCError}
 */
export const getErrorFromPdfService = (exception: unknown): OCError => {
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
export const getErrorFromXhrUpload = (exception: unknown): OCError => {
  if (exception instanceof TypeError && exception.message === 'Network request failed') {
    return createError(ERROR.NETWORK);
  } else if (get(exception, 'json.error')) {
    const error: { type?: string; data?: OCErrorPayload } = get(exception, 'json.error');
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

const msg: Record<string, MessageDescriptor> = {
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
      id: 'k8RfQ/',
    },
    [ERROR.ACCOUNT_EMAIL_ALREADY_EXISTS]: {
      id: 'Error.AccountEmailAlreadyExists',
      defaultMessage: 'An account already exists for this email, please <SignInLink>sign in</SignInLink>.',
    },
    [ERROR.INVALID_FILE_SIZE_TOO_BIG]: {
      defaultMessage: 'The file is larger than the maximum allowed ({max})',
      id: '9EFQ9C',
    },
    [ERROR.INVALID_FILE_MIME_TYPE]: {
      defaultMessage: 'The file type is invalid',
      id: 'X482Yd',
    },
    [ERROR.TWO_FACTOR_AUTH_CANCELED]: {
      defaultMessage: 'Two Factor Authentication Cancelled',
      id: 'WAUPIM',
    },
    [ERROR.JWT_EXPIRED]: {
      defaultMessage: 'Your session has expired. Please sign-in again.',
      id: 'Dtil7S',
    },
    [ERROR.SLUG_NOT_ALLOWED]: {
      id: 'Error.SlugNotAllowed',
      defaultMessage: 'This slug is not allowed.',
    },
    [ERROR.SLUG_USED]: {
      id: 'Error.SlugUsed',
      defaultMessage: 'This slug is already used. Please choose another one.',
    },
    [ERROR.INVALID_OTP]: {
      id: 'Error.InvalidOTP',
      defaultMessage: 'The OTP code is invalid or has expired.',
    },
    [ERROR.RATE_LIMIT_EXCEEDED]: {
      id: 'Error.RateLimitExceeded',
      defaultMessage: 'Rate limit exceeded. Please try again later.',
    },
    [ERROR.INVALID_EMAIL]: {
      id: 'Error.InvalidEmail',
      defaultMessage: 'Invalid email address.',
    },
    [ERROR.EMAIL_SEND_ERROR]: {
      id: 'Error.EmailSendError',
      defaultMessage: 'An error occurred while sending the email. Please try again later.',
    },
    [ERROR.USER_ALREADY_EXISTS]: {
      id: 'Error.UserAlreadyExists',
      defaultMessage: 'A user with this email already exists.',
    },
    [ERROR.CAPTCHA_REQUIRED]: {
      id: 'Error.CaptchaRequired',
      defaultMessage: 'Captcha verification is required.',
    },
  }),
  ...transferwiseMsg,
};

export const formatErrorType = (intl: IntlShape = undefined, errorType: string = undefined): string | null => {
  if (msg[errorType]) {
    // Rich-text messages make `formatMessage` return `ReactNode[]`; error messages are consumed as strings.
    return intl.formatMessage(msg[errorType], I18nFormatters as never);
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
export const formatErrorMessage = (
  intl: IntlShape = undefined,
  error = undefined,
  fallback = ERROR.UNKNOWN,
): string | null => {
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
      // `formatMessage` only reads the keys its message references; `payload`/`cause` are not intl values.
      return intl.formatMessage(msg[error.type], { ...I18nFormatters, ...error.payload, ...error } as never);
    }
  } else if (error.payload?.code && msg[error.payload.code]) {
    // If the error has a payload with a code, we can use that to format the message
    return intl.formatMessage(msg[error.payload.code], { ...I18nFormatters, ...error.payload } as never);
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
  constructor(message?: string, ...args: [ErrorOptions?]) {
    super(message, ...args);
    this.message = `[Please ignore this error] ${message || ''}`;
  }
}
