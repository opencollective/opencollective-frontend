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
    defaultMessage: 'Your Collective has been created.',
  },
  collectiveCreatedDescription: {
    id: 'collective.created.description',
    defaultMessage:
      'While awaiting for approval from {host}, you can customize your page and start submitting expenses.',
  },
  collectiveApprovedDescription: {
    id: 'collective.githubflow.created.description',
    defaultMessage: 'You have been approved by {host} and can now receive financial contributions.',
  },
  // Fund Created
  fundCreated: {
    id: 'createFund.created',
    defaultMessage: 'Your Fund has been created.',
  },
  fundCreatedDescription: {
    id: 'createFund.created.description',
    defaultMessage: 'We will get in touch about approval soon.',
  },
  fundCreatedApprovedDescription: {
    id: 'createFund.createdApproved.description',
    defaultMessage: 'You have been approved by {host}, and can now make contributions and submit expenses.',
  },
  // Event Created
  eventCreated: {
    id: 'event.created',
    defaultMessage: 'Your Event has been created.',
  },
  // Project Created
  projectCreated: {
    id: 'project.created',
    defaultMessage: 'Your Project has been created.',
  },
  // Organization Created
  organizationCreated: {
    id: 'organization.created',
    defaultMessage: 'Your Organization has been created.',
  },
  organizationCreateDescription: {
    id: 'organization.created.description',
    defaultMessage:
      'You can now make financial contributions as an Organization. You can also edit your profile, add team members, and associate a credit card with a monthly limit.',
  },
  // Archived
  collectiveArchived: {
    id: 'collective.isArchived',
    defaultMessage: '{name} has been archived.',
  },
  collectiveArchivedDescription: {
    id: 'collective.isArchived.description',
    defaultMessage: '{name} has been archived and is no longer active.',
  },
  // Pending
  approvalPending: {
    id: 'collective.pending',
    defaultMessage: 'Collective pending approval.',
  },
  approvalPendingDescription: {
    id: 'collective.pending.description',
    defaultMessage: 'Awaiting approval from {host}.',
  },
  'event.over.sendMoneyToParent.title': {
    id: 'event.over.sendMoneyToParent.title',
    defaultMessage: 'This event has a positive balance.',
  },
  'event.over.sendMoneyToParent.description': {
    id: 'event.over.sendMoneyToParent.description',
    defaultMessage: 'Spend it by submitting event expenses, or transfer the remaining balance to the main budget.',
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
      description: intl.formatMessage(messages.collectiveArchivedDescription, { name: collective.name }),
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
