import React from 'react';
import { gql, useMutation } from '@apollo/client';
import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { AlertOctagon, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import {
  Amount,
  CreateExpenseFromDashboardMutation,
  CreateExpenseFromDashboardMutationVariables,
  Currency,
  CurrencyExchangeRateInput,
} from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { usePrevious } from '../../lib/hooks/usePrevious';
import { computeExpenseAmounts } from '../expenses/lib/utils';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import { Survey, SURVEY_KEY } from '../Survey';
import { Button } from '../ui/Button';
import { StepList, StepListItemIcon } from '../ui/StepList';
import { useToast } from '../ui/useToast';

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
  const { toast } = useToast();
  const intl = useIntl();
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>();
  const [submittedExpenseId, setSubmittedExpenseId] = React.useState(null);
  const { LoggedInUser } = useLoggedInUser();
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
  const previousStep: ExpenseFlowStep = usePrevious(currentStep);
  React.useEffect(() => {
    if (!previousStep) {
      track(AnalyticsEvent.EXPENSE_SUBMISSION_STARTED);
      return;
    }

    if (currentStep === previousStep) {
      return;
    }

    const previousStepIdx = ExpenseStepOrder.indexOf(previousStep) - 1;
    const currentStepIdx = ExpenseStepOrder.indexOf(currentStep) - 1;

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
  }, [previousStep, currentStep]);

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {},
    async onSubmit(values, h, formOptions) {
      try {
        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED);
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
                amountV2: {
                  valueInCents: ei.amount.valueInCents,
                  currency: ei.amount.currency as Currency,
                  exchangeRate: ei.amount.exchangeRate as CurrencyExchangeRateInput,
                },
                incurredAt: new Date(ei.date),
                url: ei.url,
              })),
              longDescription: null,
              payeeLocation: null,
              privateMessage: null,
              tags: values.tags,
              tax: values.hasTax
                ? [
                    {
                      rate: values.tax.rate,
                      type: formOptions.taxType,
                      idNumber: values.tax.idNumber,
                    },
                  ]
                : null,
            },
          },
        });
        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_SUCCESS);

        setSubmittedExpenseId(result.data.createExpense.legacyId);

        toast({
          variant: 'success',
          title: <FormattedMessage id="Expense.Submitted" defaultMessage="Expense submitted" />,
          message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
          duration: 20000,
        });
      } catch (err) {
        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_ERROR);
        toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
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
      <header className="min-w-screen flex items-center justify-between border-b border-slate-100 px-4 py-2 sm:px-10">
        <span className="text-xl font-bold leading-7 text-slate-800">
          <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
        </span>
        <Button
          variant="ghost"
          className="hidden items-center gap-2 px-4 py-3 text-base font-medium leading-5 text-slate-800 sm:visible sm:flex"
          asChild
        >
          <Link href={`/dashboard/${props.slug}/submitted-expenses`}>
            <ArrowLeft />
            <FormattedMessage defaultMessage="Back to my dashboard" />
          </Link>
        </Button>

        <Button variant="ghost" className="sm:hidden" asChild>
          <Link href={`/dashboard/${props.slug}/submitted-expenses`}>
            <X />
          </Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full flex-grow justify-start gap-10 overflow-hidden sm:w-[768px] sm:pt-10">
        {submittedExpenseId ? (
          <SubmittedExpense expenseId={submittedExpenseId} form={expenseForm} />
        ) : (
          <div className="flex w-full flex-col pb-4 sm:flex sm:flex-row sm:gap-8 sm:pb-0">
            <SubmitExpenseFlowSteps expenseForm={expenseForm} currentStep={currentStep} />

            <div className="flex-grow overflow-auto px-4 pt-4 sm:px-0 sm:pt-0">
              <form ref={formRef} onSubmit={e => e.preventDefault()}>
                <step.Form form={expenseForm} slug={props.slug} />
              </form>
            </div>
          </div>
        )}
      </main>
      <ExpenseWarnings form={expenseForm} />
      {!submittedExpenseId && (
        <SubmitExpenseFlowFooter
          expenseForm={expenseForm}
          isLastStep={ExpenseStepOrder.indexOf(currentStep) === ExpenseStepOrder.length - 1}
          isStepValid={!step.hasError(expenseForm)}
          onNextStepClick={onNextStepClick}
          readyToSubmit={!nextStep && isEmpty(expenseForm.errors)}
          setCurrentStep={setCurrentStep}
          nextStep={nextStep}
          prevStep={prevStep}
        />
      )}
    </div>
  );
}

type SubmitExpenseFlowStepsProps = {
  expenseForm: ExpenseForm;
  currentStep: ExpenseFlowStep;
};

function SubmitExpenseFlowSteps(props: SubmitExpenseFlowStepsProps) {
  const [collapsed, setCollapsed] = React.useState(true);

  return (
    <React.Fragment>
      <div className="w-full sm:w-[165px] sm:min-w-[165px]">
        <div
          className={clsx(' flex items-center gap-2 px-4 py-2 text-sm sm:hidden', {
            'border-b border-slate-200': collapsed,
          })}
        >
          <span className="inline-block max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-oc-blue-tints-800">
            {Steps[props.currentStep].stepTitle}
          </span>
          <span className="text-oc-blue-tints-800">/</span>
          <div className="flex gap-3 text-xs">
            {ExpenseStepOrder.map((stepName, i) => {
              const step = Steps[stepName];
              return (
                <StepListItemIcon
                  key={stepName}
                  completed={
                    i === ExpenseStepOrder.length - 1
                      ? props.currentStep === stepName
                      : !step.hasError(props.expenseForm)
                  }
                  current={props.currentStep === stepName}
                />
              );
            })}
          </div>
          <Button variant="ghost" size="xs" className="ml-auto cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronDown /> : <ChevronUp />}
          </Button>
        </div>
        <StepList
          className={clsx(
            'z-50 w-full border-b border-slate-100 bg-white px-4 py-2 drop-shadow-lg sm:block  sm:border-b-0 sm:px-0 sm:py-0 sm:drop-shadow-none',
            {
              'hidden sm:block': collapsed,
              'absolute block': !collapsed,
            },
          )}
        >
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
      </div>
    </React.Fragment>
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
};

function SubmitExpenseFlowFooter(props: SubmitExpenseFlowFooterProps) {
  return (
    <footer className="min-w-screen flex items-center justify-between gap-4 border-t border-slate-100 px-10 py-2 sm:justify-center">
      <Button
        variant="outline"
        disabled={!props.prevStep}
        className={clsx('flex gap-2', { invisible: !props.prevStep })}
        onClick={props.prevStep ? () => props.setCurrentStep(props.prevStep) : undefined}
      >
        <ArrowLeft />
        <FormattedMessage defaultMessage="Go back" />
      </Button>

      {props.isLastStep ? (
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
    </footer>
  );
}

type ExpenseWarningsProps = {
  form: ExpenseForm;
};

function ExpenseWarnings(props: ExpenseWarningsProps) {
  if (!props.form.options.account) {
    return null;
  }

  const collectiveBalance = props.form.options.account.stats.balance.valueInCents;

  const { totalInvoiced } = computeExpenseAmounts(
    props.form.values.expenseCurrency,
    (props.form.values.expenseItems || []).map(ei => ({
      description: ei.description,
      amountV2: ei.amount as Amount,
      incurredAt: ei.date,
    })),
    props.form.values.tax ? [{ ...props.form.values.tax, type: props.form.options.taxType }] : [],
  );

  if (!totalInvoiced || totalInvoiced < collectiveBalance) {
    return null;
  }

  return (
    <div className="flex justify-center p-2" style={{ backgroundColor: '#FFFC89' }}>
      <div className="flex items-center gap-4  text-xs">
        <div>
          <AlertOctagon />
        </div>
        <div>
          <div className="font-bold">
            <FormattedMessage defaultMessage="Expense alert" />:
          </div>
          <div>
            <FormattedMessage
              defaultMessage="The Collective's budget ({amount}) is insufficient to pay this expense."
              values={{
                amount: (
                  <FormattedMoneyAmount
                    abbreviate
                    currencyCodeStyles={{ fontWeight: 'bold' }}
                    amount={props.form.options.account.stats.balance.valueInCents}
                    currency={props.form.options.account.stats.balance.currency}
                  />
                ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
