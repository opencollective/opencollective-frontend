import React from 'react';
import { useInView } from 'react-intersection-observer';
import { FormattedMessage } from 'react-intl';

import { type Step, StepSubtitles, StepTitles } from '../SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../useExpenseForm';

type FormSectionContainerProps = {
  children: React.ReactNode;
  step: Step;
  form: ExpenseForm;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  hideTitle?: boolean;
  hideSubtitle?: boolean;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
  error?: React.ReactNode;
};

export function FormSectionContainer(props: FormSectionContainerProps) {
  const { ref } = useInView({
    onChange: props.inViewChange,
    rootMargin: '-50px 0px -70% 0px',
  });

  const stepTitle = StepTitles[props.step];
  const stepSubtitle = StepSubtitles[props.step];

  return (
    <div ref={ref} id={props.step} className="scroll-m-8">
      <div className="rounded-lg border border-white bg-white p-6">
        {!props.hideTitle && !props.hideSubtitle && (
          <div className="mb-4">
            {!props.hideTitle && (
              <div className="text-xl font-bold text-[#0F1729]">
                {props.title || <FormattedMessage {...stepTitle} />}
              </div>
            )}
            {props.subtitle ||
              (stepSubtitle && !props.hideSubtitle && (
                <div className="text-sm text-muted-foreground">
                  <FormattedMessage {...stepSubtitle} />
                </div>
              ))}
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
}
