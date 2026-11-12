import React from 'react';
import { useFormikContext } from 'formik';
import { isEmpty, startCase } from 'lodash-es';
import type { MessageDescriptor } from 'react-intl';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';

import { cn } from '../../lib/utils';
import {
  EXPENSE_FLOW_STEPS,
  ExpenseStep as Step,
  getFirstIncompleteStep,
  getVisibleSteps,
  isStepComplete,
  isStepTouched,
} from './lib/form-steps';

import { useToast } from '../ui/useToast';

import type { ExpenseForm } from './useExpenseForm';

type SubmitExpenseFlowStepsProps = {
  className?: string;
  completedSteps?: Step[];
  activeStep: Step;
};

export { ExpenseStep as Step } from './lib/form-steps';

export const StepTitles: Record<Step, MessageDescriptor> = {
  [Step.INVITE_WELCOME]: defineMessage({
    defaultMessage: 'Invitation',
    id: 'GM/hd6',
  }),
  [Step.WHO_IS_PAYING]: defineMessage({
    defaultMessage: 'Who is paying',
    id: 'NpMPF+',
  }),
  [Step.WHO_IS_GETTING_PAID]: defineMessage({
    defaultMessage: 'Who is getting paid',
    id: 'nCANDg',
  }),
  [Step.PAYOUT_METHOD]: defineMessage({
    defaultMessage: 'Payout Method',
    id: 'PayoutMethod',
  }),
  [Step.TYPE_OF_EXPENSE]: defineMessage({
    defaultMessage: 'Type',
    id: '+U6ozc',
  }),
  [Step.EXPENSE_CATEGORY]: defineMessage({
    defaultMessage: 'Category',
    id: 'expense.accountingCategory',
  }),
  [Step.EXPENSE_ITEMS]: defineMessage({
    defaultMessage: 'Expense items',
    id: '3ldWIL',
  }),
  [Step.ADDITIONAL_DETAILS]: defineMessage({
    defaultMessage: 'Additional details',
    id: '9YDDtr',
  }),
  [Step.SUMMARY]: defineMessage({
    defaultMessage: 'Summary',
    id: 'Summary',
  }),
};

const StepSubtitles: Partial<Record<Step, MessageDescriptor>> = {
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

/** The title and subtitle of the section of an Expense step */
export function getExpenseStepHeading(step: Step): { title: React.ReactNode; subtitle?: React.ReactNode } {
  return {
    title: <FormattedMessage {...StepTitles[step]} />,
    subtitle: StepSubtitles[step] && <FormattedMessage {...StepSubtitles[step]} />,
  };
}

/**
 * Step navigation component that manages form progress and validation.
 *
 * Handles auto-scroll to first incomplete section on form submission,
 * displays step indicators with error states, and manages step completion status.
 *
 * @param props Component props including active step and completion state
 */
export function SubmitExpenseFlowSteps(props: SubmitExpenseFlowStepsProps) {
  const form = useFormikContext() as ExpenseForm;
  const hasErrors = EXPENSE_FLOW_STEPS.some(step => !isStepComplete(step, form));
  const { toast } = useToast();
  const intl = useIntl();

  // The welcome and summary steps are not listed
  const listedSteps = getVisibleSteps(EXPENSE_FLOW_STEPS, form.options).filter(
    step => step.id !== Step.INVITE_WELCOME && step.id !== Step.SUMMARY,
  );
  const firstIncompleteIdx = listedSteps.findIndex(step => !isStepComplete(step, form));

  // Scroll to first step with error
  const firstIncompleteSection = getFirstIncompleteStep(EXPENSE_FLOW_STEPS, form)?.id;
  const submitCount = form.submitCount;

  /**
   * Auto-scroll to first incomplete section on form submission.
   * Falls back to toast notification if errors can't be mapped to steps.
   */
  React.useEffect(() => {
    if (submitCount > 0) {
      if (firstIncompleteSection) {
        document.querySelector(`#${firstIncompleteSection}`)?.scrollIntoView({ behavior: 'smooth' });
      } else if (!hasErrors && !isEmpty(form.errors)) {
        // If we can't scroll to the error (the fields are missing from the steps), we add a toast instead
        toast({
          variant: 'error',
          title: intl.formatMessage({ defaultMessage: 'Form validation failed', id: 'Wb0E1r' }),
          message: intl.formatMessage(
            { defaultMessage: 'The following fields are missing: {fields}.', id: '16YGxq' },
            { fields: Object.keys(form.errors).map(key => startCase(key)) },
          ),
        });
      }
    }
  }, [hasErrors, firstIncompleteSection, submitCount]);

  return (
    <div className={cn(props.className)}>
      <ol className="pl-[12px] text-sm">
        <StepHeader
          isActive={props.activeStep !== Step.SUMMARY}
          isComplete={!hasErrors}
          hasError={hasErrors && form.submitCount > 0}
          stepNumber={1}
          isCompletedPath
        >
          <FormattedMessage defaultMessage="Expense Details" id="+5Kafe" />
        </StepHeader>
        {(props.activeStep !== Step.SUMMARY || hasErrors) &&
          listedSteps.map((step, i) => (
            <StepItem
              key={step.id}
              isActive={props.activeStep === step.id}
              hasError={!isStepComplete(step, form) && isStepTouched(step, form) && form.submitCount > 0}
              isComplete={isStepComplete(step, form)}
              isCompletedPath={i < firstIncompleteIdx - 1 || firstIncompleteIdx < 0}
            >
              <FormattedMessage {...StepTitles[step.id]} />
            </StepItem>
          ))}
        <StepHeader isActive={props.activeStep === Step.SUMMARY} stepNumber={2}>
          <FormattedMessage defaultMessage="Summary" id="Summary" />
        </StepHeader>
      </ol>
    </div>
  );
}

type StepProps = {
  isActive?: boolean;
  hasError?: boolean;
  isComplete?: boolean;
  isCompletedPath?: boolean;
  children?: React.ReactNode;
};

export function StepHeader(props: StepProps & { stepNumber: number }) {
  return (
    <li
      className={cn(
        'relative flex items-center gap-2 pb-8 pl-7 font-bold before:absolute before:left-0 before:inline-block before:h-6 before:w-6 before:-translate-x-3 before:rounded-full before:border-2 before:border-[#94A3B8] before:bg-white before:text-center after:absolute after:top-2 after:left-0 after:-z-10 after:h-full after:-translate-x-[1px] after:border-l-2 after:border-solid last:after:hidden',
        {
          'before:border-blue-900': props.isActive,
          "before:border-blue-900 before:bg-blue-900 before:text-white before:content-['✓']":
            props.isComplete && !props.isActive,
          'after:border-blue-900': props.isCompletedPath,
        },
      )}
    >
      {props.children}
      {(!props.isComplete || props.isActive) && (
        <div
          className={cn('absolute left-0 flex h-6 w-6 -translate-x-3 items-center justify-center text-[#94A3B8]', {
            'text-blue-900': props.isActive,
          })}
        >
          {props.stepNumber}
        </div>
      )}
    </li>
  );
}

export function StepItem(props: StepProps) {
  return (
    <li
      className={cn(
        'relative flex items-center gap-2 pb-8 pl-7 before:absolute before:left-0 before:inline-block before:h-2 before:w-2 before:-translate-x-1 before:rounded-full before:border-[#CBD5E1] before:bg-[#CBD5E1] before:text-center after:absolute after:top-2 after:left-0 after:-z-10 after:h-full after:-translate-x-[1px] after:border-l-2 after:border-solid after:border-[#E1E7EF]',
        {
          'font-bold text-blue-900 before:border-blue-900 before:bg-blue-900 before:[box-shadow:0_0_0_4px_hsla(216,_100%,_58%,_0.3)]':
            props.isActive,
          'before:border-blue-900 before:bg-blue-900': props.isComplete && !props.isActive,
          'after:border-blue-900': props.isCompletedPath && props.isComplete,
          'after:border-red-500': props.isCompletedPath && props.hasError && !props.isActive,
          'text-red-500 before:border-red-500 before:bg-red-500': props.hasError && !props.isActive,
        },
      )}
    >
      {props.children}
    </li>
  );
}
