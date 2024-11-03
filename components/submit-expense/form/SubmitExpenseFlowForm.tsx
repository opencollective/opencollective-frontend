import React from 'react';
import { useFormikContext } from 'formik';

import { cn } from '../../../lib/utils';

import { Button } from '../../ui/Button';
import type { ExpenseForm } from '../useExpenseForm';

import { AdditionalDetailsSection } from './AdditionalDetailsSection';
import { ExpenseCategorySection } from './ExpenseCategorySection';
import { ExpenseItemsSection } from './ExpenseItemsSection';
import { PayoutMethodSection } from './PayoutMethodSection';
import { SummarySection } from './SummarySection';
import { TypeOfExpenseSection } from './TypeOfExpenseSection';
import { WhoIsGettingPaidSection } from './WhoIsGettingPaidSection';
import { WhoIsPayingSection } from './WhoIsPayingSection';

type SubmitExpenseFlowFormProps = {
  className?: string;
  onVisibleSectionChange: (sectionId: string) => void;
  onNextClick: () => void;
};

export function SubmitExpenseFlowForm(props: SubmitExpenseFlowFormProps) {
  const form = useFormikContext() as ExpenseForm;

  const { onVisibleSectionChange } = props;
  const onInViewChange = React.useCallback(
    (visible, entry) => {
      if (visible) {
        onVisibleSectionChange(entry.target.id);
      }
    },
    [onVisibleSectionChange],
  );

  return (
    <div className={cn('flex flex-col gap-8 pb-28', props.className)}>
      <WhoIsPayingSection inViewChange={onInViewChange} form={form} />
      <WhoIsGettingPaidSection inViewChange={onInViewChange} form={form} />
      <PayoutMethodSection inViewChange={onInViewChange} form={form} />
      <TypeOfExpenseSection inViewChange={onInViewChange} form={form} />
      {form.options.accountingCategories?.length > 0 && (
        <ExpenseCategorySection inViewChange={onInViewChange} form={form} />
      )}
      <ExpenseItemsSection inViewChange={onInViewChange} form={form} />
      <AdditionalDetailsSection inViewChange={onInViewChange} form={form} />
      <SummarySection inViewChange={onInViewChange} form={form} />
      <div className="flex justify-end">
        <Button disabled={form.initialLoading} onClick={() => form.handleSubmit()}>
          Submit Expense
        </Button>
      </div>
    </div>
  );
}
