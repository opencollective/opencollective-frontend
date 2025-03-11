import React from 'react';
import { isEmpty, pick } from 'lodash';

import { StepHeader, StepItem } from '../submit-expense/SubmitExpenseFlowSteps';
import type { ExpenseForm } from '../submit-expense/useExpenseForm';

export enum Step {
  INFORMATION = 'INFORMATION',
  GRANT_PROVIDER = 'GRANT_PROVIDER',
  INSTRUCTIONS = 'INSTRUCTIONS',
  INVITATION_NOTE = 'INVITATION_NOTE',
  APPLICATION_FORM = 'APPLICATION_FORM',

  WHO_WILL_RECEIVE_FUNDS = 'WHO_WILL_RECEIVE_FUNDS',
  PAYOUT_METHOD = 'PAYOUT_METHOD',
  DESCRIPTION = 'DESCRIPTION',
  SUMMARY = 'SUMMARY',
}

type SubmitGrantFlowStepsProps = {
  steps: ReturnType<typeof useExpenseFormSteps>['steps'];
};

type StepHeaderConfig<StepNames extends string> = {
  name: StepNames;
  title: React.ReactNode;
  previousButtonMessage?: React.ReactNode;
  nextButtonMessage?: React.ReactNode;
  items?: {
    name: StepNames;
    formValues?: string[];
    title?: React.ReactNode;
    hidden?: boolean;
  }[];
};

type StepValue<StepNames extends string> = StepItemValue<StepNames> | StepHeaderValue<StepNames>;

type StepCommonValue<StepNames extends string> = {
  name: StepNames
  title?: React.ReactNode;
  isHeader: boolean;
  stepNumber: number;
  formValues?: string[];
  isComplete: boolean;
  hasError: boolean;
  isActive: boolean;

}
type StepItemValue<StepNames extends string> = StepCommonValue<StepNames> & {
  hidden?: boolean;
  isHeader?: false;
};

type StepHeaderValue<StepNames extends string> = StepCommonValue<StepNames> & {
  items?: any[];
  isHeader: true;
  previousButtonMessage?: React.ReactNode;
  nextButtonMessage?: React.ReactNode;
}

export function useExpenseFormSteps<StepNames extends string>(
  config: StepHeaderConfig<StepNames>[],
  form: ExpenseForm,
  initialStep: StepNames,
) {
  const [activeStep, setActiveStep] = React.useState(initialStep);

  const flatSteps: StepValue<StepNames>[] = React.useMemo(() => {
    const steps = config.flatMap((step, i) => [
      {
        ...step,
        isHeader: true,
        stepNumber: i + 1,
        formValues: (step.items ?? []).flatMap(item => item.formValues ?? []),
      },
      ...(step.items ?? []).map(item => ({ ...item, header: step.name, isHeader: false, stepNumber: i + 1 })),
    ]);
    return steps.map((step, i) => ({
      ...step,
      isActive:
        step.name === activeStep || ('items' in step && (step.items ?? []).some(item => item.name === activeStep)),
      isComplete: i !== steps.length - 1 && isEmpty(pick(form.errors, step.formValues)),
      hasError: !isEmpty(pick(form.errors, step.formValues)) && !isEmpty(pick(form.touched, step.formValues)) && form.submitCount > 0,
    }));
  }, [config, activeStep, form.errors, form.touched, form.submitCount]);

  const activeHeader = React.useMemo(
    () => flatSteps.find((s): s is StepHeaderValue<StepNames> => s.isHeader && s.isActive),
    [flatSteps],
  );
  return {
    steps: flatSteps,
    activeHeaderName: activeHeader?.name,
    activeHeader: activeHeader,
    setActiveStep,
    activeStep,
  };
}

export default function SubmitGrantFlowSteps(props: SubmitGrantFlowStepsProps) {
  const firstIncompleteIdx = React.useMemo(
    () => props.steps.findIndex(s => !s.isComplete && !s.isHeader),
    [props.steps],
  );
  const activeHeader = React.useMemo(() => props.steps.find((s): s is StepHeaderValue<any> => s.isHeader && s.isActive), [props.steps]);

  return (
    <ol className="fixed pl-[12px] text-sm">
      {props.steps.map((step, i) => {
        if (step.isHeader) {
          return (
            <StepHeader
              key={step.name}
              stepNumber={step.stepNumber}
              isActive={step.isActive}
              isComplete={step.isComplete}
              isCompletedPath={firstIncompleteIdx < 0 || step.isComplete || step.isActive}
              hasError={step.hasError}
            >
              {step.title}
            </StepHeader>
          );
        } else if (!step.isHeader && !step['hidden'] && activeHeader.items?.some(item => item.name === step.name)) {
          return (
            <StepItem
              key={step.name}
              isActive={step.isActive}
              isComplete={step.isComplete}
              isCompletedPath={firstIncompleteIdx < 0 || firstIncompleteIdx >= i}
              hasError={step.hasError}
            >
              {step.title}
            </StepItem>
          );
        }
      })}
    </ol>
  );
}
