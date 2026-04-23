import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { AlarmClockOff, ArrowLeftRightIcon, CircleCheckBig, LinkIcon, Pencil, Settings2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { ContributionDrawerQuery, ManagedOrderFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import { ContributionFrequency, OrderStatus, PaymentMethodType } from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { getPermalinkUrl } from '../../../../lib/url-helpers';
import useClipboard from '@/lib/hooks/useClipboard';

import ContributionConfirmationModal from '../../../ContributionConfirmationModal';
import { getTransactionsUrl } from '../../../contributions/ContributionTimeline';
import type { EditOrderActions } from '../../../EditOrderModal';
import EditOrderModal from '../../../EditOrderModal';
import { useModal } from '../../../ModalContext';
import { useToast } from '../../../ui/useToast';

import CreatePendingContributionModal from './CreatePendingOrderModal';
import ManageContributionModal from './ManageContributionModal';

const expireOrderMutation = gql`
  mutation ContributionsExpireOrder($orderId: Int) {
    processPendingOrder(order: { legacyId: $orderId }, action: MARK_AS_EXPIRED) {
      id
      status
      permissions {
        id
        canMarkAsPaid
        canMarkAsExpired
      }
      activities {
        nodes {
          id
        }
      }
    }
  }
`;

type UseContributionActionsOptions = {
  accountSlug: string;
  hostSlug?: string;
  refetchList?: () => void;
};

export function useContributionActions<T extends ManagedOrderFieldsFragment | ContributionDrawerQuery['order']>({
  accountSlug,
  hostSlug,
  refetchList,
}: UseContributionActionsOptions) {
  const intl = useIntl();
  const { toast } = useToast();
  const { showModal, showConfirmationModal } = useModal();
  const { LoggedInUser } = useLoggedInUser();
  const { copy } = useClipboard();

  const [expireOrder] = useMutation(expireOrderMutation);

  const getActions: GetActions<T> = (
    order: T,
    onCloseFocusRef?: React.MutableRefObject<HTMLElement>,
    refetch?: () => void,
  ) => {
    if (!order) {
      return null;
    }

    const onMutationSuccess = () => {
      refetchList?.();
      refetch?.();
    };

    const transactionsUrl = getTransactionsUrl(LoggedInUser, order);
    transactionsUrl.searchParams.set('orderId', order.legacyId.toString());

    const actions: ReturnType<GetActions<ManagedOrderFieldsFragment>> = {
      primary: [],
      secondary: [],
    };

    const isAdminOfOrder = LoggedInUser.isAdminOfCollective(order.fromAccount);
    const isHostAdminOfToAccount = LoggedInUser?.isHostAdmin(order.toAccount);
    const isSingleContribution = order.frequency === ContributionFrequency.ONETIME;
    const hasRefundableTransactions = order.transactions?.some(
      transaction => transaction?.permissions?.canRefund && !transaction.isRefund && !transaction.isRefunded,
    );
    const isCancelledRecurringWithoutRefundableTransactions =
      order.frequency !== ContributionFrequency.ONETIME &&
      order.status === OrderStatus.CANCELLED &&
      !order.permissions.canHostRefund;
    const canManageAsHost =
      isHostAdminOfToAccount &&
      !isCancelledRecurringWithoutRefundableTransactions &&
      (!isSingleContribution || hasRefundableTransactions) &&
      ![OrderStatus.PENDING, OrderStatus.EXPIRED, OrderStatus.REJECTED, OrderStatus.REFUNDED].includes(order.status);
    const canUpdateActiveOrder =
      order.frequency !== ContributionFrequency.ONETIME &&
      ![
        OrderStatus.PAUSED,
        OrderStatus.PROCESSING,
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED,
        OrderStatus.REJECTED,
      ].includes(order.status) &&
      isAdminOfOrder;

    const canResume = order.status === OrderStatus.PAUSED && order.permissions.canResume;
    const canCancel =
      isAdminOfOrder &&
      ![OrderStatus.CANCELLED, OrderStatus.PAID, OrderStatus.REFUNDED, OrderStatus.REJECTED].includes(order.status) &&
      order.frequency !== ContributionFrequency.ONETIME;
    const canMarkAsCompleted =
      [OrderStatus.PENDING, OrderStatus.EXPIRED].includes(order.status) && order.permissions.canMarkAsPaid;
    const canMarkAsExpired = order.status === OrderStatus.PENDING && order.permissions.canMarkAsExpired;
    const isExpectedFunds = !!order.pendingContributionData?.expectedAt;

    const showEditOrderModal = (action: EditOrderActions) => {
      showModal(
        EditOrderModal,
        {
          accountSlug,
          order,
          action,
          onSuccess: onMutationSuccess,
          onCloseFocusRef,
        },
        `edit-order-${order.id}-${action}`,
      );
    };

    if (![OrderStatus.PENDING, OrderStatus.EXPIRED].includes(order.status)) {
      actions.secondary.push({
        key: 'view-transactions',
        Icon: ArrowLeftRightIcon,
        href: transactionsUrl.toString(),
        label: intl.formatMessage({ defaultMessage: 'View transactions', id: 'DfQJQ6' }),
        onClick: () => {},
      });
    }

    if (canUpdateActiveOrder) {
      actions.primary.push({
        label: intl.formatMessage({
          defaultMessage: 'Update payment method',
          id: 'subscription.menu.editPaymentMethod',
        }),
        onClick: () => showEditOrderModal('editPaymentMethod'),
        key: 'update-payment-method',
      });
    }

    if (canResume) {
      actions.primary.push({
        label: intl.formatMessage({ defaultMessage: 'Resume contribution', id: '51nF6S' }),
        onClick: () => showEditOrderModal('editPaymentMethod'),
        key: 'resume-contribution',
      });
    }

    if (canUpdateActiveOrder) {
      actions.primary.push({
        label: intl.formatMessage({ defaultMessage: 'Update amount', id: 'subscription.menu.updateAmount' }),
        onClick: () => showEditOrderModal('editAmount'),
        key: 'update-amount',
      });
    }

    if (isExpectedFunds && (canMarkAsExpired || canMarkAsCompleted)) {
      actions.secondary.push({
        label: intl.formatMessage({ defaultMessage: 'Edit expected funds', id: 'hQAJH9' }),
        Icon: Pencil,
        onClick: () => {
          showModal(
            CreatePendingContributionModal,
            {
              hostSlug: hostSlug || accountSlug,
              edit: order as unknown as React.ComponentProps<typeof CreatePendingContributionModal>['edit'],
              onSuccess: onMutationSuccess,
              onCloseFocusRef,
            },
            `edit-expected-funds-${order.id}`,
          );
        },
        key: 'edit',
      });
    }

    if (canMarkAsCompleted) {
      actions.primary.push({
        label: intl.formatMessage({ defaultMessage: 'Add received funds', id: 'order.addReceivedFunds' }),
        onClick: () => {
          showModal(
            ContributionConfirmationModal,
            {
              order: order as React.ComponentProps<typeof ContributionConfirmationModal>['order'],
              onSuccess: onMutationSuccess,
              onCloseFocusRef,
            },
            `confirm-contribution-${order.id}`,
          );
        },
        Icon: CircleCheckBig,
        'data-cy': 'MARK_AS_PAID-button',
        key: 'mark-as-paid',
      });
    }

    if (canMarkAsExpired) {
      actions.primary.push({
        label: intl.formatMessage({ defaultMessage: 'Expire', id: 'order.expire' }),
        onClick: () => {
          showConfirmationModal(
            {
              title: (
                <FormattedMessage id="Order.MarkExpiredConfirm" defaultMessage="Mark this contribution as expired?" />
              ),
              description: (
                <FormattedMessage
                  id="Order.MarkPaidExpiredDetails"
                  defaultMessage="This contribution will be marked as expired removed from Expected Funds. You can find this page by searching for its ID in the search bar or through the status filter in the Financial Contributions page."
                />
              ),
              onConfirm: async () => {
                await expireOrder({
                  variables: {
                    orderId: order.legacyId,
                  },
                });
                toast({
                  variant: 'success',
                  message: intl.formatMessage({
                    defaultMessage: 'The contribution has been marked as expired',
                    id: '46L6cy',
                  }),
                });
                onMutationSuccess();
              },
              confirmLabel: <FormattedMessage id="order.markAsExpired" defaultMessage="Mark as expired" />,
              onCloseFocusRef,
            },
            `mark-as-expired-${order.id}`,
          );
        },
        Icon: AlarmClockOff,
        'data-cy': 'MARK_AS_EXPIRED-button',
        key: 'mark-as-expired',
      });
    }

    if (canCancel) {
      actions.secondary.push({
        key: 'cancel-contribution',
        label: intl.formatMessage({
          defaultMessage: 'Cancel contribution',
          id: 'subscription.menu.cancelContribution',
        }),
        onClick: () => showEditOrderModal('cancel'),
        'data-cy': 'recurring-contribution-menu-cancel-option',
      });
    }

    if (canManageAsHost) {
      actions.primary.push({
        key: 'manage-contribution-as-host',
        Icon: Settings2,
        label: isSingleContribution
          ? intl.formatMessage({ defaultMessage: 'Refund', id: 'Refund' })
          : intl.formatMessage({ defaultMessage: 'Manage contribution', id: 'ManageOrder.Action' }),
        onClick: () => {
          showModal(
            ManageContributionModal,
            {
              order: { id: order.id, legacyId: order.legacyId },
              onSuccess: onMutationSuccess,
              onCloseFocusRef,
            },
            `manage-contribution-${order.id}`,
          );
        },
        'data-cy': 'manage-contribution-host-admin',
      });
    }

    if (order.paymentMethod?.type === PaymentMethodType.HOST) {
      actions.primary.push({
        key: 'edit-funds',
        Icon: Pencil,
        label: intl.formatMessage({ defaultMessage: 'Edit funds', id: 'Kbjd3f' }),
        onClick: () => showEditOrderModal('editAddedFunds'),
      });
    }

    actions.secondary.push({
      key: 'copy-link',
      Icon: LinkIcon,
      label: intl.formatMessage({ defaultMessage: 'Copy link', id: 'CopyLink' }),
      onClick: e => {
        e.preventDefault();
        copy(getPermalinkUrl(order.publicId));
        toast({
          message: <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />,
          variant: 'success',
        });
      },
    });

    return actions;
  };

  return getActions;
}
