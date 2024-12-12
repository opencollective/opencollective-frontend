import React from 'react';
import { useInView } from 'react-intersection-observer';
import { FormattedMessage, useIntl } from 'react-intl';

import { cn } from '../../../lib/utils';

import { expenseFormStepError, type Step, StepSubtitles, StepTitles } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

type FormSectionContainerProps = {
  children: React.ReactNode;
  step: Step;
  form: ExpenseForm;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
  error?: React.ReactNode;
};

export function FormSectionContainer(props: FormSectionContainerProps) {
  const intl = useIntl();
  const { ref } = useInView({
    onChange: props.inViewChange,
    rootMargin: '-50px 0px -70% 0px',
  });

  const stepError = props.error || expenseFormStepError(intl, props.form, props.step);
  const stepTitle = StepTitles[props.step];
  const stepSubtitle = StepSubtitles[props.step];

  return (
    <div ref={ref} id={props.step}>
      <div
        className={cn('rounded-lg border border-white bg-white p-6', {
          'border-red-300': !!stepError,
        })}
      >
        <div className="mb-4">
          <div className="text-xl font-bold text-[#0F1729]">{props.title || <FormattedMessage {...stepTitle} />}</div>
          {props.subtitle ||
            (stepSubtitle && (
              <div className="text-sm text-muted-foreground">
                <FormattedMessage {...stepSubtitle} />
              </div>
            ))}
        </div>
        {props.children}
      </div>
      {!!stepError && <div className="mt-2 text-right text-sm font-semibold text-red-500">{stepError}</div>}
    </div>
  );
}
