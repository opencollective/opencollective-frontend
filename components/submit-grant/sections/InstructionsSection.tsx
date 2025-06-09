/* eslint-disable prefer-arrow-callback */
import React from 'react';
import { pick } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { ExpensePolicyContainer } from '@/components/submit-expense/form/ExpensePolicyContainer';
import { memoWithGetFormProps } from '@/components/submit-expense/form/helper';
import type { ExpenseForm } from '@/components/submit-expense/useExpenseForm';
import { Skeleton } from '@/components/ui/Skeleton';

type InstructionSectionProps = ReturnType<typeof getFormProps>;

function getFormProps(form: ExpenseForm) {
  return {
    initialLoading: form.initialLoading,
    setFieldValue: form.setFieldValue,
    ...pick(form.options, ['account', 'host']),
    ...pick(form.values, ['acknowledgedCollectiveGrantExpensePolicy', 'acknowledgedHostGrantExpensePolicy']),
  };
}

export const InstructionSection = memoWithGetFormProps(function InstructionSection(props: InstructionSectionProps) {
  if (props.initialLoading) {
    return <Skeleton className="h-12" />;
  }

  return (
    <React.Fragment>
      <div>
        {props.host?.slug !== props.account?.slug && props.host?.policies?.EXPENSE_POLICIES?.grantPolicy && (
          <div className="mt-4">
            <ExpensePolicyContainer
              title={<FormattedMessage defaultMessage="Host instructions to submit a grant request" id="4Yw/zi" />}
              policy={props.host?.policies?.EXPENSE_POLICIES?.grantPolicy}
              checked={props.acknowledgedHostGrantExpensePolicy}
              onAcknowledgedChanged={v => props.setFieldValue('acknowledgedHostGrantExpensePolicy', v)}
            />
          </div>
        )}

        {props.account?.policies?.EXPENSE_POLICIES?.grantPolicy && (
          <div className="mt-4">
            <ExpensePolicyContainer
              title={
                <FormattedMessage defaultMessage="Collective instructions to submit a grant request" id="BIYvoI" />
              }
              policy={props.account?.policies?.EXPENSE_POLICIES?.grantPolicy}
              checked={props.acknowledgedCollectiveGrantExpensePolicy}
              onAcknowledgedChanged={v => props.setFieldValue('acknowledgedCollectiveGrantExpensePolicy', v)}
            />
          </div>
        )}
      </div>
    </React.Fragment>
  );
}, getFormProps);
