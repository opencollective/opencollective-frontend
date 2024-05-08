import React from 'react';
import { FormattedMessage } from 'react-intl';

import { ContributionDrawerQuery, ContributionFrequency, OrderStatus } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

export type ContributionContextualMenuProps = {
  order?: ContributionDrawerQuery['order'];
  onResumeClick: (order: ContributionContextualMenuProps['order']) => void;
  onUpdatePaymentMethodClick: (order: ContributionContextualMenuProps['order']) => void;
  onEditAmountClick: (order: ContributionContextualMenuProps['order']) => void;
  onCancelClick: (order: ContributionContextualMenuProps['order']) => void;
  onMarkAsExpiredClick: (order: ContributionContextualMenuProps['order']) => void;
  onMarkAsCompletedClick: (order: ContributionContextualMenuProps['order']) => void;
} & React.PropsWithChildren;

export function ContributionContextualMenu(props: ContributionContextualMenuProps) {
  const { LoggedInUser } = useLoggedInUser();

  if (!props.order) {
    return null;
  }

  const order = props.order;

  const isAdminOfOrder = LoggedInUser.isAdminOfCollective(order.fromAccount);
  const canUpdateActiveOrder =
    order.frequency !== ContributionFrequency.ONETIME &&
    ![
      OrderStatus.PAUSED,
      OrderStatus.PROCESSING,
      OrderStatus.PENDING,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ].includes(order.status) &&
    isAdminOfOrder;

  const canResume = order.status === OrderStatus.PAUSED && order.permissions.canResume;
  const canCancel =
    isAdminOfOrder &&
    ![OrderStatus.CANCELLED, OrderStatus.PAID, OrderStatus.REFUNDED].includes(order.status) &&
    order.frequency !== ContributionFrequency.ONETIME;
  const canMarkAsCompleted = order.status === OrderStatus.PENDING && order.permissions.canMarkAsPaid;
  const canMarkAsExpired = order.status === OrderStatus.PENDING && order.permissions.canMarkAsExpired;

  const canDoActions = [canUpdateActiveOrder, canResume, canCancel, canMarkAsCompleted, canMarkAsExpired];

  if (!canDoActions.some(Boolean)) {
    return null;
  }

  return (
    <div role="menu" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} tabIndex={0}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{props.children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" data-cy="recurring-contribution-menu">
          {canUpdateActiveOrder && (
            <DropdownMenuItem onClick={() => props.onUpdatePaymentMethodClick(order)}>
              <FormattedMessage id="subscription.menu.editPaymentMethod" defaultMessage="Update payment method" />
            </DropdownMenuItem>
          )}

          {canResume && (
            <DropdownMenuItem onClick={() => props.onResumeClick(order)}>
              <FormattedMessage defaultMessage="Resume contribution" id="51nF6S" />
            </DropdownMenuItem>
          )}
          {canUpdateActiveOrder && (
            <DropdownMenuItem onClick={() => props.onEditAmountClick(order)}>
              <FormattedMessage id="subscription.menu.updateAmount" defaultMessage="Update amount" />
            </DropdownMenuItem>
          )}

          {canMarkAsCompleted && (
            <DropdownMenuItem onClick={() => props.onMarkAsCompletedClick(order)}>
              <FormattedMessage id="order.markAsCompleted" defaultMessage="Mark as completed" />
            </DropdownMenuItem>
          )}

          {canMarkAsExpired && (
            <DropdownMenuItem className="text-red-600" onClick={() => props.onMarkAsExpiredClick(order)}>
              <FormattedMessage id="order.markAsExpired" defaultMessage="Mark as expired" />
            </DropdownMenuItem>
          )}

          {(canUpdateActiveOrder || canResume) && canCancel && <DropdownMenuSeparator />}
          {canCancel && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => props.onCancelClick(order)}
              data-cy="recurring-contribution-menu-cancel-option"
            >
              <FormattedMessage id="subscription.menu.cancelContribution" defaultMessage="Cancel contribution" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
