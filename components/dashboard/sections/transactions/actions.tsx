import { gql, useMutation } from '@apollo/client';
import { compact } from 'lodash';
import { Download, ExternalLink, Filter, MinusCircle, Undo2 } from 'lucide-react';
import type React from 'react';
import { useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { TransactionDetailsQuery } from '../../../../lib/graphql/types/v2/graphql';
import { PaymentMethodService } from '../../../../lib/graphql/types/v2/graphql';
import { useAsyncCall } from '../../../../lib/hooks/useAsyncCall';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { saveInvoice } from '../../../../lib/transactions';

import { useModal } from '../../../ModalContext';
import { toast } from '../../../ui/useToast';

import { HostRefundChargeModal } from './HostRefundChargeModal';
import TransactionRejectModal from './TransactionRejectModal';
import type { TransactionsTableQueryNode } from './types';

type TransactionActionKey = 'refund' | 'reject' | 'view-payment-processor' | 'view-transactions' | 'download';

type UseTransactionActionsOptions = {
  resetFilters?: (filters: Record<string, unknown>, redirectTo?: string) => void;
  refetchList?: () => void;
  redirectRelatedTransactionsTo?: string;
  excludeActions?: TransactionActionKey[];
};

const refundTransactionMutation = gql`
  mutation RefundTransaction($transaction: TransactionReferenceInput!, $ignoreBalanceCheck: Boolean) {
    refundTransaction(transaction: $transaction, ignoreBalanceCheck: $ignoreBalanceCheck) {
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

export function useTransactionActions<T extends TransactionsTableQueryNode | TransactionDetailsQuery['transaction']>({
  resetFilters = null,
  refetchList = null,
  redirectRelatedTransactionsTo = undefined,
  excludeActions = [],
}: UseTransactionActionsOptions = {}) {
  const intl = useIntl();

  const { showModal, showConfirmationModal } = useModal();

  const { LoggedInUser } = useLoggedInUser();

  const [refundTransaction] = useMutation(refundTransactionMutation);

  const { callWith: downloadInvoiceWith } = useAsyncCall(saveInvoice, { useErrorToast: true });
  const excludedActions = new Set(excludeActions);

  const getActions: GetActions<T> = (
    transaction: T,
    onCloseFocusRef?: React.MutableRefObject<HTMLElement>,
    refetch?: () => void,
  ) => {
    if (!transaction) {
      return {};
    }

    const isFiscalHostAdmin = LoggedInUser.isAdminOfCollective(transaction.host);
    const isContributionCharge = Boolean(
      transaction.order &&
      transaction.paymentMethod?.service &&
      [PaymentMethodService.PAYPAL, PaymentMethodService.STRIPE].includes(transaction.paymentMethod.service),
    );

    const onMutationSuccess = () => {
      refetchList?.();
      refetch?.();
    };

    const handleRefundTransaction = async props => {
      await refundTransaction({
        variables: { transaction: { id: transaction.id }, ignoreBalanceCheck: props?.ignoreBalanceCheck },
      });
      toast({
        variant: 'success',
        message: intl.formatMessage({ defaultMessage: 'Transaction refunded', id: 's766TH' }),
      });
      onMutationSuccess();
    };

    const handleDownloadInvoice = async () => {
      const params = transaction.expense?.id
        ? { expenseId: transaction.expense.id }
        : { transactionUuid: transaction.id };

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
            if (isContributionCharge && isFiscalHostAdmin) {
              showModal(
                HostRefundChargeModal,
                {
                  transaction: { id: transaction.id },
                  onSuccess: onMutationSuccess,
                  onCloseFocusRef,
                },
                `host-refund-charge-${transaction.id}`,
              );
            } else {
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
                checks: compact([
                  isFiscalHostAdmin && {
                    id: 'ignoreBalanceCheck',
                    label: intl.formatMessage({
                      defaultMessage: 'Ignore Collective balance check',
                      id: 'OGmPSV',
                    }),
                  },
                ]),
                onConfirm: handleRefundTransaction,
                confirmLabel: intl.formatMessage({ defaultMessage: 'Refund', id: 'Refund' }),
                ConfirmIcon: Undo2,
                onCloseFocusRef,
              });
            }
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
      ].filter(action => !excludedActions.has(action.key as TransactionActionKey) && (action.if ?? true)),
      secondary: [
        {
          key: 'view-payment-processor',
          label: intl.formatMessage({ defaultMessage: 'View in payment processor', id: 'NgSLbI' }),
          href: transaction.paymentProcessorUrl,
          Icon: ExternalLink,
          if: Boolean(transaction.paymentProcessorUrl),
        },
        {
          key: 'view-transactions',
          label: intl.formatMessage({ defaultMessage: 'View related transactions', id: '+9+Ty6' }),
          onClick: () =>
            resetFilters?.(
              {
                group: [transaction.group, transaction.refundTransaction?.group].filter(Boolean),
                orderId: transaction.order?.legacyId,
              },
              redirectRelatedTransactionsTo,
            ),
          Icon: Filter,
          if: Boolean(transaction.group && resetFilters),
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
      ].filter(action => !excludedActions.has(action.key as TransactionActionKey) && (action.if ?? true)),
    };
  };

  return getActions;
}
