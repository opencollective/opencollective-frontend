import { gql, useMutation } from '@apollo/client';
import { Download, Filter, MinusCircle, Undo2 } from 'lucide-react';
import type React from 'react';
import { useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { useAsyncCall } from '../../../../lib/hooks/useAsyncCall';
import { saveInvoice } from '../../../../lib/transactions';

import { useModal } from '../../../ModalContext';
import { toast } from '../../../ui/useToast';

import TransactionRejectModal from './TransactionRejectModal';
import type { TransactionsTableQueryNode } from './types';

const refundTransactionMutation = gql`
  mutation RefundTransaction($transaction: TransactionReferenceInput!) {
    refundTransaction(transaction: $transaction) {
      id
      order {
        id
        status
        activities {
          nodes {
            id
            type
            createdAt
          }
        }
        transactions {
          id
          createdAt
        }
      }
      expense {
        id
        status
      }
    }
  }
`;

export function useTransactionActions<T extends TransactionsTableQueryNode>({
  resetFilters = null,
  refetchList = null,
} = {}) {
  const intl = useIntl();

  const { showModal, showConfirmationModal } = useModal();

  const [refundTransaction] = useMutation(refundTransactionMutation, {
    context: API_V2_CONTEXT,
  });

  const { callWith: downloadInvoiceWith } = useAsyncCall(saveInvoice, { useErrorToast: true });

  const getActions: GetActions<T> = (
    transaction: T,
    onCloseFocusRef?: React.MutableRefObject<HTMLElement>,
    refetch?: () => void,
  ) => {
    if (!transaction) {
      return {};
    }
    const onMutationSuccess = () => {
      refetchList?.();
      refetch?.();
    };

    const handleRefundTransaction = async () => {
      await refundTransaction({ variables: { transaction: { id: transaction.id } } });
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Transaction refunded', id: 's766TH' }),
      });
      onMutationSuccess?.();
    };

    const handleDownloadInvoice = async () => {
      const params = transaction.expense?.id
        ? { expenseId: transaction.expense.id }
        : { transactionUuid: transaction.uuid, toCollectiveSlug: transaction.toAccount?.slug };
      const download = downloadInvoiceWith(params);
      return download();
    };

    return {
      primary: [
        {
          key: 'refund',
          label: intl.formatMessage({ defaultMessage: 'Refund', id: 'Refund' }),
          if: transaction?.permissions.canRefund && !transaction.isRefunded,
          onClick: () => {
            showConfirmationModal({
              title: intl.formatMessage({
                defaultMessage: 'Are you sure you want to refund this transaction?',
                id: 'RL9ufl',
              }),
              description: intl.formatMessage({
                defaultMessage:
                  'Refunding will reimburse the full amount back to your contributor. They can contribute again in the future.',
                id: 'Ntm6k6',
              }),
              onConfirm: handleRefundTransaction,
              confirmLabel: intl.formatMessage({ defaultMessage: 'Refund', id: 'Refund' }),
              ConfirmIcon: Undo2,
              onCloseFocusRef,
            });
          },
          Icon: Undo2,
        },
        {
          key: 'reject',
          label: intl.formatMessage({ defaultMessage: 'Reject', id: 'actions.reject' }),
          if: transaction?.permissions.canReject,
          onClick: () => {
            showModal(
              TransactionRejectModal,
              {
                id: transaction.id,
                onMutationSuccess,
                canRefund: transaction.permissions.canRefund && !transaction.isRefunded,
                onCloseFocusRef,
              },
              `reject-transaction-${transaction.id}`,
            );
          },
          Icon: MinusCircle,
        },
      ].filter(a => a.if ?? true),
      secondary: [
        {
          key: 'view-transactions',
          label: intl.formatMessage({ defaultMessage: 'View related transactions', id: '+9+Ty6' }),
          onClick: () =>
            resetFilters?.({
              group: [transaction.group, transaction.refundTransaction?.group].filter(Boolean),
            }),
          Icon: Filter,
          if: Boolean(transaction.group),
        },
        {
          key: 'download',
          label: transaction?.expense
            ? intl.formatMessage({ defaultMessage: 'Download Invoice', id: '+j9z3T' })
            : intl.formatMessage({ defaultMessage: 'Download Receipt', id: 'Mwh/vo' }),
          onClick: handleDownloadInvoice,
          if: Boolean(transaction?.permissions.canDownloadInvoice),
          Icon: Download,
        },
      ].filter(a => a.if ?? true),
    };
  };

  return getActions;
}
