import React from 'react';
import { useRouter } from 'next/router';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { usePrevious } from '../../lib/hooks/usePrevious';

import { ExpenseFlowStep, Steps } from './Steps';
import { ExpenseForm } from './useExpenseForm';

type UseStepsOptions = {
  steps: ExpenseFlowStep[];
  form: ExpenseForm;
};

export function useSteps(opts: UseStepsOptions) {
  const [currentStep, setCurrentStep] = React.useState<ExpenseFlowStep>(ExpenseFlowStep.COLLECTIVE);
  const previousStep: ExpenseFlowStep = usePrevious(currentStep);

  const prevStep = React.useMemo(() => {
    const newStepIdx = opts.steps.indexOf(currentStep) - 1;
    return newStepIdx >= 0 ? opts.steps[newStepIdx] : null;
  }, [currentStep, opts.steps]);
  const nextStep = React.useMemo(() => {
    const newStepIdx = opts.steps.indexOf(currentStep) + 1;
    return newStepIdx < opts.steps.length ? opts.steps[newStepIdx] : null;
  }, [currentStep, opts.steps]);

  const onNextStepClick = React.useCallback(async () => {
    await opts.form.validateForm();
    setCurrentStep(nextStep);
  }, [nextStep, opts.form]);

  const step = Steps[currentStep];

  // analytics
  React.useEffect(() => {
    if (!previousStep) {
      track(AnalyticsEvent.EXPENSE_SUBMISSION_STARTED);
      return;
    }

    if (currentStep === previousStep) {
      return;
    }

    const previousStepIdx = opts.steps.indexOf(previousStep) - 1;
    const currentStepIdx = opts.steps.indexOf(currentStep) - 1;

    // going back
    if (currentStepIdx < previousStepIdx) {
      return;
    }

    switch (previousStep) {
      case ExpenseFlowStep.COLLECTIVE:
        track(AnalyticsEvent.EXPENSE_SUBMISSION_PICKED_COLLECTIVE);
        return;
      case ExpenseFlowStep.PAYMENT_METHOD:
        track(AnalyticsEvent.EXPENSE_SUBMISSION_PICKED_PAYEE);
        return;
      case ExpenseFlowStep.EXPENSE_TYPE:
        track(AnalyticsEvent.EXPENSE_SUBMISSION_PICKED_EXPENSE_TYPE);
        return;
      case ExpenseFlowStep.EXPENSE_INFO:
        track(AnalyticsEvent.EXPENSE_SUBMISSION_PICKED_EXPENSE_TITLE);
        return;
      case ExpenseFlowStep.EXPENSE_DETAILS:
        track(AnalyticsEvent.EXPENSE_SUBMISSION_FILLED_EXPENSE_DETAILS);
        return;
    }
  }, [previousStep, currentStep, opts.steps]);

  return {
    step,
    currentStep,
    setCurrentStep,
    prevStep,
    nextStep,
    onNextStepClick,
  };
}

type useNavigationWarningOpts = {
  enabled?: boolean;
  confirmationMessage: any;
};

export function useNavigationWarning(opts: useNavigationWarningOpts) {
  const router = useRouter();

  React.useEffect(() => {
    function warnOnUnload(e) {
      if (opts.enabled) {
        e.preventDefault();
        e.returnValue = opts.confirmationMessage;
      }
      return true;
    }

    function warnOnRouteChangeStart(url, { shallow }) {
      if (opts.enabled && !shallow) {
        if (!confirm(opts.confirmationMessage)) {
          router.events.emit('routeChangeError');
          throw 'abort navigation';
        }
      }
    }

    window.addEventListener('beforeunload', warnOnUnload);
    router.events.on('routeChangeStart', warnOnRouteChangeStart);
    return () => {
      window.removeEventListener('beforeunload', warnOnUnload);
      router.events.off('routeChangeStart', warnOnRouteChangeStart);
    };
  }, [router, opts.enabled, opts.confirmationMessage]);
}
