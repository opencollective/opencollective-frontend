import { createError } from 'apollo-errors';

export const Unauthorized = createError('Unauthorized', {
  message: 'You are not authorized to perform this action'
});

export const ValidationFailed = createError('ValidationFailed', {
  message: 'Please verify the input data'
});

export const NotFound = createError('NotFound', {
  message: 'Item not found'
});
