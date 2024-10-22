import React from 'react';
import type { FetchResult } from '@apollo/client';
import { gql, useMutation } from '@apollo/client';
import clsx from 'clsx';
import { pick } from 'lodash';
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
} from '../../lib/graphql/types/v2/graphql';
import { ExpenseStatus, ExpenseType } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import { Survey, SURVEY_KEY } from '../Survey';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogFooter } from '../ui/Dialog';
import { useToast } from '../ui/useToast';

import {
  InviteeAccountType,
  InviteeOption,
  PayoutMethodOption,
  WhoIsGettingPaidOption,
  WhoIsPayingOption,
} from './form/experiment';
import { SubmitExpenseFlowForm } from './form/SubmitExpenseFlowForm';
import { useNavigationWarning } from './hooks';
import { Step, SubmitExpenseFlowSteps } from './SubmitExpenseFlowSteps';
import { SubmittedExpense } from './SubmittedExpense';
import { RecurrenceFrequencyOption, useExpenseForm, YesNoOption } from './useExpenseForm';

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
  const { toast } = useToast();
  const intl = useIntl();

  const startOptions = React.useRef({
    draftKey: props.draftKey,
    duplicateExpense: props.duplicateExpense,
    expenseId: props.expenseId,
  });

  const formRef = React.useRef<HTMLFormElement>();
  const [submittedExpenseId, setSubmittedExpenseId] = React.useState(null);
  const { LoggedInUser } = useLoggedInUser();
  const [createExpense] = useMutation<CreateExpenseFromDashboardMutation, CreateExpenseFromDashboardMutationVariables>(
    gql`
      mutation CreateExpenseFromDashboard($expenseCreateInput: ExpenseCreateInput!, $account: AccountReferenceInput!) {
        expense: createExpense(expense: $expenseCreateInput, account: $account) {
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

  const expenseForm = useExpenseForm({
    formRef,
    initialValues: {
      title: '',
      expenseCurrency: null,
      whoIsPayingOption: WhoIsPayingOption.RECENT,
      whoIsGettingPaidOption: WhoIsGettingPaidOption.MY_PROFILES,
      inviteeAccountType: InviteeAccountType.INDIVIDUAL,
      inviteeOption: InviteeOption.EXISTING,
      payoutMethodOption: PayoutMethodOption.EXISTING_PAYOUT_METHOD,
      expenseTypeOption: ExpenseType.INVOICE,
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
      updatePayoutMethodNameToMatchProfile: YesNoOption.YES,
      hasInvoiceOption: YesNoOption.YES,
    },
    startOptions: startOptions.current,
    async onSubmit(values, h, formOptions, startOptions) {
      let result:
        | FetchResult<CreateExpenseFromDashboardMutation>
        | FetchResult<InviteExpenseFromDashboardMutation>
        | FetchResult<EditExpenseFromDashboardMutation>;
      try {
        track(AnalyticsEvent.EXPENSE_SUBMISSION_SUBMITTED);

        const expenseInput: CreateExpenseFromDashboardMutationVariables['expenseCreateInput'] = {
          description: values.title,
          reference: values.reference,
          payee: {
            slug: values.payeeSlug,
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
            url: a,
          })),
          currency: values.expenseCurrency as Currency,
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
            incurredAt: ei.incurredAt,
            url: ei.attachment,
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
              formOptions.expense?.status === ExpenseStatus.DRAFT && !values.payeeSlug
                ? null
                : {
                    slug: values.payeeSlug,
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
        } else if (values.payeeSlug) {
          result = await createExpense({
            variables: {
              account: {
                slug: formOptions.account?.slug,
              },
              expenseCreateInput: expenseInput,
            },
          });

          toast({
            variant: 'success',
            title: <FormattedMessage id="Expense.Submitted" defaultMessage="Expense submitted" />,
            message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
            duration: 20000,
          });
        } else {
          const inviteInput: InviteExpenseFromDashboardMutationVariables['expenseInviteInput'] = {
            ...expenseInput,
            payee: {
              ...pick(values.invitePayee, ['legacyId', 'slug', 'name', 'email', 'organization']),
              isInvite: true,
            },
            recipientNote: values.inviteNote,
            ...(!('legacyId' in values.invitePayee) && 'payoutMethod' in values.invitePayee
              ? { payoutMethod: values.invitePayee.payoutMethod }
              : {}),
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
  });

  const [activeStep, setActiveStep] = React.useState(Step.WHO_IS_PAYING);

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
        <DialogContent>
          <SubmittedExpense expenseId={submittedExpenseId} />
          <DialogFooter className="flex justify-center sm:justify-center">
            <Button onClick={handleOnClose}>
              <FormattedMessage id="Finish" defaultMessage="Finish" />
            </Button>
          </DialogFooter>
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
        className={clsx('overflow-hidden', {
          'sm:max-w-screen sm:min-w-screen rounded-none p-0 sm:rounded-none sm:p-0': !submittedExpenseId,
        })}
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

            <Button onClick={handleOnClose} variant="ghost" className="cursor-pointer sm:hidden" asChild>
              <X />
            </Button>
          </header>
          <main className="flex w-full flex-grow overflow-hidden">
            <div className="flex w-full flex-grow justify-center">
              <div className="flex w-full flex-col overflow-scroll sm:flex sm:flex-row sm:gap-11 sm:px-8 sm:pt-10">
                <SubmitExpenseFlowSteps
                  className="sticky top-0 w-[250px]"
                  activeStep={activeStep}
                  completedSteps={[]}
                  expenseForm={expenseForm}
                />

                <div className="flex h-max w-full justify-center">
                  <div className="max-w-screen-md">
                    <form ref={formRef} onSubmit={e => e.preventDefault()}>
                      <SubmitExpenseFlowForm
                        onNextClick={() => setActiveStep(Step.SUMMARY)}
                        form={expenseForm}
                        onVisibleSectionChange={v => setActiveStep(v as Step)}
                      />
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
