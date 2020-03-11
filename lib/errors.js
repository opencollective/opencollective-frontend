import { ssrNotFoundError } from './nextjs_utils';

/** Defines error types */
export const ERROR = {
  UNKNOWN: 'UNKNOWN',
  NETWORK: 'NETWORK',
  NOT_FOUND: 'NOT_FOUND',
  BAD_COLLECTIVE_TYPE: 'BAD_COLLECTIVE_TYPE',
  PAYMENT_METHOD_HAS_ACTIVE_SUBSCRIPTIONS: 'PM.Remove.HasActiveSubscriptions',
};

/**
 * Generate a standard error object
 *
 * @param id: One of `ERROR`
 * @param message: A default message for this error
 * @param payload: Any data you want to add to the error
 */
export const generateError = (id, { message, payload }) => {
  return {
    id: id || ERROR.UNKNOWN,
    message: message || 'An unknown error occured',
    payload,
  };
};

/**
 * A specialization of `generateError` to generate "NOT_FOUND" errors
 * @param searchTerm: A term that will be used on the "Not found" page to trigger the search
 * @param return404Status: If true, an exception will be thrown on server-side to force the render of the 404 page
 */
export const generateNotFoundError = (searchTerm, return404Status = false) => {
  if (return404Status) {
    ssrNotFoundError();
  }

  return generateError(ERROR.NOT_FOUND, { payload: { searchTerm } });
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
