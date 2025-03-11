/* eslint-disable prefer-arrow-callback */
import React from 'react';
import { pick } from 'lodash';

import { ExpenseAccountItem } from '@/components/submit-expense/form/ExpenseAccountItem';
import { memoWithGetFormProps } from '@/components/submit-expense/form/helper';
import type { ExpenseForm } from '@/components/submit-expense/useExpenseForm';
import { Skeleton } from '@/components/ui/Skeleton';

type GrantProviderSectionProps = ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    initialLoading: form.initialLoading,
    ...pick(form.options, 'account'),
  };
}

export const GrantProviderSection = memoWithGetFormProps(function GrantProviderSection(
  props: GrantProviderSectionProps,
) {
  if (props.initialLoading) {
    return <Skeleton />;
  }
  return <ExpenseAccountItem account={props.account} />;
}, getFormProps);
