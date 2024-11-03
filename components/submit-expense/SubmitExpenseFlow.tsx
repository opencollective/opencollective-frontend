import React from 'react';
import type { FetchResult } from '@apollo/client';
import { gql, useMutation } from '@apollo/client';
import dayjs from 'dayjs';
import { FormikProvider } from 'formik';
import { omit, pick } from 'lodash';
import { X } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type {
  CreateExpenseFromDashboardMutation,
  CreateExpenseFromDashboardMutationVariables,
  Currency,
  CurrencyExchangeRateInput,
  EditExpenseFromDashboardMutation,
  EditExpenseFromDashboardMutationVariables,
  InviteExpenseFromDashboardMutation,
  InviteExpenseFromDashboardMutationVariables,
  RecurringExpenseInterval,
} from '../../lib/graphql/types/v2/graphql';
import { ExpenseStatus, ExpenseType, PayoutMethodType } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import { Survey, SURVEY_KEY } from '../Survey';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogFooter } from '../ui/Dialog';
import { useToast } from '../ui/useToast';

import { SubmitExpenseFlowForm } from './form/SubmitExpenseFlowForm';
import { useNavigationWarning } from './hooks';
import { Step, SubmitExpenseFlowSteps } from './SubmitExpenseFlowSteps';
import { SubmittedExpense } from './SubmittedExpense';
import { InviteeAccountType, RecurrenceFrequencyOption, useExpenseForm, YesNoOption } from './useExpenseForm';

type SubmitExpenseFlowProps = {
  onClose: (submittedExpense: boolean) => void;
  expenseId?: number;
  draftKey?: string;
  duplicateExpense?: boolean;
};

const I18nMessages = defineMessages({
  ConfirmExit: {
    defaultMessage: 'Are you sure you want to discard this expense?',
    id: 't0Uyqt',
  },
});

export function SubmitExpenseFlow(props: SubmitExpenseFlowProps) {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();

  const { toast } = useToast();

  const [submittedExpenseId, setSubmittedExpenseId] = React.useState(null);
  const [createExpense] = useMutation<CreateExpenseFromDashboardMutation, CreateExpenseFromDashboardMutationVariables>(
    gql`
      mutation CreateExpenseFromDashboard(
        $expenseCreateInput: ExpenseCreateInput!
        $account: AccountReferenceInput!
        $recurring: RecurringExpenseInput
        $privateComment: String
      ) {
        expense: createExpense(
          expense: $expenseCreateInput
          account: $account
          privateComment: $privateComment
          recurring: $recurring
        ) {
          id
          legacyId
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  const [draftExpenseAndInviteUser] = useMutation<
    InviteExpenseFromDashboardMutation,
    InviteExpenseFromDashboardMutationVariables
  >(
    gql`
      mutation InviteExpenseFromDashboard(
        $expenseInviteInput: ExpenseInviteDraftInput!
        $account: AccountReferenceInput!
      ) {
        expense: draftExpenseAndInviteUser(expense: $expenseInviteInput, account: $account) {
          id
          legacyId
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  const [editExpense] = useMutation<EditExpenseFromDashboardMutation, EditExpenseFromDashboardMutationVariables>(
    gql`
      mutation EditExpenseFromDashboard($expenseEditInput: ExpenseUpdateInput!, $draftKey: String) {
        expense: editExpense(expense: $expenseEditInput, draftKey: $draftKey) {
          id
          legacyId
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  const [confirmNavigation] = useNavigationWarning({
    enabled: !submittedExpenseId,
    confirmationMessage: intl.formatMessage(I18nMessages.ConfirmExit),
  });

  const { onClose } = props;
  const handleOnClose = React.useCallback(() => {
    if (confirmNavigation()) {
      onClose(!!submittedExpenseId);
    }
  }, [confirmNavigation, onClose, submittedExpenseId]);

  const onSubmit: React.ComponentProps<typeof ExpenseFormikContainer>['onSubmit'] = React.useCallback(
    async (values, h, formOptions, startOptions) => {
      let result: FetchResult<CreateExpenseFromDashboardMutation> | FetchResult<EditExpenseFromDashboardMutation>;
      try {
        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED);

        const expenseInput: CreateExpenseFromDashboardMutationVariables['expenseCreateInput'] = {
          description: values.title,
          reference:
            values.expenseTypeOption === ExpenseType.INVOICE && values.hasInvoiceOption === YesNoOption.YES
              ? values.invoiceNumber
              : null,
          payee: {
            slug: formOptions.payee?.slug,
          },
          payeeLocation: values.payeeLocation,
          payoutMethod: {
            id: values.payoutMethodId,
          },
          type: values.expenseTypeOption,
          accountingCategory: values.accountingCategoryId
            ? {
                id: values.accountingCategoryId,
              }
            : null,
          attachedFiles: values.additionalAttachments.map(a => ({
            url: typeof a === 'string' ? a : a?.url,
          })),
          currency: formOptions.expenseCurrency,
          customData: null,
          invoiceInfo: null,
          items: values.expenseItems.map(ei => ({
            description: ei.description,
            amountV2: {
              valueInCents: ei.amount.valueInCents,
              currency: ei.amount.currency as Currency,
              exchangeRate: ei.amount.exchangeRate
                ? ({
                    ...pick(ei.amount.exchangeRate, ['source', 'rate', 'value', 'fromCurrency', 'toCurrency']),
                    date: ei.amount.exchangeRate.date || ei.incurredAt,
                  } as CurrencyExchangeRateInput)
                : null,
            },
            incurredAt: new Date(ei.incurredAt),
            url: typeof ei.attachment === 'string' ? ei.attachment : ei.attachment?.url,
          })),
          longDescription: null,
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
        };

        if (formOptions.expense?.id && !startOptions.duplicateExpense) {
          const editInput: EditExpenseFromDashboardMutationVariables['expenseEditInput'] = {
            ...expenseInput,
            id: formOptions.expense.id,
            payee:
              formOptions.expense?.status === ExpenseStatus.DRAFT && !formOptions.payee?.slug
                ? null
                : {
                    slug: formOptions.payee?.slug,
                  },
          };
          result = await editExpense({
            variables: {
              expenseEditInput: editInput,
            },
          });
          toast({
            variant: 'success',
            title: <FormattedMessage defaultMessage="Expense edited" id="yTblGN" />,
            message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
            duration: 20000,
          });
        } else if (formOptions.payoutProfiles.some(p => p.slug === values.payeeSlug)) {
          result = await createExpense({
            variables: {
              account: {
                slug: formOptions.account?.slug,
              },
              expenseCreateInput: expenseInput,
              ...(values.recurrenceFrequency !== RecurrenceFrequencyOption.NONE
                ? {
                    recurring: {
                      interval: values.recurrenceFrequency as unknown as RecurringExpenseInterval,
                      endsAt: dayjs(values.recurrenceEndAt).toDate(),
                    },
                  }
                : {}),
              privateComment:
                formOptions.payoutMethod?.type === PayoutMethodType.BANK_ACCOUNT &&
                formOptions.payoutMethod?.data?.accountHolderName !== formOptions.payee?.legalName
                  ? values.payoutMethodNameDiscrepancyReason
                  : null,
            },
          });

          toast({
            variant: 'success',
            title: <FormattedMessage id="Expense.Submitted" defaultMessage="Expense submitted" />,
            message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
            duration: 20000,
          });
        } else {
          const payee =
            values.payeeSlug === '__inviteExistingUser'
              ? { slug: values.inviteeExistingAccount }
              : values.inviteeAccountType === InviteeAccountType.INDIVIDUAL
                ? values.inviteeNewIndividual
                : values.inviteeNewOrganization;
          const inviteInput: InviteExpenseFromDashboardMutationVariables['expenseInviteInput'] = {
            ...expenseInput,
            payee: {
              ...omit(payee, 'notes'),
              isInvite: true,
            },
            recipientNote: values.inviteNote,
          };
          result = await draftExpenseAndInviteUser({
            variables: {
              account: {
                slug: formOptions.account?.slug,
              },
              expenseInviteInput: inviteInput,
            },
          });

          toast({
            variant: 'success',
            title: <FormattedMessage defaultMessage="Expense invite sent" id="Fhue1N" />,
            message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
            duration: 20000,
          });
        }

        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_SUCCESS);
        setSubmittedExpenseId(result.data.expense.legacyId);
      } catch (err) {
        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED_ERROR);
        toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
      } finally {
        h.setSubmitting(false);
      }
    },
    [LoggedInUser, createExpense, draftExpenseAndInviteUser, editExpense, intl, toast],
  );

  if (submittedExpenseId) {
    return (
      <Dialog
        defaultOpen
        onOpenChange={open => {
          if (!open) {
            handleOnClose();
          }
        }}
      >
        <DialogContent
          overlayClassName="p-0 sm:p-0"
          className="sm:max-w-screen sm:min-w-screen overflow-hidden rounded-none p-0 sm:rounded-none sm:p-0"
          hideCloseButton
        >
          <div className="max-w-screen min-w-screen before:-z-1 relative flex max-h-screen min-h-screen flex-col overflow-hidden bg-[#F8FAFC] before:absolute before:left-0 before:right-0 before:top-0 before:h-44 before:rotate-180 before:[background:url('/static/images/home/fiscalhost-blue-bg-md.png')]">
            <header className="min-w-screen z-30 flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-10">
              <span className="text-xl font-bold leading-7 text-slate-800">
                Invoice #{submittedExpenseId} has been submitted successfully!
              </span>
              <Button
                onClick={handleOnClose}
                variant="ghost"
                className="hidden cursor-pointer items-center gap-2 px-4 py-3 text-base font-medium leading-5 text-slate-800 sm:visible sm:flex"
                asChild
              >
                <span>
                  <FormattedMessage id="Close" defaultMessage="Close" />
                  <X />
                </span>
              </Button>

              <Button onClick={handleOnClose} variant="ghost" className="cursor-pointer sm:hidden">
                <X />
              </Button>
            </header>
            <main className="z-10 flex w-full flex-grow overflow-hidden">
              <div className="flex w-full flex-grow justify-center">
                <div className="flex w-full flex-col overflow-scroll sm:flex sm:flex-row sm:gap-11 sm:px-8 sm:pt-4">
                  <SubmittedExpense expenseId={submittedExpenseId} />
                </div>
              </div>
            </main>
            <DialogFooter className="z-30 flex justify-center p-4 sm:justify-center sm:px-0">
              <Button onClick={handleOnClose}>
                <FormattedMessage defaultMessage="View all expenses" id="CollectivePage.SectionBudget.ViewAllExpenses" />
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      defaultOpen
      onOpenChange={open => {
        if (!open) {
          handleOnClose();
        }
      }}
    >
      <DialogContent
        hideCloseButton
        overlayClassName="p-0 sm:p-0"
        className={'sm:max-w-screen sm:min-w-screen overflow-hidden rounded-none p-0 sm:rounded-none sm:p-0'}
      >
        <div className="max-w-screen min-w-screen flex max-h-screen min-h-screen flex-col overflow-hidden bg-[#F8FAFC]">
          <header className="min-w-screen flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-10">
            <span className="text-xl font-bold leading-7 text-slate-800">
              <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
            </span>
            <Button
              onClick={handleOnClose}
              variant="ghost"
              className="hidden cursor-pointer items-center gap-2 px-4 py-3 text-base font-medium leading-5 text-slate-800 sm:visible sm:flex"
              asChild
            >
              <span>
                <FormattedMessage id="Close" defaultMessage="Close" />
                <X />
              </span>
            </Button>

            <Button onClick={handleOnClose} variant="ghost" className="cursor-pointer sm:hidden">
              <X />
            </Button>
          </header>
          <main className="flex w-full flex-grow overflow-hidden">
            <div className="flex w-full flex-grow justify-center">
              <div className="flex w-full flex-col overflow-scroll sm:flex sm:flex-row sm:gap-11 sm:px-8 sm:pt-10">
                <ExpenseFormikContainer
                  draftKey={props.draftKey}
                  duplicateExpense={props.duplicateExpense}
                  expenseId={props.expenseId}
                  onSubmit={onSubmit}
                />
              </div>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseFormikContainer(props: {
  draftKey?: string;
  duplicateExpense?: boolean;
  expenseId?: number;
  onSubmit: Parameters<typeof useExpenseForm>['0']['onSubmit'];
}) {
  const formRef = React.useRef<HTMLFormElement>();

  const startOptions = React.useRef({
    draftKey: props.draftKey,
    duplicateExpense: props.duplicateExpense,
    expenseId: props.expenseId,
  });

  const [activeStep, setActiveStep] = React.useState(Step.WHO_IS_PAYING);
  const onVisibleSectionChange = React.useCallback(v => setActiveStep(v as Step), []);

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      title: '',
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      expenseItems: [
        {
          amount: {
            valueInCents: 0,
            currency: 'USD',
          },
          description: '',
        },
      ],
      additionalAttachments: [],
      recurrenceFrequency: RecurrenceFrequencyOption.NONE,
      hasInvoiceOption: YesNoOption.YES,
      inviteeNewIndividual: {},
      inviteeNewOrganization: {
        organization: {},
      },
      newPayoutMethod: {
        data: {},
      },
    },
    startOptions: startOptions.current,
    onSubmit: props.onSubmit,
  });

  return (
    <FormikProvider value={expenseForm}>
      <SubmitExpenseFlowSteps
        className="sticky top-0 hidden w-[250px] min-w-[180px] sm:block"
        activeStep={activeStep}
      />

      <div className="mx-auto h-max w-full px-4 pb-4 sm:w-[760px] sm:px-0">
        <form ref={formRef} onSubmit={e => e.preventDefault()}>
          <SubmitExpenseFlowForm
            onNextClick={() => setActiveStep(Step.SUMMARY)}
            onVisibleSectionChange={onVisibleSectionChange}
          />
        </form>
      </div>
    </FormikProvider>
  );
}
