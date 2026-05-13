import { Download, ExternalLink, Filter, Undo2 } from 'lucide-react';
import type React from 'react';
import { useIntl } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import type { ContributionDrawerQuery } from '../../lib/graphql/types/v2/graphql';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { saveInvoice } from '../../lib/transactions';

import { HostRefundChargeModal } from '../dashboard/sections/transactions/HostRefundChargeModal';
import { useModal } from '../ModalContext';

type ChargeActionTransaction = ContributionDrawerQuery['order']['transactions'][number];

type UseChargeActionsOptions = {
  resetFilters?: (filters: Record<string, unknown>, redirectTo?: string) => void;
  refetchList?: () => void;
  redirectRelatedTransactionsTo?: string;
};

/**
 * Actions menu used in the Charges section of the ContributionDrawer.
 *
 * Distinct from {@link useTransactionActions}: this set is intentionally narrow
 * (Refund / View transactions / Download receipt) and the Refund flow opens
 * the host-focused {@link HostRefundChargeModal} instead of the bare
 * confirmation dialog.
 */
export function useChargeActions<T extends ChargeActionTransaction>({
  resetFilters,
  refetchList,
  redirectRelatedTransactionsTo,
}: UseChargeActionsOptions = {}) {
  const intl = useIntl();
  const { showModal } = useModal();
  const { LoggedInUser } = useLoggedInUser();

  const { callWith: downloadInvoiceWith } = useAsyncCall(saveInvoice, { useErrorToast: true });

  const getActions: GetActions<T> = (
    transaction: T,
    onCloseFocusRef?: React.MutableRefObject<HTMLElement>,
    refetch?: () => void,
  ) => {
    if (!transaction) {
      return {};
    }

    const isHostAdmin = Boolean(transaction.host && LoggedInUser?.isAdminOfCollective(transaction.host));
    const onMutationSuccess = () => {
      refetchList?.();
      refetch?.();
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
          if: isHostAdmin && transaction.permissions?.canRefund && !transaction.isRefunded,
          onClick: () => {
            showModal(
              HostRefundChargeModal,
              {
                transaction: { id: transaction.id },
                onSuccess: onMutationSuccess,
                onCloseFocusRef,
              },
              `host-refund-charge-${transaction.id}`,
            );
          },
          Icon: Undo2,
        },
      ].filter(a => a.if ?? true),
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
              },
              redirectRelatedTransactionsTo,
            ),
          Icon: Filter,
          if: Boolean(transaction.group && resetFilters),
        },
        {
          key: 'download',
          label: transaction.expense
            ? intl.formatMessage({ defaultMessage: 'Download Invoice', id: '+j9z3T' })
            : intl.formatMessage({ defaultMessage: 'Download Receipt', id: 'Mwh/vo' }),
          onClick: handleDownloadInvoice,
          if: Boolean(transaction.permissions?.canDownloadInvoice),
          Icon: Download,
        },
      ].filter(a => a.if ?? true),
    };
  };

  return getActions;
}
