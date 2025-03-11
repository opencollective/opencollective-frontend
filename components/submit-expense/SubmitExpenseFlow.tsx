import React from 'react';
import { FormikProvider } from 'formik';
import { X } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { ExpenseType } from '../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { i18nGraphqlException } from '@/lib/errors';

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
  submitExpenseTo?: string;
  endFlowButtonLabel?: React.ReactNode;
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

  const onExpenseInviteDeclined = React.useCallback(() => {
    onClose(true);
  }, [onClose]);

  const onSuccess = React.useCallback(
    (result, type: 'edit' | 'new' | 'invite') => {
      setSubmittedExpenseId(result.data.expense.legacyId);
      switch (type) {
        case 'edit': {
          toast({
            variant: 'success',
            title: <FormattedMessage defaultMessage="Expense edited" id="yTblGN" />,
            message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
            duration: 20000,
          });
          break;
        }
        case 'invite': {
          toast({
            variant: 'success',
            title: <FormattedMessage defaultMessage="Expense invite sent" id="Fhue1N" />,
            message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
            duration: 20000,
          });
          break;
        }
        case 'new': {
          toast({
            variant: 'success',
            title: <FormattedMessage id="Expense.Submitted" defaultMessage="Expense submitted" />,
            message: LoggedInUser ? <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED_NEW_FLOW} /> : null,
            duration: 20000,
          });
          break;
        }
      }
    },
    [LoggedInUser, toast],
  );

  const onError = React.useCallback(
    err => {
      toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
    },
    [intl, toast],
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
          className="overflow-hidden rounded-none p-0 sm:max-w-screen sm:min-w-screen sm:rounded-none sm:p-0"
          hideCloseButton
        >
          <div className="relative flex max-h-screen min-h-screen max-w-screen min-w-screen flex-col overflow-hidden bg-[#F8FAFC] before:absolute before:top-0 before:right-0 before:left-0 before:-z-1 before:h-44 before:rotate-180 before:[background:url('/static/images/home/fiscalhost-blue-bg-md.png')]">
            <header className="z-30 flex min-w-screen items-center justify-between border-b border-slate-100 bg-background px-4 py-3 sm:px-10">
              <span className="text-xl leading-7 font-bold text-slate-800">
                <FormattedMessage
                  defaultMessage="Expense #{submittedExpenseId} has been submitted successfully!"
                  id="e1biOC"
                  values={{ submittedExpenseId }}
                />
              </span>
              <Button
                onClick={handleOnClose}
                variant="ghost"
                className="hidden cursor-pointer items-center gap-2 px-4 py-3 text-base leading-5 font-medium text-slate-800 sm:visible sm:flex"
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
            <main className="z-10 flex w-full grow overflow-hidden">
              <div className="flex w-full grow justify-center overflow-y-scroll">
                <div className="flex w-full max-w-(--breakpoint-xl) flex-col pt-4 sm:flex sm:flex-row sm:gap-11 sm:px-8 sm:pt-8 lg:pt-24">
                  <SubmittedExpense expenseId={submittedExpenseId} />
                </div>
              </div>
            </main>
            <DialogFooter className="z-30 flex justify-center border-t p-4 sm:justify-center sm:px-0">
              <Button onClick={handleOnClose}>
                {props.endFlowButtonLabel || (
                  <FormattedMessage
                    defaultMessage="View all expenses"
                    id="CollectivePage.SectionBudget.ViewAllExpenses"
                  />
                )}
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
        className={'overflow-hidden rounded-none p-0 sm:max-w-screen sm:min-w-screen sm:rounded-none sm:p-0'}
        onEscapeKeyDown={e => {
          e.preventDefault();
          if (open) {
            handleOnClose();
          }
        }}
      >
        <div className="flex max-h-screen min-h-screen max-w-screen min-w-screen flex-col overflow-hidden bg-[#F8FAFC]">
          <header className="flex min-w-screen items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-10">
            <span className="text-xl leading-7 font-bold text-slate-800">
              <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
            </span>
            <Button
              onClick={handleOnClose}
              variant="ghost"
              className="hidden cursor-pointer items-center gap-2 px-4 py-3 text-base leading-5 font-medium text-slate-800 sm:visible sm:flex"
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
          <main className="flex w-full grow overflow-hidden">
            <div className="flex w-full grow justify-center">
              <div className="relative flex w-full flex-row justify-center overflow-y-scroll pt-10 sm:gap-11 sm:px-8">
                <ExpenseFormikContainer
                  submitExpenseTo={props.submitExpenseTo}
                  draftKey={props.draftKey}
                  duplicateExpense={props.duplicateExpense}
                  expenseId={props.expenseId}
                  onSuccess={onSuccess}
                  onError={onError}
                  onExpenseInviteDeclined={onExpenseInviteDeclined}
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
  submitExpenseTo?: string;
  draftKey?: string;
  duplicateExpense?: boolean;
  expenseId?: number;
  onError: (err) => void;
  onSuccess: (result, type: 'edit' | 'new' | 'invite') => void;
  onExpenseInviteDeclined: () => void;
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
      accountSlug: props.submitExpenseTo,
      title: '',
      expenseTypeOption: ExpenseType.INVOICE,
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
    handleOnSubmit: true,
    onSuccess: props.onSuccess,
    onError: props.onError,
  });

  return (
    <FormikProvider value={expenseForm}>
      <SubmitExpenseFlowSteps className="sticky top-0 hidden w-64 min-w-44 sm:block" activeStep={activeStep} />

      <div className="h-max w-full px-4 pb-4 sm:max-w-3xl sm:overflow-x-hidden sm:px-0">
        <form ref={formRef} onSubmit={e => e.preventDefault()}>
          <SubmitExpenseFlowForm
            onNextClick={() => setActiveStep(Step.SUMMARY)}
            onVisibleSectionChange={onVisibleSectionChange}
            onExpenseInviteDeclined={props.onExpenseInviteDeclined}
          />
        </form>
      </div>
    </FormikProvider>
  );
}
