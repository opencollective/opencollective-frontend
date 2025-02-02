import React from 'react';

import type { ExpenseForm } from '../useExpenseForm';

export function memoWithGetFormProps<T extends React.ComponentType, GetFormProps extends (form: ExpenseForm) => any>(
  Component: T,
  getFormProps: GetFormProps,
): React.MemoExoticComponent<T> & { getFormProps: GetFormProps } {
  const c = React.memo(Component);
  c['getFormProps'] = getFormProps;
  return c as React.MemoExoticComponent<T> & { getFormProps: GetFormProps };
}
