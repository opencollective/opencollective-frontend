import React from 'react';
import { useMutation } from '@apollo/client';
import { compact } from 'lodash';
import { Check, Download, Filter, Flag, Link, MinusCircle, Pause, Play, Trash2, Undo2 } from 'lucide-react';
import { useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import expenseTypes from '../../../../lib/constants/expenseTypes';
import { i18nGraphqlException } from '../../../../lib/errors';
import { gql } from '../../../../lib/graphql/helpers';
import type { Expense } from '../../../../lib/graphql/types/v2/schema';
import { useAsyncCall } from '../../../../lib/hooks/useAsyncCall';
import useClipboard from '../../../../lib/hooks/useClipboard';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { getCollectivePageCanonicalURL, getDashboardRoute } from '../../../../lib/url-helpers';

import type { ConfirmProcessExpenseModalType } from '../../../expenses/ConfirmProcessExpenseModal';
import ConfirmProcessExpenseModal from '../../../expenses/ConfirmProcessExpenseModal';
import ExpenseConfirmDeletion from '../../../expenses/ExpenseConfirmDeletionModal';
import { expensePageExpenseFieldsFragment } from '../../../expenses/graphql/fragments';
import MarkExpenseAsUnpaidModal from '../../../expenses/MarkExpenseAsUnpaidModal';
import { useModal } from '../../../ModalContext';
import { toast } from '../../../ui/useToast';

import { DashboardContext } from '../../DashboardContext';

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

export type ExpenseActionPermissions = {
  id: string;
  canDelete?: boolean;
  canApprove?: boolean;
  canUnapprove?: boolean;
  canReject?: boolean;
  canMarkAsSpam?: boolean;
  canPay?: boolean;
  canMarkAsPaid?: boolean;
  canMarkAsUnpaid?: boolean;
  canMarkAsIncomplete?: boolean;
  canSeeInvoiceInfo?: boolean;
  canEditTags?: boolean;
  canEditAccountingCategory?: boolean;
  canUnschedulePayment?: boolean;
  canHold?: boolean;
  canRelease?: boolean;
  approve?: {
    allowed: boolean;
    reason?: string;
    reasonDetails?: Record<string, unknown>;
  };
};

export type ExpenseActionQueryNode = {
  id: string;
  legacyId: number;
  type: Expense['type'];
  status?: Expense['status'];
  onHold?: boolean;
  permissions?: ExpenseActionPermissions;
  createdByAccount?: {
    id: string;
    slug: string;
    name: string;
    type: string;
    legacyId?: number;
  };
  account: {
    id: string;
    slug: string;
    name?: string;
    type: string;
  };
  host?: {
    id: string;
    slug: string;
  } | null;
};

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
  onDelete?: (expense: ExpenseActionQueryNode) => void;
};

export function useExpenseActions<T extends ExpenseActionQueryNode>({
  refetchList,
  resetFilters,
  onDelete,
}: UseExpenseActionsOptions = {}) {
  const intl = useIntl();
  const { showModal, showConfirmationModal } = useModal();
  const { LoggedInUser } = useLoggedInUser();
  const { account: dashboardAccount } = React.useContext(DashboardContext);
  const { copy, isCopied } = useClipboard();

  const [processExpense] = useMutation(processExpenseMutation);

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

    const isHostAdmin = LoggedInUser?.isAdminOfCollective(expense.host);

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

    const showConfirmModal = (type: ConfirmProcessExpenseModalType) => {
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
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Link copied!', id: 'X18xOQ' }),
      });
    };

    const handleDownloadInvoice = () => {
      return downloadInvoiceWith(expense)();
    };

    const canSeeInvoice =
      permissions.canSeeInvoiceInfo &&
      [expenseTypes.INVOICE, expenseTypes.SETTLEMENT, expenseTypes.PLATFORM_BILLING].includes(expense.type);

    const getTransactionsUrl = () => {
      if (dashboardAccount?.isHost && expense.host?.id === dashboardAccount.id) {
        return getDashboardRoute(expense.host, `host-transactions?expenseId=${expense.legacyId}`);
      } else if (dashboardAccount?.slug === expense.account?.slug) {
        return getDashboardRoute(expense.account, `transactions?expenseId=${expense.legacyId}`);
      }
      return null;
    };

    return {
      primary: compact([
        // Approve action (for Collective admins)
        permissions.canApprove && {
          key: 'approve',
          label: intl.formatMessage({ defaultMessage: 'Approve', id: 'QYfCQa' }),
          onClick: () => showConfirmModal('APPROVE'),
          Icon: Check,
        },
        // Reject action
        permissions.canReject && {
          key: 'reject',
          label: intl.formatMessage({ defaultMessage: 'Reject', id: 'actions.reject' }),
          onClick: () => showConfirmModal('REJECT'),
          Icon: MinusCircle,
        },
        // Unapprove action (for Collective context)
        permissions.canUnapprove &&
          !isHostAdmin && {
            key: 'unapprove',
            label: intl.formatMessage({ defaultMessage: 'Unapprove', id: 'O4qGZU' }),
            onClick: () => showConfirmModal('UNAPPROVE'),
            Icon: Undo2,
          },
        // Request re-approval (for Host context)
        permissions.canUnapprove &&
          isHostAdmin && {
            key: 'request-re-approval',
            label: intl.formatMessage({ defaultMessage: 'Request re-approval', id: 'expense.requestReApproval.btn' }),
            onClick: () => showConfirmModal('REQUEST_RE_APPROVAL'),
            Icon: Undo2,
          },
        // Hold action
        permissions.canHold && {
          key: 'hold',
          label: intl.formatMessage({ defaultMessage: 'Put On Hold', id: 'actions.hold' }),
          onClick: () => showConfirmModal('HOLD'),
          Icon: Pause,
        },
        // Release hold action
        permissions.canRelease && {
          key: 'release',
          label: intl.formatMessage({ defaultMessage: 'Release Hold', id: 'actions.release' }),
          onClick: () => showConfirmModal('RELEASE'),
          Icon: Play,
        },
        // Mark as incomplete
        permissions.canMarkAsIncomplete && {
          key: 'mark-as-incomplete',
          label: intl.formatMessage({ defaultMessage: 'Mark as Incomplete', id: 'actions.markAsIncomplete' }),
          onClick: () => showConfirmModal('MARK_AS_INCOMPLETE'),
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

            showConfirmModal('MARK_AS_SPAM');
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
          Icon: isCopied ? Check : Link,
        },
        // Download invoice (for invoice-type expenses)
        canSeeInvoice && {
          key: 'download-invoice',
          label: intl.formatMessage({ defaultMessage: 'Download Invoice', id: '+j9z3T' }),
          onClick: handleDownloadInvoice,
          Icon: Download,
        },
        // View transactions
        getTransactionsUrl() && {
          key: 'view-transactions',
          label: intl.formatMessage({ defaultMessage: 'View Transactions', id: 'viewTransactions' }),
          onClick: () => {
            const url = getTransactionsUrl();
            if (url) {
              window.location.href = url;
            }
          },
          Icon: Filter,
        },
      ]),
    };
  };

  return getActions;
}
