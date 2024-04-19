import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Download, Filter, MinusCircle, Undo2 } from 'lucide-react';
import { useIntl } from 'react-intl';

import TransactionRefundModal from '../../components/dashboard/sections/transactions/TransactionRefundModal';
import TransactionRejectModal from '../../components/dashboard/sections/transactions/TransactionRejectModal';
import { useModal } from '../../components/ModalContext';

import { Transaction } from '../graphql/types/v2/graphql';
import { useAsyncCall } from '../hooks/useAsyncCall';
import { saveInvoice } from '../transactions';

import { ActionType, GetActions } from './types';

export const useTransactionActions = ({ resetFilters, refetchList }) => {
  const intl = useIntl();

  const { showModal } = useModal();

  const { callWith: downloadInvoiceWith } = useAsyncCall(saveInvoice, { useErrorToast: true });
  const handleDownloadInvoice = transaction => {
    const params = transaction?.expense?.id
      ? { expenseId: transaction?.expense?.id }
      : { transactionUuid: transaction?.uuid, toCollectiveSlug: transaction?.toAccount?.slug };
    const download = downloadInvoiceWith(params);
    return download();
  };

  const getActions: GetActions<Transaction> = (
    transaction: Transaction,
    onCloseFocusRef?: React.RefObject<HTMLElement>,
    refetch?: () => void,
  ) => {
    if (!transaction) {
      return [];
    }
    const onMutationSuccess = () => {
      refetchList?.();
      refetch?.();
    };
    return [
      {
        type: ActionType.PRIMARY,
        label: intl.formatMessage({ defaultMessage: 'Refund', id: 'Refund' }),
        if: transaction?.permissions.canRefund,
        onClick: () => {
          showModal(
            TransactionRefundModal,
            {
              id: transaction.id,
              onMutationSuccess,
            },
            onCloseFocusRef,
          );
        },
        Icon: Undo2,
      },
      {
        type: ActionType.PRIMARY,
        label: intl.formatMessage({ defaultMessage: 'Reject', id: 'actions.reject' }),
        if: transaction?.permissions.canReject,
        onClick: () => {
          showModal(
            TransactionRejectModal,
            {
              id: transaction.id,
              onMutationSuccess,
              canRefund: transaction.permissions.canRefund && !transaction.isRefunded,
            },
            onCloseFocusRef,
          );
        },
        Icon: MinusCircle,
      },
      {
        type: ActionType.SECONDARY,
        label: intl.formatMessage({ defaultMessage: 'View related transactions', id: '+9+Ty6' }),
        onClick: () =>
          resetFilters({
            group: [transaction.group, transaction.refundTransaction?.group].filter(Boolean),
          }),
        Icon: Filter,
        if: Boolean(transaction.group),
      },
      {
        type: ActionType.SECONDARY,
        label: transaction?.expense
          ? intl.formatMessage({ defaultMessage: 'Download Invoice', id: '+j9z3T' })
          : intl.formatMessage({ defaultMessage: 'Download Receipt', id: 'Mwh/vo' }),
        onClick: () => handleDownloadInvoice(transaction),
        if: transaction?.permissions.canDownloadInvoice,
        Icon: Download,
      },
    ].filter(a => a.if ?? true);
  };

  return getActions;
};
