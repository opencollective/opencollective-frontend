import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle as CheckIcon } from '@styled-icons/boxicons-regular/CheckCircle';
import { Ban as RejectedIcon } from '@styled-icons/fa-solid/Ban';
import { Cogs as CogsIcon } from '@styled-icons/fa-solid/Cogs';
import { AlertOctagon as ErrorIcon } from '@styled-icons/feather/AlertOctagon';
import { Edit as EditIcon } from '@styled-icons/feather/Edit';
import { FileText as InvitedIcon } from '@styled-icons/feather/FileText';
import { Plus as PlusIcon } from '@styled-icons/feather/Plus';
import { UserCheck as ApprovedIcon } from '@styled-icons/feather/UserCheck';
import { UserMinus as UnapprovedIcon } from '@styled-icons/feather/UserMinus';
import { SyncAlt as MoveIcon } from '@styled-icons/material/SyncAlt';
import { Update as UpdateIcon } from '@styled-icons/material/Update';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import styled, { useTheme } from 'styled-components';

import Avatar from '../Avatar';
import DateTime from '../DateTime';
import { Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledLink from '../StyledLink';
import { P, Span } from '../Text';

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
};

const getActivityColor = (activityType, theme) => {
  switch (ACTIVITIES_INFO[activityType]?.type) {
    case 'info':
      return theme.colors.blue[500];
    case 'success':
      return theme.colors.green[500];
    case 'error':
      return theme.colors.red[500];
    default:
      return theme.colors.black[400];
  }
};

export const getActivityIcon = (activity, theme) => {
  const IconComponent = ACTIVITIES_INFO[activity.type]?.icon || UpdateIcon;
  return <IconComponent size={18} color={getActivityColor(activity.type, theme)} />;
};

export const isSupportedActivity = activity => {
  return Object.prototype.hasOwnProperty.call(ACTIVITIES_INFO, activity.type);
};

const ActivityParagraph = styled(P)`
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
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const activityColor = getActivityColor(activity.type, theme);
  const message = ACTIVITIES_INFO[activity.type]?.message;
  const details = activity.data?.message || activity.data?.error?.message;

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
                  userName: <StyledLink as={LinkCollective} color="black.800" collective={activity.individual} />,
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
        <ActivityParagraph activityColor={activityColor} mt={1} fontSize="12px" whiteSpace="pre-line">
          <ActivityMessage color={activityColor}>
            {formatMessage(message, { movedFromCollective: activity.data?.movedFromCollective?.name || 'collective' })}
          </ActivityMessage>
          {details && (
            <Fragment>
              <br />
              {details}
            </Fragment>
          )}
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
  }),
};

export default ThreadActivity;
