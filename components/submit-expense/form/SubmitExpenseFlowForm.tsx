import React from 'react';

import { cn } from '../../../lib/utils';

import { Button } from '../../ui/Button';
import type { ExpenseForm } from '../useExpenseForm';

import { AdditionalDetailsSection } from './AdditionalDetailsSection';
import { ExpenseCategorySection } from './ExpenseCategorySection';
import { ExpenseItemsSection } from './ExpenseItemsSection';
import {
  ExpenseFormSchema,
  FormContext,
  FormHandler,
  InviteeAccountType,
  WhoIsGettingPaidOption,
  WhoIsPayingOption,
} from './experiment';
import { PayoutMethodSection } from './PayoutMethodSection';
import { SummarySection } from './SummarySection';
import { TypeOfExpenseSection } from './TypeOfExpenseSection';
import { WhoIsGettingPaidSection } from './WhoIsGettingPaidSection';
import { WhoIsPayingSection } from './WhoIsPayingSection';

type SubmitExpenseFlowFormProps = {
  form: ExpenseForm;
  className?: string;
  onVisibleSectionChange: (sectionId: string) => void;
  onNextClick: () => void;
};

export function SubmitExpenseFlowForm(props: SubmitExpenseFlowFormProps) {
  const formHandler = React.useRef(
    new FormHandler(ExpenseFormSchema, {
      defaultValues: {
        whoIsPayingOption: WhoIsPayingOption.LAST_SUBMITTED,
        whoIsGettingPaidOption: WhoIsGettingPaidOption.MY_PROFILES,
        inviteeAccountType: InviteeAccountType.INDIVIDUAL,
        expenseItems: [
          {
            formId: new Date().getTime(),
            description: '',
            amount: 0,
            currency: 'USD',
            date: new Date().toISOString(),
            attachment: '',
          },
        ],
        additionalAttachments: [],
      },
    }),
  );

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
    <FormContext.Provider value={formHandler.current}>
      <div className={cn('flex flex-col gap-8 pb-28', props.className)}>
        <WhoIsPayingSection inViewChange={onInViewChange} form={props.form} />
        <WhoIsGettingPaidSection inViewChange={onInViewChange} form={props.form} />
        <PayoutMethodSection inViewChange={onInViewChange} form={props.form} />
        <TypeOfExpenseSection inViewChange={onInViewChange} form={props.form} />
        <ExpenseCategorySection inViewChange={onInViewChange} form={props.form} />
        <ExpenseItemsSection inViewChange={onInViewChange} form={props.form} />
        <AdditionalDetailsSection inViewChange={onInViewChange} form={props.form} />
        <SummarySection inViewChange={onInViewChange} form={props.form} />
        <div className="flex justify-end">
          <Button onClick={props.onNextClick}>Next</Button>
        </div>
      </div>
    </FormContext.Provider>
  );
}

