import { createError } from 'apollo-errors';

export const Unauthorized = createError('Unauthorized', {
  message: 'You need to be authenticated to perform this action',
});

export const Forbidden = createError('Forbidden', {
  message: 'You are authenticated but forbidden to perform this action',
});

export const RateLimitExceeded = createError('RateLimitExceeded', {
  message: 'Rate limit exceeded',
});

export const ValidationFailed = createError('ValidationFailed', {
  message: 'Please verify the input data',
});

export const NotFound = createError('NotFound', {
  message: 'Item not found',
});

export const InvalidToken = createError('InvalidToken', {
  message: 'The provided token is not valid',
});

export const FeatureNotSupportedForCollective = createError('FeatureNotSupportedForCollective', {
  message: 'This feature is not supported by the Collective',
});

/** An error to throw when `canUseFeature` returns false (user is not allowed to use this) */
export const FeatureNotAllowedForUser = createError('FeatureNotAllowedForUser', {
  message: "You're not allowed to use this feature",
});
