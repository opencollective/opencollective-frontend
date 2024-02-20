import React from 'react';
import { gql, useMutation } from '@apollo/client';
import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  CreateExpenseFromDashboardMutation,
  CreateExpenseFromDashboardMutationVariables,
  Currency,
} from '../../lib/graphql/types/v2/graphql';

import Link from '../Link';
import { Button } from '../ui/Button';
import { StepList } from '../ui/StepList';

import { ExpenseFlowStep, ExpenseStepOrder, Steps } from './Steps';
import { SubmittedExpense } from './SubmittedExpense';
import { ExpenseForm, expenseTypeFromOption, useExpenseForm } from './useExpenseForm';

type SubmitExpenseFlowProps = {
  slug: string;
};

const I18nMessages = defineMessages({
  ConfirmExit: {
    defaultMessage: 'Are you sure you want to discard this expense?',
  },
});

export function SubmitExpenseFlow(props: SubmitExpenseFlowProps) {
  const intl = useIntl();
  const router = useRouter();
  const [submittedExpenseId, setSubmittedExpenseId] = React.useState(null);
  const [createExpense] = useMutation<CreateExpenseFromDashboardMutation, CreateExpenseFromDashboardMutationVariables>(
    gql`
      mutation CreateExpenseFromDashboard($expenseCreateInput: ExpenseCreateInput!, $account: AccountReferenceInput!) {
        createExpense(expense: $expenseCreateInput, account: $account) {
          id
          legacyId
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  const [currentStep, setCurrentStep] = React.useState<ExpenseFlowStep>(ExpenseFlowStep.COLLECTIVE);
  const expenseForm = useExpenseForm({
    initialValues: {},
    async onSubmit(values, h) {
      try {
        const result = await createExpense({
          variables: {
            account: {
              slug: values.collectiveSlug,
            },
            expenseCreateInput: {
              description: values.title,
              payee: {
                slug: values.payeeSlug,
              },
              payoutMethod: {
                id: values.payoutMethodId,
              },
              type: expenseTypeFromOption(values.expenseTypeOption),
              accountingCategory: values.accountingCategoryId
                ? {
                    id: values.accountingCategoryId,
                  }
                : null,
              attachedFiles: values.expenseAttachedFiles,
              currency: values.expenseCurrency as Currency,
              customData: null,
              invoiceInfo: null,
              items: values.expenseItems.map(ei => ({
                description: ei.description,
                amountV2: { valueInCents: ei.amount.valueInCents, currency: ei.amount.currency as Currency },
                incurredAt: new Date(ei.date),
                url: ei.url,
              })),
              longDescription: null,
              payeeLocation: null,
              privateMessage: null,
              tags: values.tags,
              tax: null,
            },
          },
        });

        setSubmittedExpenseId(result.data.createExpense.legacyId);
      } finally {
        h.setSubmitting(false);
      }
    },
  });

  React.useEffect(() => {
    function warnAboutIncompleteExpenseOnUnload(e) {
      if (!submittedExpenseId) {
        e.preventDefault();
        e.returnValue = intl.formatMessage(I18nMessages.ConfirmExit);
      }
      return true;
    }

    function warnAboutIncompleteExpenseOnRouteChangeStart() {
      if (!submittedExpenseId) {
        if (!confirm(intl.formatMessage(I18nMessages.ConfirmExit))) {
          router.events.emit('routeChangeError');
          throw 'not good';
        }
      }
    }

    window.addEventListener('beforeunload', warnAboutIncompleteExpenseOnUnload);
    router.events.on('routeChangeStart', warnAboutIncompleteExpenseOnRouteChangeStart);
    return () => {
      window.removeEventListener('beforeunload', warnAboutIncompleteExpenseOnUnload);
      router.events.off('routeChangeStart', warnAboutIncompleteExpenseOnRouteChangeStart);
    };
  }, [router, submittedExpenseId, intl]);

  const prevStep = React.useMemo(() => {
    const newStepIdx = ExpenseStepOrder.indexOf(currentStep) - 1;
    return newStepIdx >= 0 ? ExpenseStepOrder[newStepIdx] : null;
  }, [currentStep]);
  const nextStep = React.useMemo(() => {
    const newStepIdx = ExpenseStepOrder.indexOf(currentStep) + 1;
    return newStepIdx < ExpenseStepOrder.length ? ExpenseStepOrder[newStepIdx] : null;
  }, [currentStep]);

  const onNextStepClick = React.useCallback(async () => {
    await expenseForm.validateForm();
    setCurrentStep(nextStep);
  }, [nextStep, expenseForm]);

  const step = Steps[currentStep];

  return (
    <div className="flex max-h-screen min-h-screen flex-col">
      <header className="min-w-screen flex items-center justify-between border-b border-slate-100 px-10 py-2">
        <span className="text-xl font-bold leading-7 text-slate-800">
          <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
        </span>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-4 py-3 text-base font-medium leading-5 text-slate-800"
          asChild
        >
          <Link href={`/dashboard/${props.slug}/submitted-expenses`}>
            <ArrowLeft />
            <FormattedMessage defaultMessage="Back to my dashboard" />
          </Link>
        </Button>
      </header>
      <main
        className={clsx('mx-auto flex flex-grow justify-start gap-10 overflow-hidden pt-10', {
          'w-[768px]': !submittedExpenseId,
          'w-full px-16': submittedExpenseId,
        })}
      >
        {submittedExpenseId ? (
          <SubmittedExpense expenseId={submittedExpenseId} />
        ) : (
          <React.Fragment>
            <SubmitExpenseFlowSteps
              expenseForm={expenseForm}
              className="w-[145px] min-w-[145px] overflow-x-hidden"
              currentStep={currentStep}
            />
            <div className="flex-grow overflow-auto">
              <step.Form form={expenseForm} slug={props.slug} />
            </div>
          </React.Fragment>
        )}
      </main>
      <footer className="min-w-screen flex items-center justify-center gap-4 border-t border-slate-100 px-10 py-2">
        <SubmitExpenseFlowFooter
          expenseForm={expenseForm}
          isLastStep={ExpenseStepOrder.indexOf(currentStep) === ExpenseStepOrder.length - 1}
          isStepValid={!step.hasError(expenseForm)}
          onNextStepClick={onNextStepClick}
          readyToSubmit={!nextStep && isEmpty(expenseForm.errors)}
          submitted={!!submittedExpenseId}
          setCurrentStep={setCurrentStep}
          nextStep={nextStep}
          prevStep={prevStep}
          slug={props.slug}
        />
      </footer>
    </div>
  );
}

type SubmitExpenseFlowStepsProps = {
  expenseForm: ExpenseForm;
  currentStep: ExpenseFlowStep;
  className?: string;
};

function SubmitExpenseFlowSteps(props: SubmitExpenseFlowStepsProps) {
  return (
    <StepList className={props.className}>
      {ExpenseStepOrder.map(stepName => {
        const step = Steps[stepName];
        return (
          <step.StepListItem
            key={stepName}
            className="w-full"
            form={props.expenseForm}
            current={props.currentStep === stepName}
          />
        );
      })}
    </StepList>
  );
}

type SubmitExpenseFlowFooterProps = {
  prevStep?: ExpenseFlowStep;
  nextStep?: ExpenseFlowStep;
  isLastStep: boolean;
  readyToSubmit: boolean;
  expenseForm: ExpenseForm;
  isStepValid: boolean;
  onNextStepClick: () => void;
  setCurrentStep: (s: ExpenseFlowStep) => void;
  submitted: boolean;
  slug: string;
};

function SubmitExpenseFlowFooter(props: SubmitExpenseFlowFooterProps) {
  const router = useRouter();
  return (
    <React.Fragment>
      <Button
        variant="outline"
        disabled={!props.prevStep || props.submitted}
        className={clsx('flex gap-2', { invisible: !props.prevStep || props.submitted })}
        onClick={props.prevStep ? () => props.setCurrentStep(props.prevStep) : undefined}
      >
        <ArrowLeft />
        <FormattedMessage defaultMessage="Go back" />
      </Button>

      {props.submitted ? (
        <Button
          onClick={() => {
            router.replace(`/dashboard/${props.slug}/submitted-expenses`);
          }}
        >
          <FormattedMessage id="Finish" defaultMessage="Finish" />
        </Button>
      ) : props.isLastStep ? (
        <Button
          disabled={!props.readyToSubmit || props.expenseForm.isSubmitting || props.expenseForm.isValidating}
          onClick={props.expenseForm.submitForm}
        >
          <FormattedMessage id="submit" defaultMessage="Submit" />
          <ArrowRight />
        </Button>
      ) : (
        <Button
          disabled={
            !props.nextStep || !props.isStepValid || props.expenseForm.isSubmitting || props.expenseForm.isValidating
          }
          className={clsx('flex gap-2', { invisible: !props.nextStep })}
          onClick={props.onNextStepClick}
        >
          <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
          <ArrowRight />
        </Button>
      )}
    </React.Fragment>
  );
}
