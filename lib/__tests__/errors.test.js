import { createIntl } from 'react-intl';
import { createError, ERROR, isErrorType, getErrorFromGraphqlException, formatErrorMessage } from '../errors';

describe('lib/errors', () => {
  describe('createError', () => {
    it('creates an error with the given type and default message', () => {
      const error = createError(ERROR.BAD_COLLECTIVE_TYPE, {
        message: 'Default test message',
        payload: { any: { content: 'you want' } },
      });

      expect(error.type).toBe(ERROR.BAD_COLLECTIVE_TYPE);
      expect(error.message).toBe('Default test message');
      expect(error.payload).toEqual({ any: { content: 'you want' } });
    });

    it('creates an unknown error for unknown types', () => {
      const error = createError('-- ❌️ Not a real type ❌️ --');
      expect(error.type).toBe(ERROR.UNKNOWN);
    });
  });

  describe('isErrorType', () => {
    it('returns false if not an error', () => {
      expect(isErrorType()).toBe(false);
      expect(isErrorType(false, ERROR.BAD_COLLECTIVE_TYPE)).toBe(false);
      expect(isErrorType(null, ERROR.BAD_COLLECTIVE_TYPE)).toBe(false);
      expect(isErrorType('', ERROR.BAD_COLLECTIVE_TYPE)).toBe(false);
      expect(isErrorType(new Error(), ERROR.BAD_COLLECTIVE_TYPE)).toBe(false);
      expect(isErrorType(new Error())).toBe(false);
    });

    it('returns wether error is the same type or not', () => {
      const error = createError(ERROR.BAD_COLLECTIVE_TYPE);
      expect(isErrorType(error, ERROR.BAD_COLLECTIVE_TYPE)).toBe(true);
      expect(isErrorType(error, ERROR.FORM_FIELD_MAX)).toBe(false);
    });
  });

  describe('getErrorFromGraphqlException', () => {
    it('returns an unknown error if no data is available', () => {
      expect(getErrorFromGraphqlException().type).toBe(ERROR.UNKNOWN);
      expect(getErrorFromGraphqlException({ graphQLErrors: [] }).type).toBe(ERROR.UNKNOWN);
      expect(getErrorFromGraphqlException({ networkError: { result: { errors: [] } } }).type).toBe(ERROR.UNKNOWN);
    });

    it('returns a proper error from data.errorID', () => {
      expect(
        getErrorFromGraphqlException({ graphQLErrors: [{ data: { errorId: ERROR.BAD_COLLECTIVE_TYPE } }] }).type,
      ).toBe(ERROR.BAD_COLLECTIVE_TYPE);
    });

    it('retrieves the message from the first error (known or unknown)', () => {
      expect(
        getErrorFromGraphqlException({
          graphQLErrors: [{ message: 'The custom message' }],
        }).message,
      ).toBe('The custom message');

      expect(
        getErrorFromGraphqlException({
          graphQLErrors: [{ data: { errorId: ERROR.BAD_COLLECTIVE_TYPE }, message: 'The custom message' }],
        }).message,
      ).toBe('The custom message');
    });
  });

  describe('', () => {
    it('returns null if not an OCError', () => {
      expect(formatErrorMessage()).toBe(null);
      expect(formatErrorMessage('')).toBe(null);
      expect(formatErrorMessage(false)).toBe(null);
      expect(formatErrorMessage(new Error())).toBe(null);
    });

    it('Has fallback messages', () => {
      const intl = createIntl({ locale: 'en' });
      let error = createError(ERROR.UNKNOWN, { message: 'Test!' });

      // Fallsback on message
      expect(formatErrorMessage(intl, error)).toBe('Test!');

      // Generic error
      error = createError(ERROR.UNKNOWN);
      error.type = 'Not a real error, to fool formatErrorMessage!';
      expect(formatErrorMessage(intl, error)).toBe('An unknown error occured');
    });

    it('Translates error', () => {
      const intl = createIntl({ locale: 'en' });
      const error = createError(ERROR.BAD_COLLECTIVE_TYPE);
      expect(formatErrorMessage(intl, error)).toBe('This profile type is not supported');
    });
  });
});
