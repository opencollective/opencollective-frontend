import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
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
import styled, { useTheme } from 'styled-components';

import { renderDetailsString } from '../../lib/transactions';

import Avatar from '../Avatar';
import DateTime from '../DateTime';
import { Box as Container, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

const ExpenseTransactionRenderer = ({ activity }) => {
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
};

ExpenseTransactionRenderer.propTypes = {
  activity: PropTypes.object,
};

/**
 * Defines activities display metadata.
 * **All** keys must have a matching entry in `MESSAGES` below.
 */
const ACTIVITIES_INFO = {
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
};

const getActivityColors = (activityType, theme) => {
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

export const getActivityIcon = (activity, theme) => {
  const IconComponent = ACTIVITIES_INFO[activity.type]?.icon || UpdateIcon;
  const colors = getActivityColors(activity.type, theme);
  return <IconComponent size={18} color={colors.border} />;
};

export const isSupportedActivity = activity => {
  return Object.prototype.hasOwnProperty.call(ACTIVITIES_INFO, activity.type);
};

const ActivityParagraph = styled(Container)`
  padding: 10px 12px;
  border-left: 4px solid ${props => props.activityColor};
  border-radius: 0;
`;

const ActivityMessage = styled.span`
  font-size: 10px;
  font-weight: 600;
  background: white;
  color: ${props => props.color};
`;

const ThreadActivity = ({ activity }) => {
  const intl = useIntl();
  const theme = useTheme();
  const activityColors = getActivityColors(activity.type, theme);
  const message = ACTIVITIES_INFO[activity.type]?.message;
  const details = activity.data?.message || activity.data?.error?.message;
  const DataRenderer = ACTIVITIES_INFO[activity.type]?.DataRenderer;

  return (
    <div>
      {activity.individual && (
        <Flex>
          <LinkCollective collective={activity.individual}>
            <Avatar radius={40} collective={activity.individual} />
          </LinkCollective>
          <Flex flexDirection="column" justifyContent="center" ml={3}>
            <Span color="black.600">
              <FormattedMessage
                id="ByUser"
                defaultMessage="By {userName}"
                values={{
                  userName: (
                    <StyledLink
                      as={LinkCollective}
                      color="black.800"
                      collective={activity.individual}
                      withHoverCard
                      hoverCardProps={{
                        hoverCardContentProps: { side: 'top' },
                        includeAdminMembership: {
                          accountSlug: activity.account?.slug,
                          hostSlug: activity.account?.host?.slug,
                        },
                      }}
                    />
                  ),
                }}
              />
            </Span>
            <Span color="black.600" fontSize="12px">
              <FormattedMessage defaultMessage="on {date}" values={{ date: <DateTime value={activity.createdAt} /> }} />
            </Span>
          </Flex>
        </Flex>
      )}
      {message && (
        <ActivityParagraph activityColor={activityColors.border} my={1} fontSize="12px" whiteSpace="pre-line">
          <ActivityMessage color={activityColors.text}>
            {intl.formatMessage(message, {
              movedFromCollective: activity.data?.movedFromCollective?.name || 'collective',
            })}
          </ActivityMessage>
          {details && (
            <Fragment>
              <br />
              {details}
            </Fragment>
          )}
          {DataRenderer && <DataRenderer activity={activity} />}
        </ActivityParagraph>
      )}
    </div>
  );
};

ThreadActivity.propTypes = {
  activity: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.keys(ACTIVITIES_INFO)).isRequired,
    createdAt: PropTypes.string.isRequired,
    data: PropTypes.shape({
      error: PropTypes.shape({
        message: PropTypes.string,
      }),
      message: PropTypes.string,
      movedFromCollective: PropTypes.object,
    }),
    individual: PropTypes.shape({
      id: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    account: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      host: PropTypes.shape({
        slug: PropTypes.string.isRequired,
      }),
    }),
  }),
};

export default ThreadActivity;
