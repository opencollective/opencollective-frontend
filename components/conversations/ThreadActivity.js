import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle as CheckIcon } from '@styled-icons/boxicons-regular/CheckCircle';
import { Ban as RejectedIcon } from '@styled-icons/fa-solid/Ban';
import { Cogs as CogsIcon } from '@styled-icons/fa-solid/Cogs';
import { AlertOctagon as ErrorIcon } from '@styled-icons/feather/AlertOctagon';
import { Edit as EditIcon } from '@styled-icons/feather/Edit';
import { UserCheck as ApprovedIcon } from '@styled-icons/feather/UserCheck';
import { UserMinus as UnapprovedIcon } from '@styled-icons/feather/UserMinus';
import { Update as UpdateIcon } from '@styled-icons/material/Update';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled, { useTheme } from 'styled-components';

import Avatar from '../Avatar';
import { Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

/**
 * Defines activities display metadata.
 * **All** keys must have a matching entry in `MESSAGES` below.
 */
const ACTIVITIES_INFO = {
  COLLECTIVE_EXPENSE_APPROVED: {
    type: 'info',
    icon: ApprovedIcon,
  },
  COLLECTIVE_EXPENSE_UNAPPROVED: {
    type: 'warning',
    icon: UnapprovedIcon,
  },
  COLLECTIVE_EXPENSE_UPDATED: {
    type: 'info',
    icon: EditIcon,
  },
  COLLECTIVE_EXPENSE_MARKED_AS_UNPAID: {
    type: 'info',
    icon: UpdateIcon,
  },
  COLLECTIVE_EXPENSE_REJECTED: {
    type: 'error',
    icon: RejectedIcon,
  },
  COLLECTIVE_EXPENSE_PAID: {
    type: 'success',
    icon: CheckIcon,
  },
  COLLECTIVE_EXPENSE_PROCESSING: {
    type: 'info',
    icon: CogsIcon,
  },
  COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT: {
    type: 'info',
    icon: CogsIcon,
  },
  COLLECTIVE_EXPENSE_ERROR: {
    type: 'error',
    icon: ErrorIcon,
  },
  COLLECTIVE_EXPENSE_MARKED_AS_SPAM: {
    type: 'error',
    icon: RejectedIcon,
  },
};

const MESSAGES = defineMessages({
  COLLECTIVE_EXPENSE_UPDATED: {
    id: 'Expense.Activity.Updated',
    defaultMessage: 'Expense updated',
  },
  COLLECTIVE_EXPENSE_REJECTED: {
    id: 'Expense.Activity.Rejected',
    defaultMessage: 'Expense rejected',
  },
  COLLECTIVE_EXPENSE_APPROVED: {
    id: 'Expense.Activity.Approved',
    defaultMessage: 'Expense approved',
  },
  COLLECTIVE_EXPENSE_UNAPPROVED: {
    id: 'Expense.Activity.Unapproved',
    defaultMessage: 'Expense unapproved',
  },
  COLLECTIVE_EXPENSE_PAID: {
    id: 'Expense.Activity.Paid',
    defaultMessage: 'Expense paid',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_UNPAID: {
    id: 'Expense.Activity.MarkedAsUnpaid',
    defaultMessage: 'Expense marked as unpaid',
  },
  COLLECTIVE_EXPENSE_PROCESSING: {
    id: 'Expense.Activity.Processing',
    defaultMessage: 'Expense processing',
  },
  COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT: {
    id: 'Expense.Activity.ScheduledForPayment',
    defaultMessage: 'Expense scheduled for payment',
  },
  COLLECTIVE_EXPENSE_ERROR: {
    id: 'Expense.Activity.Error',
    defaultMessage: 'Expense error',
  },
  COLLECTIVE_EXPENSE_MARKED_AS_SPAM: {
    id: 'Expense.Activity.MarkedAsSpam',
    defaultMessage: 'Expense marked as spam',
  },
});

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

const ActivityMessage = styled.div`
  font-size: 10px;
  font-weight: 600;
  padding: 10px 12px;
  border-left: 4px solid ${props => props.color};
  background: white;
  border-radius: 0;
  color: ${props => props.color};
`;

const ThreadActivity = ({ activity }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const activityColor = getActivityColor(activity.type, theme);
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
            <Span color="black.600" fontSize="12px" title={activity.createdAt}>
              <FormattedMessage
                id="UpdatedOnDate"
                defaultMessage="Updated on {date, date, long}"
                values={{ date: new Date(activity.createdAt) }}
              />
            </Span>
          </Flex>
        </Flex>
      )}
      {MESSAGES[activity.type] && (
        <ActivityMessage color={activityColor}>
          {formatMessage(MESSAGES[activity.type])}
          {activity.data?.error?.message ? `: ${activity.data.error.message}` : ''}
        </ActivityMessage>
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
    }),
    individual: PropTypes.shape({
      id: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  }),
};

export default ThreadActivity;
