import React from 'react';
import type { FetchResult } from '@apollo/client';
import { FormikProvider, useFormikContext } from 'formik';
import { isEmpty, pick } from 'lodash';
import { X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useInView } from 'react-intersection-observer';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '@/lib/errors';
import type {
  CreateExpenseFromDashboardMutation,
  EditExpenseFromDashboardMutation,
} from '@/lib/graphql/types/v2/graphql';
import { ExpenseStatus, ExpenseType } from '@/lib/graphql/types/v2/schema';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { objectKeys } from '@/lib/utils';

import { I18nBold } from '../I18nFormatters';
import { AdditionalAttachments, ExpenseItemsForm } from '../submit-expense/form/ExpenseItemsSection';
import { PayoutMethodFormContent } from '../submit-expense/form/PayoutMethodSection';
import { SummarySectionContent } from '../submit-expense/form/SummarySection';
import { WhoIsGettingPaidForm } from '../submit-expense/form/WhoIsGettingPaidSection';
import { SubmittedExpense } from '../submit-expense/SubmittedExpense';
import type { ExpenseForm } from '../submit-expense/useExpenseForm';
import {
  InviteeAccountType,
  RecurrenceFrequencyOption,
  useExpenseForm,
  YesNoOption,
} from '../submit-expense/useExpenseForm';
import { Survey, SURVEY_KEY } from '../Survey';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogFooter } from '../ui/Dialog';
import { useToast } from '../ui/useToast';

import { GrantProviderSection } from './sections/GrantProviderSection';
import { InstructionSection } from './sections/InstructionsSection';
import { InvitationNoteSection } from './sections/InvitationNoteSection';
import SubmitGrantFlowSteps, { Step, useExpenseFormSteps } from './SubmitGrantFlowSteps';

type SubmitGrantFlowProps = {
  account: { slug: string; name?: string };
  expenseId?: number;
  draftKey?: string;
  handleOnClose: () => void;
};

export default function SubmitGrantFlow(props: SubmitGrantFlowProps) {
  return (
    <SubmitGrantDialog
      expenseId={props.expenseId}
      draftKey={props.draftKey}
      account={props.account}
      handleOnClose={props.handleOnClose}
    />
  );
}

type SubmitGrantDialogProps = {
  handleOnClose: () => void;
  loading?: boolean;
  expenseId?: number;
  draftKey?: string;
  account: { slug: string; name?: string };
};

function SubmitGrantDialog(props: SubmitGrantDialogProps) {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const [submittedGrantId, setSubmittedGrantId] = React.useState(null);

  const onViewAllExpensesClick = React.useCallback(() => {
    if (LoggedInUser) {
      router.replace(`/dashboard/${LoggedInUser.collective.slug}/submitted-expenses`);
    } else {
      router.replace(`${props.account.slug}/expenses`);
    }
  }, [LoggedInUser, props.account.slug, router]);

  return (
    <Dialog
      defaultOpen
      onOpenChange={open => {
        if (!open) {
          props.handleOnClose?.();
        }
      }}
    >
      <DialogContent
        hideCloseButton
        overlayClassName="p-0 sm:p-0"
        className={'overflow-hidden rounded-none p-0 sm:max-w-screen sm:min-w-screen sm:rounded-none sm:p-0'}
        onEscapeKeyDown={e => {
          e.preventDefault();
          if (open) {
            props.handleOnClose?.();
          }
        }}
      >
        <div className="flex max-h-screen min-h-screen max-w-screen min-w-screen flex-col overflow-hidden bg-[#F8FAFC]">
          <header className="flex min-w-screen items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-10">
            <span className="text-xl leading-7 font-bold text-slate-800">
              {!submittedGrantId && (
                <FormattedMessage
                  defaultMessage="Grant Application to {accountName}"
                  id="tk1wte"
                  values={{
                    accountName: props.account.name,
                  }}
                />
              )}
              {submittedGrantId && (
                <span className="text-xl leading-7 font-bold text-slate-800">
                  <FormattedMessage
                    defaultMessage="Grant application #{submittedGrantId} has been submitted successfully!"
                    id="o4LqjE"
                    values={{ submittedGrantId }}
                  />
                </span>
              )}
            </span>
            <Button
              disabled={props.loading}
              loading={props.loading}
              onClick={props.handleOnClose}
              variant="ghost"
              className="hidden cursor-pointer items-center gap-2 px-4 py-3 text-base leading-5 font-medium text-slate-800 sm:visible sm:flex"
              asChild
            >
              <span>
                <FormattedMessage id="Close" defaultMessage="Close" />
                <X />
              </span>
            </Button>

            <Button
              loading={props.loading}
              disabled={props.loading}
              onClick={props.handleOnClose}
              variant="ghost"
              className="cursor-pointer sm:hidden"
            >
              <X />
            </Button>
          </header>
          <main className="flex w-full grow overflow-hidden">
            {!submittedGrantId && (
              <SubmitGrantDialogContent
                draftKey={props.draftKey}
                expenseId={props.expenseId}
                accountSlug={props.account.slug}
                onGrantSubmitted={setSubmittedGrantId}
              />
            )}
            {submittedGrantId && (
              <div className="flex w-full grow justify-center overflow-y-scroll">
                <div className="flex w-full max-w-(--breakpoint-xl) flex-col justify-center pt-4 sm:flex sm:flex-row sm:gap-11 sm:px-8 sm:pt-8 lg:pt-24">
                  <SubmittedExpense expenseId={submittedGrantId} />
                </div>
              </div>
            )}
          </main>
          {submittedGrantId && (
            <DialogFooter className="z-30 flex justify-center border-t bg-[#BBE0FF] p-4 text-sm leading-5 text-[#184090] sm:justify-center sm:px-0">
              <FormattedMessage
                defaultMessage="<b>Grants are processed as 'expenses'.</b> To view your application, <link>View All Expenses</link>"
                id="oAwTV8"
                values={{
                  b: I18nBold,
                  link: c => {
                    return (
                      <React.Fragment>
                        &nbsp;
                        <Button
                          className="h-5 px-0 leading-5"
                          size="xs"
                          variant="link"
                          onClick={onViewAllExpensesClick}
                        >
                          {c}
                        </Button>
                      </React.Fragment>
                    );
                  },
                }}
              />
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SubmitGrantDialogContentProps = {
  accountSlug: string;
  expenseId?: number;
  draftKey?: string;
  onGrantSubmitted: (expenseId: number) => void;
};

function SubmitGrantDialogContent(props: SubmitGrantDialogContentProps) {
  const { toast } = useToast();
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();
  const formRef = React.useRef<HTMLFormElement>();

  const startOptions = React.useRef<ExpenseForm['startOptions']>({
    expenseId: props.expenseId,
    draftKey: props.draftKey,
  });

  const onError = React.useCallback(
    err => {
      toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
    },
    [intl, toast],
  );

  const onSuccess = React.useCallback(
    (result: FetchResult<CreateExpenseFromDashboardMutation> | FetchResult<EditExpenseFromDashboardMutation>) => {
      toast({
        variant: 'success',
        title: <FormattedMessage defaultMessage="Grant Application submitted" id="9XkBTl" />,
        message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
        duration: 20000,
      });

      props.onGrantSubmitted(result.data.expense.legacyId);
    },
    [LoggedInUser, props, toast],
  );

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      accountSlug: props.accountSlug,
      title: '',
      expenseTypeOption: ExpenseType.GRANT,
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      expenseItems: [
        {
          key: 'initial', // "key" is only used for enabling FlipMove animations
          amount: {
            valueInCents: 0,
            currency: 'USD',
          },
          description: '',
        },
      ],
      additionalAttachments: [],
      recurrenceFrequency: RecurrenceFrequencyOption.NONE,
      hasInvoiceOption: YesNoOption.NO,
      inviteeNewIndividual: {},
      inviteeNewOrganization: {
        organization: {},
      },
      newPayoutMethod: {
        data: {},
      },
    },
    startOptions: startOptions.current,
    handleOnSubmit: true,
    onSuccess,
    onError,
  });

  const steps = useExpenseFormSteps<Step>(
    [
      {
        name: Step.INFORMATION,
        title: <FormattedMessage defaultMessage="Information" id="E80WrK" />,
        nextButtonMessage: <FormattedMessage defaultMessage="Proceed" id="VNX4fn" />,
        items: [
          {
            name: Step.GRANT_PROVIDER,
            hidden: true,
            formValues: ['accountSlug'],
          },
          {
            name: Step.INSTRUCTIONS,
            hidden: true,
            formValues: ['acknowledgedCollectiveGrantExpensePolicy', 'acknowledgedHostGrantExpensePolicy'],
          },
          {
            name: Step.INVITATION_NOTE,
            hidden: true,
          },
        ],
      },
      {
        name: Step.APPLICATION_FORM,
        title: <FormattedMessage defaultMessage="Application Form" id="TeGcrX" />,
        previousButtonMessage: <FormattedMessage defaultMessage="Back" id="Back" />,
        nextButtonMessage: <FormattedMessage defaultMessage="Proceed to Summary" id="tqKBWl" />,
        items: [
          {
            name: Step.WHO_WILL_RECEIVE_FUNDS,
            title: <FormattedMessage defaultMessage="Who will receive the fund?" id="q5ZkgW" />,
            formValues: ['payeeSlug', 'inviteeNewIndividual', 'inviteeNewOrganization'],
          },
          {
            name: Step.PAYOUT_METHOD,
            title: <FormattedMessage defaultMessage="Payout Method" id="PayoutMethod" />,
            formValues: ['payoutMethodId', 'newPayoutMethod', 'payoutMethodNameDiscrepancyReason'],
          },
          {
            name: Step.DESCRIPTION,
            title: <FormattedMessage defaultMessage="Description" id="Fields.description" />,
            formValues: ['expenseItems'],
          },
        ],
      },
      {
        name: Step.SUMMARY,
        previousButtonMessage: <FormattedMessage defaultMessage="Edit Application" id="ByzFz7" />,
        nextButtonMessage: <FormattedMessage defaultMessage="Submit Application" id="1vrJP6" />,
        title: <FormattedMessage defaultMessage="Summary" id="Summary" />,
      },
    ],
    expenseForm,
    Step.INFORMATION,
  );

  const { setActiveStep } = steps;
  const onVisibleSectionChange = React.useCallback(v => setActiveStep(v as Step), [setActiveStep]);

  const { setFieldTouched, validateForm, handleSubmit } = expenseForm;

  const onBackStepClick = React.useCallback(() => {
    if (steps.activeHeaderName === Step.SUMMARY) {
      setActiveStep(Step.APPLICATION_FORM);
      return;
    }

    if (steps.activeHeaderName === Step.APPLICATION_FORM) {
      setActiveStep(Step.INFORMATION);
      return;
    }
  }, [steps.activeHeaderName, setActiveStep]);

  const onNextStepClick = React.useCallback(async () => {
    const errors = await validateForm();
    const stepErrors = pick(errors, steps.activeHeader.formValues);
    if (!isEmpty(stepErrors)) {
      objectKeys(stepErrors).forEach(k => setFieldTouched(k, true));
      return;
    }

    if (steps.activeHeaderName === Step.INFORMATION) {
      setActiveStep(Step.WHO_WILL_RECEIVE_FUNDS);
      return;
    }

    if (steps.activeHeaderName === Step.APPLICATION_FORM) {
      setActiveStep(Step.SUMMARY);
      return;
    }

    handleSubmit();
  }, [
    validateForm,
    steps.activeHeader.formValues,
    steps.activeHeaderName,
    handleSubmit,
    setFieldTouched,
    setActiveStep,
  ]);

  return (
    <FormikProvider value={expenseForm}>
      <div className="relative flex w-full grow flex-row justify-center overflow-y-scroll pt-10 sm:gap-11 sm:pl-8">
        <div className="hidden w-64 min-w-44 sm:block">
          <SubmitGrantFlowSteps steps={steps.steps} />
        </div>
        <form className="flex w-full flex-col sm:max-w-3xl" ref={formRef} onSubmit={e => e.preventDefault()}>
          <div className="grow basis-1 sm:px-0">
            <div className="px-4 pb-4">
              <FormContainer activeHeader={steps.activeHeaderName} onVisibleSectionChange={onVisibleSectionChange} />
            </div>
            <div className="sticky bottom-0 bg-[#F8FAFC]">
              <div className="flex justify-between px-4 py-4">
                {steps.activeHeader.previousButtonMessage ? (
                  <Button variant="outline" onClick={onBackStepClick}>
                    {steps.activeHeader.previousButtonMessage}
                  </Button>
                ) : (
                  <div />
                )}
                {steps.activeHeader.nextButtonMessage && (
                  <Button onClick={onNextStepClick} disabled={expenseForm.initialLoading}>
                    {steps.activeHeader.nextButtonMessage}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </FormikProvider>
  );
}

type FormContainerProps = {
  onVisibleSectionChange: (id: string) => void;
  activeHeader: Step;
};

function FormContainer(props: FormContainerProps) {
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
    <div className="flex flex-col gap-8">
      {props.activeHeader === Step.INFORMATION && (
        <React.Fragment>
          <FormSectionContainer
            id={Step.GRANT_PROVIDER}
            inViewChange={onInViewChange}
            title={<FormattedMessage defaultMessage="Grant Provider" id="KfOix2" />}
          >
            <GrantProviderSection {...GrantProviderSection.getFormProps(form)} />
          </FormSectionContainer>

          {((form.options.host?.slug !== form.options.account?.slug &&
            form.options.host?.policies?.EXPENSE_POLICIES?.grantPolicy) ||
            form.options.account?.policies?.EXPENSE_POLICIES?.grantPolicy) && (
            <FormSectionContainer
              id={Step.INSTRUCTIONS}
              inViewChange={onInViewChange}
              title={<FormattedMessage defaultMessage="Instructions" id="sV2v5L" />}
            >
              <InstructionSection {...InstructionSection.getFormProps(form)} />
            </FormSectionContainer>
          )}

          {form.options.expense?.status === ExpenseStatus.DRAFT &&
            !isEmpty(form.options.expense?.draft?.recipientNote) && (
              <FormSectionContainer
                id={Step.INVITATION_NOTE}
                inViewChange={onInViewChange}
                title={<FormattedMessage defaultMessage="Invitation Note" id="aqqLMi" />}
              >
                <InvitationNoteSection form={form} />
              </FormSectionContainer>
            )}
        </React.Fragment>
      )}
      {props.activeHeader === Step.APPLICATION_FORM && (
        <React.Fragment>
          <FormSectionContainer
            id={Step.WHO_WILL_RECEIVE_FUNDS}
            inViewChange={onInViewChange}
            title={<FormattedMessage defaultMessage="Who will receive the funds?" id="CAYwc2" />}
            subtitle={
              <FormattedMessage
                defaultMessage="Select the profile of the recipient who will receive the fund"
                id="VYoQSx"
              />
            }
          >
            <WhoIsGettingPaidForm {...WhoIsGettingPaidForm.getFormProps(form)} />
          </FormSectionContainer>

          <FormSectionContainer
            id={Step.PAYOUT_METHOD}
            inViewChange={onInViewChange}
            title={<FormattedMessage defaultMessage="Select a payout method" id="Ri4REE" />}
            subtitle={<FormattedMessage defaultMessage="Where do you want to receive the money" id="CNCPij" />}
          >
            <PayoutMethodFormContent {...PayoutMethodFormContent.getFormProps(form)} />
          </FormSectionContainer>

          <FormSectionContainer
            id={Step.DESCRIPTION}
            inViewChange={onInViewChange}
            title={<FormattedMessage defaultMessage="Application Content" id="hBBIor" />}
            subtitle={<FormattedMessage defaultMessage="Add the details and information required" id="U7azjR" />}
          >
            <ExpenseItemsForm {...ExpenseItemsForm.getFormProps(form)} />

            <div className="my-4 border-t border-gray-200" />
            <AdditionalAttachments {...AdditionalAttachments.getFormProps(form)} />
          </FormSectionContainer>
        </React.Fragment>
      )}
      {props.activeHeader === Step.SUMMARY && (
        <React.Fragment>
          <FormSectionContainer
            id={Step.SUMMARY}
            inViewChange={onInViewChange}
            title={<FormattedMessage defaultMessage="Review application" id="lB/ra7" />}
          >
            <SummarySectionContent form={form} />
          </FormSectionContainer>
        </React.Fragment>
      )}
    </div>
  );
}

type FormSectionContainerProps = {
  children: React.ReactNode;
  id: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
  error?: React.ReactNode;
};

function FormSectionContainer(props: FormSectionContainerProps) {
  const { ref } = useInView({
    onChange: props.inViewChange,
    rootMargin: '-50px 0px -70% 0px',
  });

  return (
    <div ref={ref} id={props.id} className="scroll-m-8">
      <div className="rounded-lg border border-white bg-white p-6">
        {props.title && (
          <div className="mb-4">
            <div className="text-xl font-bold text-[#0F1729]">{props.title}</div>
            {props.subtitle && <div className="text-sm text-muted-foreground">{props.subtitle}</div>}
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
}
