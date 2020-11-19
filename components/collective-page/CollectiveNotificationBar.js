import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { moneyCanMoveFromEvent } from '../../lib/events';

import NotificationBar from '../NotificationBar';
import SendMoneyToCollectiveBtn from '../SendMoneyToCollectiveBtn';

const messages = defineMessages({
  // Collective Created
  collectiveCreated: {
    id: 'collective.created',
    defaultMessage: 'Your collective has been created with success.',
  },
  collectiveCreatedDescription: {
    id: 'collective.created.description',
    defaultMessage:
      'While you are waiting for approval from your host ({host}), you can already customize your collective, file expenses and even create events.',
  },
  collectiveApprovedDescription: {
    id: 'collective.githubflow.created.description',
    defaultMessage:
      "It's already approved by the host ({host}), you can already receive donations. Feel free to customize your collective, file expenses and even create events.",
  },
  // Fund Created
  fundCreated: {
    id: 'createFund.created',
    defaultMessage: 'Your fund has been successfully created.',
  },
  fundCreatedDescription: {
    id: 'createFund.created.description',
    defaultMessage: 'We will reach out to you for approval shortly.',
  },
  fundCreatedApprovedDescription: {
    id: 'createFund.createdApproved.description',
    defaultMessage: "It's already approved by the host ({host}), you can already contribute money and submit expenses.",
  },
  // Event Created
  eventCreated: {
    id: 'event.created',
    defaultMessage: 'Your Event has been created with success.',
  },
  // Project Created
  projectCreated: {
    id: 'project.created',
    defaultMessage: 'Your Project has been created with success.',
  },
  // Organization Created
  organizationCreated: {
    id: 'organization.created',
    defaultMessage: 'Your Organization has been created.',
  },
  organizationCreateDescription: {
    id: 'organization.created.description',
    defaultMessage:
      'You can now make financial contributions as an Organization. You can also edit your Organization profile, add team members and admins, and attach a credit card with a monthly limit.',
  },
  // Archived
  collectiveArchived: {
    id: 'collective.isArchived',
    defaultMessage: '{name} has been archived.',
  },
  collectiveArchivedDescription: {
    id: 'collective.isArchived.description',
    defaultMessage: 'This collective has been archived and can no longer be used for any activities.',
  },
  // Pending
  approvalPending: {
    id: 'collective.pending',
    defaultMessage: 'Collective pending approval.',
  },
  approvalPendingDescription: {
    id: 'collective.pending.description',
    defaultMessage: 'This collective is pending approval from the host ({host}).',
  },
  'event.over.sendMoneyToParent.title': {
    id: 'event.over.sendMoneyToParent.title',
    defaultMessage: 'Event is over and still has a positive balance',
  },
  'event.over.sendMoneyToParent.description': {
    id: 'event.over.sendMoneyToParent.description',
    defaultMessage:
      'If you still have expenses related to this event, please file them. Otherwise consider moving the money to your collective {collective}',
  },
  'event.over.sendMoneyToParent.transaction.description': {
    id: 'event.over.sendMoneyToParent.transaction.description',
    defaultMessage: 'Balance of {event}',
  },
});

const getNotification = (intl, status, collective, host, LoggedInUser) => {
  if (status === 'collectiveCreated') {
    switch (collective.type) {
      case CollectiveType.ORGANIZATION:
        return {
          title: intl.formatMessage(messages.organizationCreated),
          description: intl.formatMessage(messages.organizationCreateDescription),
        };
      default:
        if (collective.isApproved) {
          return {
            title: intl.formatMessage(messages.collectiveCreated),
            description: intl.formatMessage(messages.collectiveApprovedDescription, { host: host.name }),
          };
        }
        return {
          title: intl.formatMessage(messages.collectiveCreated),
          description: host ? intl.formatMessage(messages.collectiveCreatedDescription, { host: host.name }) : '',
        };
    }
  } else if (status === 'fundCreated') {
    if (collective.isApproved) {
      return {
        title: intl.formatMessage(messages.fundCreated),
        description: intl.formatMessage(messages.fundCreatedApprovedDescription, { host: host.name }),
      };
    }
    return {
      title: intl.formatMessage(messages.fundCreated),
      description: host ? intl.formatMessage(messages.fundCreatedDescription, { host: host.name }) : '',
    };
  } else if (status === 'eventCreated') {
    return {
      title: intl.formatMessage(messages.eventCreated),
    };
  } else if (status === 'projectCreated') {
    return {
      title: intl.formatMessage(messages.projectCreated),
    };
  } else if (status === 'collectiveArchived' || collective.isArchived) {
    return {
      title: intl.formatMessage(messages.collectiveArchived, { name: collective.name }),
      description: intl.formatMessage(messages.collectiveArchivedDescription),
      status: 'collectiveArchived',
    };
  } else if (!collective.isApproved && collective.host && collective.type === CollectiveType.COLLECTIVE) {
    return {
      title: intl.formatMessage(messages.approvalPending),
      description: intl.formatMessage(messages.approvalPendingDescription, { host: collective.host.name }),
      status: 'collectivePending',
    };
  } else if (get(collective, 'type') === CollectiveType.EVENT && moneyCanMoveFromEvent(collective)) {
    if (!LoggedInUser || !LoggedInUser.canEditCollective(collective)) {
      return;
    }
    return {
      title: intl.formatMessage(messages['event.over.sendMoneyToParent.title']),
      description: intl.formatMessage(messages['event.over.sendMoneyToParent.description'], {
        collective: collective.parentCollective.name,
      }),
      actions: [
        <SendMoneyToCollectiveBtn
          key="SendMoneyToCollectiveBtn"
          fromCollective={collective}
          toCollective={collective.parentCollective}
          LoggedInUser={LoggedInUser}
          description={intl.formatMessage(messages['event.over.sendMoneyToParent.transaction.description'], {
            event: collective.name,
          })}
          amount={collective.stats.balance}
          currency={collective.currency}
        />,
      ],
    };
  }
};

/**
 * Adds a notification bar for the collective.
 */
const CollectiveNotificationBar = ({ intl, status, collective, host, LoggedInUser, refetch }) => {
  const notification = getNotification(intl, status, collective, host, LoggedInUser);

  return !notification ? null : (
    <NotificationBar
      status={status || notification.status}
      collective={collective}
      title={notification.title}
      description={notification.description}
      actions={notification.actions}
      LoggedInUser={LoggedInUser}
      refetch={refetch}
    />
  );
};

CollectiveNotificationBar.propTypes = {
  /** Collective */
  collective: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    isArchived: PropTypes.bool,
  }),
  /** Host */
  host: PropTypes.shape({
    name: PropTypes.string,
  }),
  /** A special status to show the notification bar (collective created, archived...etc) */
  status: PropTypes.oneOf(['collectiveCreated', 'collectiveArchived', 'fundCreated', 'projectCreated', 'eventCreated']),
  /** @ignore from injectIntl */
  intl: PropTypes.object,
  refetch: PropTypes.func,
  /** from withUser */
  LoggedInUser: PropTypes.object,
};

export default injectIntl(CollectiveNotificationBar);
