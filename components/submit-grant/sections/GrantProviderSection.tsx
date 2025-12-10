/* eslint-disable prefer-arrow-callback */
import React from 'react';
import { pick } from 'lodash';
import { AlertCircle } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { ExpenseAccountItem } from '@/components/submit-expense/form/ExpenseAccountItem';
import { memoWithGetFormProps } from '@/components/submit-expense/form/helper';
import type { ExpenseForm } from '@/components/submit-expense/useExpenseForm';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';

type GrantProviderSectionProps = ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    initialLoading: form.initialLoading,
    ...pick(form.options, 'account'),
    expenseTypeOptionError: form.errors.expenseTypeOption,
  };
}

export const GrantProviderSection = memoWithGetFormProps(function GrantProviderSection(
  props: GrantProviderSectionProps,
) {
  if (props.initialLoading) {
    return <Skeleton className="h-12" />;
  }

  return (
    <div>
      <ExpenseAccountItem account={props.account} />
      {props.expenseTypeOptionError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            <AlertCircle className="inline-block align-text-bottom" size={16} />
            &nbsp;
            <FormattedMessage defaultMessage="Grant request is not supported for this account." id="w5tdiG" />
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}, getFormProps);
