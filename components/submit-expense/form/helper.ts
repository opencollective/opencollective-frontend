import React from 'react';

import { ExpenseType } from '@/lib/graphql/types/v2/graphql';

import type { ExpenseForm } from '../useExpenseForm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memoWithGetFormProps<T extends React.ComponentType, GetFormProps extends (form: ExpenseForm) => any>(
  Component: T,
  getFormProps: GetFormProps,
): React.MemoExoticComponent<T> & { getFormProps: GetFormProps } {
  const c = React.memo(Component);
  c['getFormProps'] = getFormProps;
  return c as React.MemoExoticComponent<T> & { getFormProps: GetFormProps };
}

/**
 * A helper to check if at least one of the base expense types (INVOICE or RECEIPT) is supported
 */
export const supportsBaseExpenseTypes = (supportedExpenseTypes: ExpenseType[]) => {
  return (
    supportedExpenseTypes &&
    supportedExpenseTypes.some(type => type === ExpenseType.INVOICE || type === ExpenseType.RECEIPT)
  );
};
