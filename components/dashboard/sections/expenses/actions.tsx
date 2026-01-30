import React from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { compact, pick } from 'lodash';
import {
  Check,
  Copy,
  DollarSign,
  Download,
  Filter,
  Flag,
  Link as LinkIcon,
  MinusCircle,
  Pause,
  Play,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import expenseTypes from '../../../../lib/constants/expenseTypes';
import { i18nGraphqlException } from '../../../../lib/errors';
import { gql } from '../../../../lib/graphql/helpers';
import type {
  ExpenseHostFieldsFragment,
  ExpensesListAdminFieldsFragmentFragment,
  ExpensesListFieldsFragmentFragment,
} from '../../../../lib/graphql/types/v2/graphql';
import { ExpenseStatus } from '../../../../lib/graphql/types/v2/schema';
import { useAsyncCall } from '../../../../lib/hooks/useAsyncCall';
import useClipboard from '../../../../lib/hooks/useClipboard';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../../../lib/preview-features';
import { getCollectivePageCanonicalURL, getDashboardRoute } from '../../../../lib/url-helpers';
import { collectiveAdminsMustConfirmAccountingCategory } from '@/components/expenses/lib/accounting-categories';
import type LoggedInUser from '@/lib/LoggedInUser';

import { shouldShowDuplicateExpenseButton } from '@/components/expenses/ExpenseMoreActionsButton';
import { getDisabledMessage } from '@/components/expenses/PayExpenseButton';
import SecurityChecksModal, { expenseRequiresSecurityConfirmation } from '@/components/expenses/SecurityChecksModal';

import ApproveExpenseModal from '../../../expenses/ApproveExpenseModal';
import type { ConfirmProcessExpenseModalType } from '../../../expenses/ConfirmProcessExpenseModal';
import ConfirmProcessExpenseModal from '../../../expenses/ConfirmProcessExpenseModal';
import ExpenseConfirmDeletion from '../../../expenses/ExpenseConfirmDeletionModal';
import { expensePageExpenseFieldsFragment } from '../../../expenses/graphql/fragments';
import MarkExpenseAsUnpaidModal from '../../../expenses/MarkExpenseAsUnpaidModal';
import PayExpenseModal from '../../../expenses/PayExpenseModal';
import { FullscreenFlowLoadingPlaceholder } from '../../../FullscreenFlowLoadingPlaceholder';
import Link from '../../../Link';
import type { BaseModalProps } from '../../../ModalContext';
import { useModal } from '../../../ModalContext';
import { toast } from '../../../ui/useToast';
import { ALL_SECTIONS } from '../../constants';
import { DashboardContext } from '../../DashboardContext';

import { getScheduledExpensesQueryVariables, scheduledExpensesQuery } from './ScheduledExpensesBanner';

/**
 * Helper function to get error content with special handling for PayPal balance errors
 */
const getErrorContent = (
  intl: ReturnType<typeof useIntl>,
  error: Error | { message?: string },
  host?: ExpenseHostFieldsFragment | null,
  LoggedInUser?: LoggedInUser,
): { title?: string; message: React.ReactNode } => {
  const message = error?.message;
  if (message) {
    if (message.startsWith('Insufficient Paypal balance') && host?.slug) {
      return {
        title: intl.formatMessage({ defaultMessage: 'Insufficient Paypal balance', id: 'BmZrOu' }),
        message: (
          <Link
            href={
              LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS)
                ? `/dashboard/${host.slug}/${ALL_SECTIONS.PAY_DISBURSEMENTS}`
                : `/dashboard/${host.slug}/${ALL_SECTIONS.HOST_EXPENSES}`
            }
          >
            <FormattedMessage
              id="PayExpenseModal.RefillBalanceError"
              defaultMessage="Refill your balance from the Host dashboard"
            />
          </Link>
        ),
      };
    }
  }

  return { message: i18nGraphqlException(intl, error) };
};

// Lazy load the submit expense flow
const SubmitExpenseFlow = React.lazy(() =>
  import('../../../submit-expense/SubmitExpenseFlow').then(module => ({ default: module.SubmitExpenseFlow })),
);

/**
 * Type for expense data used in actions. Combines ExpensesListFieldsFragment and
 * ExpensesListAdminFieldsFragment with optional additional fields that may be present
 */
type ExpenseQueryNode = ExpensesListFieldsFragmentFragment &
  ExpensesListAdminFieldsFragmentFragment & {
    host?: ExpenseHostFieldsFragment | null;
  };

const SecurityChecksModalWrapper = ({
  open,
  setOpen,
  expense,
  onConfirm,
}: BaseModalProps & {
  expense: ExpenseQueryNode;
  onConfirm: () => void;
}) => {
  if (!open) {
    return null;
  }

  return (
    <SecurityChecksModal
      expense={expense}
      onClose={() => setOpen(false)}
      onConfirm={() => {
        setOpen(false);
        onConfirm();
      }}
    />
  );
};

const PayExpenseModalWrapper = ({
  open,
  setOpen,
  expense,
  collective,
  host,
  canPayWithAutomaticPayment,
  onSubmit,
}: BaseModalProps & {
  expense: ExpenseQueryNode;
  collective: ExpenseQueryNode['account'];
  host: ExpenseHostFieldsFragment;
  canPayWithAutomaticPayment: boolean;
  onSubmit: (values: { action: string } & Record<string, unknown>) => Promise<void>;
}) => {
  if (!open) {
    return null;
  }

  return (
    <PayExpenseModal
      expense={expense}
      collective={collective}
      host={host}
      canPayWithAutomaticPayment={canPayWithAutomaticPayment}
      onClose={() => setOpen(false)}
      onSubmit={onSubmit}
    />
  );
};

const ApproveExpenseModalWrapper = ({
  open,
  setOpen,
  expense,
  host,
  account,
  onConfirm,
}: BaseModalProps & {
  expense: ExpenseQueryNode;
  host: ExpenseHostFieldsFragment;
  account: ExpenseQueryNode['account'];
  onConfirm: () => Promise<void>;
}) => {
  if (!open) {
    return null;
  }

  return (
    <ApproveExpenseModal
      expense={expense}
      host={host}
      account={account}
      onConfirm={onConfirm}
      onClose={() => setOpen(false)}
    />
  );
};

const DuplicateExpenseFlowWrapper = ({
  open,
  setOpen,
  expenseId,
  onSuccess,
}: BaseModalProps & {
  expenseId: number;
  onSuccess?: () => void;
}) => {
  if (!open) {
    return null;
  }

  return (
    <React.Suspense fallback={<FullscreenFlowLoadingPlaceholder handleOnClose={() => setOpen(false)} />}>
      <SubmitExpenseFlow
        onClose={submittedExpense => {
          setOpen(false);
          if (submittedExpense) {
            onSuccess?.();
          }
        }}
        expenseId={expenseId}
        duplicateExpense={true}
      />
    </React.Suspense>
  );
};

const processExpenseMutation = gql`
  mutation ProcessExpenseAction(
    $id: String
    $legacyId: Int
    $action: ExpenseProcessAction!
    $message: String
    $paymentParams: ProcessExpensePaymentParams
  ) {
    processExpense(
      expense: { id: $id, legacyId: $legacyId }
      action: $action
      message: $message
      paymentParams: $paymentParams
    ) {
      id
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

const expenseStatusQuery = gql`
  query ExpenseActionsExpenseStatus($expense: ExpenseReferenceInput!) {
    expense(expense: $expense) {
      id
      legacyId
      status
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

type UseExpenseActionsOptions = {
  /**
   * Called after successful mutation to refetch the list
   */
  refetchList?: () => void;
  /**
   * Function to reset filters with new values (e.g., for viewing related expenses)
   */
  resetFilters?: (values: Record<string, unknown>) => void;
  /**
   * Called after expense is deleted
   */
  onDelete?: (expense: ExpenseQueryNode) => void;
  host?: ExpenseHostFieldsFragment;
};

export function useExpenseActions<T extends ExpenseQueryNode>({
  refetchList,
  onDelete,
  host,
}: UseExpenseActionsOptions = {}) {
  const intl = useIntl();
  const router = useRouter();
  const { showModal, showConfirmationModal } = useModal();
  const { LoggedInUser } = useLoggedInUser();
  const { account: dashboardAccount } = React.useContext(DashboardContext);
  const { copy, isCopied } = useClipboard();

  const [processExpense] = useMutation(processExpenseMutation);
  const [getExpenseStatus] = useLazyQuery(expenseStatusQuery);

  /**
   * Polls the expense status after a Stripe payment until it reaches PAID or PROCESSING status.
   * This is needed because Stripe payments are asynchronous and the status update may not be immediate.
   */
  const waitExpenseStatus = React.useCallback(
    async (expense: Pick<T, 'id' | 'legacyId'>) => {
      let maxAttempts = 10;
      while (maxAttempts-- > 0) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const result = await getExpenseStatus({
          variables: {
            expense: pick(expense, ['id', 'legacyId']),
          },
        });

        if (result.error) {
          continue;
        }

        const updatedExpense = result.data?.expense;
        if (updatedExpense?.status === ExpenseStatus.PAID || updatedExpense?.status === ExpenseStatus.PROCESSING) {
          return;
        }
      }
    },
    [getExpenseStatus],
  );

  const { callWith: downloadInvoiceWith } = useAsyncCall(
    async (expense: T) => {
      const { saveAs } = await import('file-saver');
      const { fetchFromPDFService } = await import('../../../../lib/api');
      const { expenseInvoiceUrl } = await import('../../../../lib/url-helpers');

      const invoiceUrl = expenseInvoiceUrl(expense.id);
      const blob = await fetchFromPDFService(invoiceUrl);
      const date = new Date().toISOString().split('T')[0];
      const filename = `Expense-${expense.legacyId}-invoice-${date}.pdf`;
      return saveAs(blob, filename);
    },
    { useErrorToast: true },
  );

  const getActions: GetActions<T> = (
    expense: T,
    onCloseFocusRef?: React.MutableRefObject<HTMLElement>,
    refetch?: () => void,
  ) => {
    if (!expense) {
      return {};
    }

    const permissions = expense.permissions;
    if (!permissions) {
      return {};
    }

    // Determine if we're viewing the expense in the host context (from host dashboard)
    // This affects which actions are available (e.g., "Unapprove" vs "Request re-approval")
    const isViewingExpenseInHostContext = dashboardAccount?.isHost && host?.id === dashboardAccount.id;

    const onMutationSuccess = () => {
      refetchList?.();
      refetch?.();
    };

    const handleProcessExpense = async (action: string, message?: string) => {
      await processExpense({
        variables: { id: expense.id, legacyId: expense.legacyId, action, message },
      });
      onMutationSuccess();
    };

    const showProcessExpenseModal = (type: ConfirmProcessExpenseModalType) => {
      showModal(
        ConfirmProcessExpenseModal,
        {
          type,
          expense,
        },
        `confirm-expense-${expense.id}-${type}`,
      );
    };

    const handleCopyLink = () => {
      copy(`${getCollectivePageCanonicalURL(expense.account)}/expenses/${expense.legacyId}`);
    };

    const handleDownloadInvoice = () => {
      return downloadInvoiceWith(expense)();
    };

    const invoiceTypes = [expenseTypes.INVOICE, expenseTypes.SETTLEMENT, expenseTypes.PLATFORM_BILLING] as string[];
    const canSeeInvoice = permissions.canSeeInvoiceInfo && invoiceTypes.includes(expense.type);

    const transactionsUrl =
      dashboardAccount?.isHost && host?.id === dashboardAccount.id
        ? getDashboardRoute(host, `host-transactions?expenseId=${expense.legacyId}`)
        : dashboardAccount?.slug === expense.account?.slug
          ? getDashboardRoute(expense.account, `transactions?expenseId=${expense.legacyId}`)
          : null;

    const handleViewTransactions = () => {
      if (transactionsUrl) {
        router.push(transactionsUrl);
      }
    };

    const payExpenseDisabledMsg = getDisabledMessage(expense, expense.account, host, expense.payoutMethod);
    const payExpenseDisabled = Boolean(payExpenseDisabledMsg);

    const handlePayExpense = async (action: string, paymentParams?: Record<string, unknown>) => {
      // Build refetchQueries for scheduled payment actions
      const refetchQueries = [];
      if ((action === 'SCHEDULE_FOR_PAYMENT' || action === 'UNSCHEDULE_PAYMENT') && host?.slug) {
        refetchQueries.push({
          query: scheduledExpensesQuery,
          variables: getScheduledExpensesQueryVariables(host.slug),
        });
      }

      try {
        await processExpense({
          variables: { id: expense.id, legacyId: expense.legacyId, action, paymentParams },
          refetchQueries,
        });

        // For Stripe payments, wait for the expense status to update
        if (action === 'MARK_AS_PAID_WITH_STRIPE') {
          await waitExpenseStatus(expense);
        }

        onMutationSuccess();
        return true;
      } catch (e) {
        const errorContent = getErrorContent(intl, e, host, LoggedInUser);
        toast({ variant: 'error', title: errorContent.title, message: errorContent.message });
        return false;
      }
    };

    // Check if the new expense flow is enabled (via preview feature or query param)
    const hasNewSubmitExpenseFlow =
      LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW) ||
      router.query.newExpenseFlowEnabled;
    const canDuplicateExpense = hasNewSubmitExpenseFlow && shouldShowDuplicateExpenseButton(LoggedInUser, expense);

    return {
      primary: compact([
        // Approve action (for Collective admins)
        permissions.canApprove && {
          key: 'approve',
          label: intl.formatMessage({ defaultMessage: 'Approve', id: 'actions.approve' }),
          onClick: () => {
            // Check if accounting category confirmation is required by policy
            // Only check if the required policy data is available in the query
            const requiresCategoryConfirmation =
              expense.account &&
              host &&
              'policies' in expense.account &&
              collectiveAdminsMustConfirmAccountingCategory(
                expense.account as Parameters<typeof collectiveAdminsMustConfirmAccountingCategory>[0],
                host as Parameters<typeof collectiveAdminsMustConfirmAccountingCategory>[1],
              );

            if (requiresCategoryConfirmation) {
              showModal(
                ApproveExpenseModalWrapper,
                {
                  expense,
                  host: host,
                  account: expense.account,
                  onConfirm: async () => {
                    await handleProcessExpense('APPROVE');
                  },
                },
                `approve-expense-${expense.id}`,
              );
            } else {
              showProcessExpenseModal('APPROVE');
            }
          },
          Icon: Check,
        },
        // Pay / Mark as Paid action
        (permissions.canPay || permissions.canMarkAsPaid) && {
          key: 'pay',
          label: intl.formatMessage({ defaultMessage: 'Go to Pay', id: 'actions.goToPay' }),
          onClick: () => {
            const requiresSecurityCheck = expenseRequiresSecurityConfirmation(expense);

            const openPayExpenseModal = () => {
              showModal(
                PayExpenseModalWrapper,
                {
                  expense,
                  collective: expense.account,
                  host: host,
                  canPayWithAutomaticPayment: Boolean(permissions.canPay),
                  onSubmit: async (values: { action: string } & Record<string, unknown>) => {
                    const { action, ...paymentParams } = values;
                    const success = await handlePayExpense(action, paymentParams);
                    if (success) {
                      return;
                    }
                    throw new Error('Payment failed');
                  },
                },
                `pay-expense-${expense.id}`,
              );
            };

            if (requiresSecurityCheck) {
              showModal(
                SecurityChecksModalWrapper,
                {
                  expense,
                  onConfirm: openPayExpenseModal,
                },
                `security-check-expense-${expense.id}`,
              );
            } else {
              openPayExpenseModal();
            }
          },
          disabled: payExpenseDisabled,
          tooltip: payExpenseDisabled ? payExpenseDisabledMsg : undefined,
          Icon: DollarSign,
        },
        // Reject action
        permissions.canReject && {
          key: 'reject',
          label: intl.formatMessage({ defaultMessage: 'Reject', id: 'actions.reject' }),
          onClick: () => showProcessExpenseModal('REJECT'),
          Icon: MinusCircle,
        },
        // Unapprove action (for Collective context)
        permissions.canUnapprove &&
          !isViewingExpenseInHostContext && {
            key: 'unapprove',
            label: intl.formatMessage({ defaultMessage: 'Unapprove', id: 'expense.unapprove.btn' }),
            onClick: () => showProcessExpenseModal('UNAPPROVE'),
            Icon: Undo2,
          },
        // Request re-approval (for Host context)
        permissions.canUnapprove &&
          isViewingExpenseInHostContext && {
            key: 'request-re-approval',
            label: intl.formatMessage({ defaultMessage: 'Request re-approval', id: 'expense.requestReApproval.btn' }),
            onClick: () => showProcessExpenseModal('REQUEST_RE_APPROVAL'),
            Icon: Undo2,
          },
        // Hold action
        permissions.canHold && {
          key: 'hold',
          label: intl.formatMessage({ defaultMessage: 'Put On Hold', id: 'actions.hold' }),
          onClick: () => showProcessExpenseModal('HOLD'),
          Icon: Pause,
        },
        // Release hold action
        permissions.canRelease && {
          key: 'release',
          label: intl.formatMessage({ defaultMessage: 'Release Hold', id: 'actions.release' }),
          onClick: () => showProcessExpenseModal('RELEASE'),
          Icon: Play,
        },
        // Mark as incomplete
        permissions.canMarkAsIncomplete && {
          key: 'mark-as-incomplete',
          label: intl.formatMessage({ defaultMessage: 'Mark as Incomplete', id: 'actions.markAsIncomplete' }),
          onClick: () => showProcessExpenseModal('MARK_AS_INCOMPLETE'),
          Icon: Flag,
        },
      ]),
      secondary: compact([
        // Mark as spam
        permissions.canMarkAsSpam && {
          key: 'mark-as-spam',
          label: intl.formatMessage({ defaultMessage: 'Mark as Spam', id: 'actions.spam' }),
          onClick: () => {
            const isSubmitter = expense.createdByAccount?.legacyId === LoggedInUser?.CollectiveId;

            if (isSubmitter) {
              toast({
                variant: 'error',
                message: intl.formatMessage({
                  defaultMessage: "You can't mark your own expenses as spam",
                  id: 'expense.spam.notAllowed',
                }),
              });
              return;
            }

            showProcessExpenseModal('MARK_AS_SPAM');
          },
          Icon: Flag,
        },
        // Mark as unpaid (uses a custom modal with form)
        permissions.canMarkAsUnpaid && {
          key: 'mark-as-unpaid',
          label: intl.formatMessage({ defaultMessage: 'Mark as unpaid', id: 'expense.markAsUnpaid.btn' }),
          onClick: () => {
            showModal(
              MarkExpenseAsUnpaidModal,
              {
                expense,
                onSuccess: onMutationSuccess,
                onCloseFocusRef,
              },
              `mark-as-unpaid-${expense.id}`,
            );
          },
          Icon: Undo2,
        },
        // Unschedule payment
        permissions.canUnschedulePayment && {
          key: 'unschedule-payment',
          label: intl.formatMessage({ defaultMessage: 'Unschedule Payment', id: 'expense.unschedulePayment.btn' }),
          onClick: () => {
            showConfirmationModal({
              title: intl.formatMessage({
                defaultMessage: 'Unschedule Payment',
                id: 'expense.unschedulePayment.btn',
              }),
              description: intl.formatMessage({
                defaultMessage:
                  'Are you sure you want to unschedule this payment? The expense will return to approved status.',
                id: 'expense.unschedulePayment.confirmation',
              }),
              onConfirm: () => handleProcessExpense('UNSCHEDULE_PAYMENT'),
              confirmLabel: intl.formatMessage({ defaultMessage: 'Unschedule', id: 'Unschedule' }),
              onCloseFocusRef,
            });
          },
          Icon: Undo2,
        },
        // Delete expense
        permissions.canDelete && {
          key: 'delete',
          label: intl.formatMessage({ defaultMessage: 'Delete', id: 'actions.delete' }),
          onClick: () => {
            showModal(
              ({ open, setOpen }) => {
                if (!open) {
                  return null;
                }
                return (
                  <ExpenseConfirmDeletion
                    expense={expense}
                    onDelete={deletedExpense => {
                      onDelete?.(deletedExpense);
                      onMutationSuccess();
                    }}
                    showDeleteConfirmMoreActions={setOpen}
                  />
                );
              },
              {},
              `delete-expense-${expense.id}`,
            );
          },
          Icon: Trash2,
        },
        // Copy link
        {
          key: 'copy-link',
          label: isCopied
            ? intl.formatMessage({ defaultMessage: 'Copied!', id: 'Clipboard.Copied' })
            : intl.formatMessage({ defaultMessage: 'Copy link', id: 'CopyLink' }),
          onClick: handleCopyLink,
          Icon: isCopied ? Check : LinkIcon,
        },
        // Duplicate expense
        canDuplicateExpense && {
          key: 'duplicate',
          label: intl.formatMessage({ defaultMessage: 'Duplicate Expense', id: 'MXaO+R' }),
          onClick: () => {
            showModal(
              DuplicateExpenseFlowWrapper,
              {
                expenseId: expense.legacyId,
                onSuccess: onMutationSuccess,
              },
              `duplicate-expense-${expense.id}`,
            );
          },
          Icon: Copy,
        },
        // Download invoice (for invoice-type expenses)
        canSeeInvoice && {
          key: 'download-invoice',
          label: intl.formatMessage({ defaultMessage: 'Download Invoice', id: '+j9z3T' }),
          onClick: handleDownloadInvoice,
          Icon: Download,
        },
        // View transactions
        transactionsUrl && {
          key: 'view-transactions',
          label: intl.formatMessage({ defaultMessage: 'View Transactions', id: 'viewTransactions' }),
          onClick: handleViewTransactions,
          Icon: Filter,
        },
      ]),
    };
  };

  return getActions;
}
