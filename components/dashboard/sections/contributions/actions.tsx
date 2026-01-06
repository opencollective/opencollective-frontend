import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { AlarmClockOff, ArrowLeftRightIcon, CircleCheckBig, LinkIcon, Pencil } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { ContributionDrawerQuery, ManagedOrderFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import { ContributionFrequency, OrderStatus, PaymentMethodType } from '../../../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { getWebsiteUrl } from '../../../../lib/utils';

import ContributionConfirmationModal from '../../../ContributionConfirmationModal';
import { getTransactionsUrl } from '../../../contributions/ContributionTimeline';
import { CopyID } from '../../../CopyId';
import type { EditOrderActions } from '../../../EditOrderModal';
import EditOrderModal from '../../../EditOrderModal';
import Link from '../../../Link';
import { useModal } from '../../../ModalContext';
import { useToast } from '../../../ui/useToast';

import CreatePendingContributionModal from './CreatePendingOrderModal';

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
        label: (
          <Link href={transactionsUrl.toString()} className="flex flex-row items-center gap-2.5">
            <ArrowLeftRightIcon size={16} className="text-muted-foreground" />
            <FormattedMessage defaultMessage="View transactions" id="DfQJQ6" />
          </Link>
        ),
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
      actions.primary.push({
        label: intl.formatMessage({ defaultMessage: 'Edit expected funds', id: 'hQAJH9' }),
        onClick: () => {
          showModal(
            CreatePendingContributionModal,
            {
              hostSlug: hostSlug || accountSlug,
              edit: order as React.ComponentProps<typeof CreatePendingContributionModal>['edit'],
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

    if (order.paymentMethod?.type === PaymentMethodType.HOST) {
      actions.primary.push({
        key: 'edit-funds',
        label: (
          <React.Fragment>
            <Pencil size={16} className="text-muted-foreground" />
            {intl.formatMessage({ defaultMessage: 'Edit funds', id: 'Kbjd3f' })}
          </React.Fragment>
        ),
        onClick: () => showEditOrderModal('editAddedFunds'),
      });
    }

    const toAccount = order.toAccount;
    const legacyId = order.legacyId;
    const orderUrl = new URL(`${toAccount.slug}/orders/${legacyId}`, getWebsiteUrl());

    actions.secondary.push({
      key: 'copy-link',
      label: (
        <CopyID
          Icon={null}
          value={orderUrl}
          tooltipLabel={<FormattedMessage defaultMessage="Copy link" id="CopyLink" />}
          className=""
        >
          <div className="flex flex-row items-center gap-2.5">
            <LinkIcon size={16} className="text-muted-foreground" />
            <FormattedMessage defaultMessage="Copy link" id="CopyLink" />
          </div>
        </CopyID>
      ),
      onClick: () => {},
    });

    return actions;
  };

  return getActions;
}
