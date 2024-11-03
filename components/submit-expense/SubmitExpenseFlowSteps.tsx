import React from 'react';
import { cva } from 'class-variance-authority';
import type { Path } from 'dot-path-value';
import { useFormikContext } from 'formik';
import { get, isEmpty } from 'lodash';
import type { IntlShape, MessageDescriptor } from 'react-intl';
import { defineMessage, FormattedMessage } from 'react-intl';

import { cn } from '../../lib/utils';

import type { ExpenseForm, ExpenseFormValues } from './useExpenseForm';

type SubmitExpenseFlowStepsProps = {
  className?: string;
  completedSteps?: Step[];
  activeStep: Step;
};

const stepListItemVariants = cva('', {
  variants: {
    itemType: {
      header:
        '[--step-bullet-border-color:#94A3B8] [--step-bullet-border-width:2px] [--step-bullet-border:2px] [--step-bullet-color:white] [--step-bullet-size:24px] [--step-bullet-text-color:#48566A] last:after:hidden',
      activeHeader:
        '[--step-bullet-border-color:#1547B8] [--step-bullet-border-width:2px] [--step-bullet-color:white] [--step-bullet-size:24px]',
      completedHeader:
        "[--step-bullet-border-color:#1547B8] [--step-bullet-border-width:2px] [--step-bullet-color:#1547B8] [--step-bullet-size:24px] [--step-bullet-text-color:white] before:content-['✓']",
      activeItem:
        '[--step-bullet-box-shadow:0_0_0_4px_hsla(216,_100%,_58%,_0.3)] [--step-bullet-color:#1547B8] [--step-text-color:#1547B8]',
      completedItem: '[--step-bullet-color:#1547B8]',
      item: '',
    },
  },
  defaultVariants: {
    itemType: 'item',
  },
});

export enum Step {
  WHO_IS_PAYING = 'WHO_IS_PAYING',
  WHO_IS_GETTING_PAID = 'WHO_IS_GETTING_PAID',
  PAYOUT_METHOD = 'PAYOUT_METHOD',
  TYPE_OF_EXPENSE = 'TYPE_OF_EXPENSE',
  EXPENSE_CATEGORY = 'EXPENSE_CATEGORY',
  EXPENSE_ITEMS = 'EXPENSE_ITEMS',
  EXPENSE_TITLE = 'EXPENSE_TITLE',
  SUMMARY = 'SUMMARY',
}

const StepValues: Record<Step, Path<ExpenseFormValues>[]> = {
  [Step.WHO_IS_PAYING]: ['accountSlug'],
  [Step.WHO_IS_GETTING_PAID]: ['payeeSlug', 'inviteeNewIndividual', 'inviteeNewOrganization'],
  [Step.PAYOUT_METHOD]: ['payoutMethodId', 'newPayoutMethod', 'payoutMethodNameDiscrepancyReason'],
  [Step.TYPE_OF_EXPENSE]: [
    'expenseTypeOption',
    'acknowledgedCollectiveInvoiceExpensePolicy',
    'acknowledgedCollectiveReceiptExpensePolicy',
    'acknowledgedHostInvoiceExpensePolicy',
    'acknowledgedHostReceiptExpensePolicy',
    'invoiceFile',
    'invoiceNumber',
  ],
  [Step.EXPENSE_CATEGORY]: ['accountingCategoryId'],
  [Step.EXPENSE_ITEMS]: ['expenseItems'],
  [Step.EXPENSE_TITLE]: ['title', 'acknowledgedCollectiveTitleExpensePolicy', 'acknowledgedHostTitleExpensePolicy'],
  [Step.SUMMARY]: [],
};

export const StepTitles: Record<Step, MessageDescriptor> = {
  [Step.WHO_IS_PAYING]: defineMessage({
    defaultMessage: 'Who is paying',
    id: 'NpMPF+',
  }),
  [Step.WHO_IS_GETTING_PAID]: defineMessage({
    defaultMessage: 'Who is getting paid?',
    id: 'W5Z+Fm',
  }),
  [Step.PAYOUT_METHOD]: defineMessage({
    defaultMessage: 'Payout Method',
    id: 'SecurityScope.PayoutMethod',
  }),
  [Step.TYPE_OF_EXPENSE]: defineMessage({
    defaultMessage: 'Type of expense',
    id: 'qftRxm',
  }),
  [Step.EXPENSE_CATEGORY]: defineMessage({
    defaultMessage: 'Expense Category',
    id: '38dzz9',
  }),
  [Step.EXPENSE_ITEMS]: defineMessage({
    defaultMessage: 'Expense items',
    id: '3ldWIL',
  }),
  [Step.EXPENSE_TITLE]: defineMessage({
    defaultMessage: 'Expense Title',
    id: 'E0WDTk',
  }),
  [Step.SUMMARY]: defineMessage({
    defaultMessage: 'Summary',
    id: 'Summary',
  }),
};

export const StepSubtitles: Partial<Record<Step, MessageDescriptor>> = {
  [Step.PAYOUT_METHOD]: defineMessage({
    defaultMessage: 'Where do you want to receive the money',
    id: 'CNCPij',
  }),
  [Step.WHO_IS_GETTING_PAID]: defineMessage({
    defaultMessage: 'Select the profile of the recipient who needs to be paid',
    id: 'hVAL2P',
  }),
  [Step.WHO_IS_PAYING]: defineMessage({
    defaultMessage: 'Select the profile whom you are requesting money from',
    id: 'nt19l4',
  }),
};

function isExpenseFormStepCompleted(form: ExpenseForm, step: Step): boolean {
  const valueKeys = StepValues[step];
  if (isEmpty(valueKeys)) {
    return true;
  }
  return valueKeys.map(valueKey => isEmpty(get(form.errors, valueKey))).every(Boolean);
}

export function expenseFormStepError(intl: IntlShape, form: ExpenseForm, step: Step): string {
  if (expenseFormStepHasError(form, step) && isExpenseFormStepTouched(form, step) && form.submitCount > 0) {
    return intl.formatMessage({ defaultMessage: 'Required', id: 'Seanpx' });
  }

  return null;
}

export function expenseFormStepHasError(form: ExpenseForm, step: Step): boolean {
  return !isExpenseFormStepCompleted(form, step);
}

function isExpenseFormStepTouched(form: ExpenseForm, step: Step): boolean {
  const valueKeys = StepValues[step];
  if (isEmpty(valueKeys)) {
    return true;
  }
  return valueKeys.map(valueKey => get(form.touched, valueKey)).some(Boolean);
}

export function SubmitExpenseFlowSteps(props: SubmitExpenseFlowStepsProps) {
  const form = useFormikContext() as ExpenseForm;
  const hasErrors = Object.values(Step).some(step => expenseFormStepHasError(form, step));

  const stepOrder = [
    Step.WHO_IS_PAYING,
    Step.WHO_IS_GETTING_PAID,
    Step.PAYOUT_METHOD,
    Step.TYPE_OF_EXPENSE,
    Step.EXPENSE_CATEGORY,
    Step.EXPENSE_ITEMS,
    Step.EXPENSE_TITLE,
  ];

  return (
    <div className={cn(props.className)}>
      <ol className="pl-[12px] [--step-bullet-border-color:#CBD5E1] [--step-bullet-border-width:0px] [--step-bullet-color:#CBD5E1] [--step-bullet-size:8px] [--step-line-color:#E1E7EF] [--step-text-color:#344256] *:relative *:flex *:items-center *:gap-2 *:pb-8 *:pl-7 *:text-base *:font-bold *:text-[var(--step-text-color)] *:before:absolute *:before:left-0 *:before:inline-block *:before:h-[var(--step-bullet-size)] *:before:w-[var(--step-bullet-size)] *:before:-translate-x-[calc(var(--step-bullet-size)/2)] *:before:rounded-full *:before:border-[var(--step-bullet-border-color)] *:before:bg-[--step-bullet-color] *:before:text-center *:before:text-sm *:before:font-medium *:before:text-[var(--step-bullet-text-color,var(--step-bullet-border-color))] *:before:[border-width:var(--step-bullet-border-width)] *:before:[box-shadow:var(--step-bullet-box-shadow,initial)] *:after:absolute *:after:left-0 *:after:top-2 *:after:-z-10 *:after:h-full *:after:-translate-x-[1px] *:after:border-l-2 *:after:border-[--step-line-color] *:after:[border-style:var(--step-line-style,solid)]">
        <li
          className={cn(
            "before:content-['1']",
            stepListItemVariants({
              itemType: props.activeStep === Step.SUMMARY ? (hasErrors ? 'header' : 'completedHeader') : 'activeHeader',
            }),
          )}
        >
          Expense Details
        </li>
        {(props.activeStep !== Step.SUMMARY || hasErrors) &&
          stepOrder.map(step => (
            <li
              key={step}
              className={cn(
                stepListItemVariants({
                  itemType:
                    props.activeStep === step
                      ? 'activeItem'
                      : isExpenseFormStepCompleted(form, step)
                        ? 'completedItem'
                        : 'item',
                }),
              )}
            >
              <FormattedMessage {...StepTitles[step]} />
            </li>
          ))}
        <li
          className={cn(
            "[--step-line-style:none] before:content-['2']",
            stepListItemVariants({ itemType: props.activeStep === Step.SUMMARY ? 'activeHeader' : 'header' }),
          )}
        >
          Summary
        </li>
      </ol>
    </div>
  );
}
