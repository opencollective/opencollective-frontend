import { createError } from 'apollo-errors';

export const Unauthorized = createError('Unauthorized', {
  message: 'You need to be authenticated to perform this action',
});

export const Forbidden = createError('Forbidden', {
  message: 'You are authenticated but forbidden to perform this action',
});

export const ValidationFailed = createError('ValidationFailed', {
  message: 'Please verify the input data',
});

export const NotFound = createError('NotFound', {
  message: 'Item not found',
});
