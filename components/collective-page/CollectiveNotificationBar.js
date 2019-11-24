import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages } from 'react-intl';
import NotificationBar from '../NotificationBar';
import { CollectiveType } from '../../lib/constants/collectives';

const messages = defineMessages({
  // Created
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
});

const getNotification = (intl, status, collective, host) => {
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
  } else if (status === 'collectiveArchived' || collective.isArchived) {
    return {
      title: intl.formatMessage(messages.collectiveArchived, { name: collective.name }),
      description: intl.formatMessage(messages.collectiveArchivedDescription),
    };
  } else if (!collective.isApproved && collective.host) {
    return {
      title: intl.formatMessage(messages.approvalPending),
      description: intl.formatMessage(messages.approvalPendingDescription, { host: collective.host.name }),
    };
  }
};

/**
 * Adds a notification bar for the collective.
 */
const CollectiveNotificationBar = ({ intl, status, collective, host }) => {
  // Quickfix for events (as they are not inheriting isApproved status)
  if (collective.type === CollectiveType.EVENT) return null;

  const notification = getNotification(intl, status, collective, host);

  return !notification ? null : (
    <NotificationBar status={status} title={notification.title} description={notification.description} />
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
  status: PropTypes.oneOf(['collectiveCreated', 'collectiveArchived']),
  /** @ignore from injectIntl */
  intl: PropTypes.object,
};

export default injectIntl(CollectiveNotificationBar);
