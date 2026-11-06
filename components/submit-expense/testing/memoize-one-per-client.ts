/**
 * `jest.mock('memoize-one', ...)` factory. The Expense form query is memoized at module level and
 * keyed on variables only, so results leak between hook instances (and between tests). This scopes
 * memoizations whose first argument is an Apollo client to that client.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const actual = jest.requireActual('memoize-one');
const memoizeOne = actual.default || actual;

// Loaded with `jest.requireActual` from `jest.mock` factories
// ts-unused-exports:disable-next-line
export const memoizeOnePerClientMock = {
  __esModule: true,
  default: (fn: (...args: any[]) => any, isEqual?: (a: any[], b: any[]) => boolean) =>
    isEqual
      ? memoizeOne(fn, (newArgs: any[], lastArgs: any[]) => newArgs[0] === lastArgs[0] && isEqual(newArgs, lastArgs))
      : memoizeOne(fn),
};
