import React from 'react';
import { CheckCircle as CheckIcon } from '@styled-icons/boxicons-regular/CheckCircle';
import { Ban as RejectedIcon } from '@styled-icons/fa-solid/Ban';
import { Cogs as CogsIcon } from '@styled-icons/fa-solid/Cogs';
import { AlertOctagon as ErrorIcon } from '@styled-icons/feather/AlertOctagon';
import { Edit as EditIcon } from '@styled-icons/feather/Edit';
import { FileText as InvitedIcon } from '@styled-icons/feather/FileText';
import { Pause as PauseIcon } from '@styled-icons/feather/Pause';
import { Play as PlayIcon } from '@styled-icons/feather/Play';
import { Plus as PlusIcon } from '@styled-icons/feather/Plus';
import { UserCheck as ApprovedIcon } from '@styled-icons/feather/UserCheck';
import { UserMinus as UnapprovedIcon } from '@styled-icons/feather/UserMinus';
import { SyncAlt as MoveIcon } from '@styled-icons/material/SyncAlt';
import { Update as UpdateIcon } from '@styled-icons/material/Update';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';

import { renderDetailsString } from '../../lib/transactions';
import type { Transaction } from '@/lib/graphql/types/v2/schema';

import { Box as Container } from '../Grid';
/**
 * Defines activities display metadata.
 * **All** keys must have a matching entry in `MESSAGES` below.
 */
export const ACTIVITIES_INFO = {
  COLLECTIVE_EXPENSE_CREATED: {
    type: 'info',
    icon: PlusIcon,
    message: defineMessage({
      id: 'Expense.Activity.Created',
      defaultMessage: 'Expense created',
    }),
  },
  COLLECTIVE_EXPENSE_APPROVED: {
    type: 'info',
    icon: ApprovedIcon,
    message: defineMessage({
      id: 'Expense.Activity.Approved',
      defaultMessage: 'Expense approved',
    }),
  },
  COLLECTIVE_EXPENSE_MOVED: {
    type: 'info',
    icon: MoveIcon,
    message: defineMessage({
      defaultMessage: 'Expense moved from {movedFromCollective}',
      id: '6EnwoZ',
    }),
  },
  COLLECTIVE_EXPENSE_UNAPPROVED: {
    type: 'warning',
    icon: UnapprovedIcon,
    message: defineMessage({
      id: 'Expense.Activity.Unapproved',
      defaultMessage: 'Expense unapproved',
    }),
  },
  COLLECTIVE_EXPENSE_RE_APPROVAL_REQUESTED: {
    type: 'warning',
    icon: UnapprovedIcon,
    message: defineMessage({
      id: 'Expense.Activity.ReApprovalRequested',
      defaultMessage: 'Re-approval requested',
    }),
  },
  COLLECTIVE_EXPENSE_UPDATED: {
    type: 'info',
    icon: EditIcon,
    message: defineMessage({
      id: 'Expense.Activity.Updated',
      defaultMessage: 'Expense updated',
    }),
  },
  COLLECTIVE_EXPENSE_MARKED_AS_UNPAID: {
    type: 'info',
    icon: UpdateIcon,
    message: defineMessage({
      id: 'Expense.Activity.MarkedAsUnpaid',
      defaultMessage: 'Expense marked as unpaid',
    }),
  },
  COLLECTIVE_EXPENSE_REJECTED: {
    type: 'error',
    icon: RejectedIcon,
    message: defineMessage({
      id: 'Expense.Activity.Rejected',
      defaultMessage: 'Expense rejected',
    }),
  },
  COLLECTIVE_EXPENSE_INVITE_DRAFTED: {
    type: 'info',
    icon: InvitedIcon,
    message: defineMessage({
      id: 'Expense.Activity.Invite.Drafted',
      defaultMessage: 'Expense invited',
    }),
  },
  COLLECTIVE_EXPENSE_PAID: {
    type: 'success',
    icon: CheckIcon,
    message: defineMessage({
      id: 'Expense.Activity.Paid',
      defaultMessage: 'Expense paid',
    }),
    DataRenderer: ExpenseTransactionRenderer,
  },
  COLLECTIVE_EXPENSE_PROCESSING: {
    type: 'info',
    icon: CogsIcon,
    message: defineMessage({
      id: 'Expense.Activity.Processing',
      defaultMessage: 'Expense processing',
    }),
    renderDetails: ({ estimatedDelivery, reference }) =>
      estimatedDelivery &&
      reference && (
        <FormattedMessage
          defaultMessage="Estimated delivery: {estimatedDelivery, date, medium} {estimatedDelivery, time, short}. Reference: {reference}."
          id="xqDu0y"
          values={{ estimatedDelivery: new Date(estimatedDelivery), reference }}
        />
      ),
  },
  COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT: {
    type: 'info',
    icon: CogsIcon,
    message: defineMessage({
      id: 'Expense.Activity.ScheduledForPayment',
      defaultMessage: 'Expense scheduled for payment',
    }),
  },
  COLLECTIVE_EXPENSE_ERROR: {
    type: 'error',
    icon: ErrorIcon,
    message: defineMessage({
      id: 'Expense.Activity.Error',
      defaultMessage: 'Expense error',
    }),
  },
  COLLECTIVE_EXPENSE_MARKED_AS_SPAM: {
    type: 'error',
    icon: RejectedIcon,
    message: defineMessage({
      id: 'Expense.Activity.MarkedAsSpam',
      defaultMessage: 'Expense marked as spam',
    }),
  },
  COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE: {
    type: 'warning',
    icon: UnapprovedIcon,
    message: defineMessage({
      id: 'Expense.Activity.MarkedAsIncomplete',
      defaultMessage: 'Expense marked as incomplete',
    }),
  },
  COLLECTIVE_EXPENSE_PUT_ON_HOLD: {
    type: 'error',
    icon: PauseIcon,
    message: defineMessage({
      id: 'Expense.Activity.PutOnHold',
      defaultMessage: 'Expense was put on hold',
    }),
  },
  COLLECTIVE_EXPENSE_RELEASED_FROM_HOLD: {
    type: 'info',
    icon: PlayIcon,
    message: defineMessage({
      id: 'Expense.Activity.ReleasedFromHold',
      defaultMessage: 'Expense was released from hold',
    }),
  },
  COLLECTIVE_EXPENSE_INVITE_DECLINED: {
    type: 'error',
    icon: RejectedIcon,
    message: defineMessage({
      id: 'Expense.Activity.Invite.Declined',
      defaultMessage: 'Expense invite declined',
    }),
  },
};

export const getActivityColors = (activityType, theme) => {
  switch (ACTIVITIES_INFO[activityType]?.type) {
    case 'info':
      return { text: theme.colors.blue[500], border: theme.colors.blue[500] };
    case 'success':
      return { text: theme.colors.green[500], border: theme.colors.green[500] };
    case 'error':
      return { text: theme.colors.red[500], border: theme.colors.red[500] };
    default:
      return { text: theme.colors.black[700], border: theme.colors.black[400] };
  }
};

export const getActivityIcon = (activity, theme, size = 18) => {
  const IconComponent = ACTIVITIES_INFO[activity.type]?.icon || UpdateIcon;
  const colors = getActivityColors(activity.type, theme);
  return <IconComponent size={size} color={colors.border} />;
};

export const isSupportedActivity = activity => {
  return Object.prototype.hasOwnProperty.call(ACTIVITIES_INFO, activity.type);
};

interface ExpenseTransactionRendererProps {
  activity?: {
    transaction: Pick<Transaction, 'type'> & Parameters<typeof renderDetailsString>[0];
  };
}

function ExpenseTransactionRenderer({ activity }: ExpenseTransactionRendererProps) {
  const intl = useIntl();
  if (!activity.transaction) {
    return null;
  }

  return (
    <Container fontSize="12px" mt={2}>
      {renderDetailsString({
        ...activity.transaction,
        isCredit: activity.transaction.type === 'CREDIT',
        intl,
      })}
    </Container>
  );
}
