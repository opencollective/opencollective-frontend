import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages } from 'react-intl';
import NotificationBar from '../NotificationBar';

const messages = defineMessages({
  collectiveCreated: {
    id: 'collective.created',
    defaultMessage: 'Your collective has been created with success.',
  },
  collectiveCreatedDescription: {
    id: 'collective.created.description',
    defaultMessage:
      'While you are waiting for approval from your host ({host}), you can already customize your collective, file expenses and even create events.',
  },
  collectiveArchived: {
    id: 'collective.isArchived',
    defaultMessage: '{name} has been archived.',
  },
  collectiveArchivedDescription: {
    id: 'collective.isArchived.description',
    defaultMessage: 'This collective has been archived and can no longer be used for any activities.',
  },
});

const getNotification = (intl, status, collective, host) => {
  if (status === 'collectiveCreated') {
    return {
      title: intl.formatMessage(messages.collectiveCreated),
      description: intl.formatMessage(messages.collectiveCreatedDescription, { host: host.name }),
    };
  } else if (status === 'collectiveArchived' || collective.isArchived) {
    return {
      title: intl.formatMessage(messages.collectiveArchived, { name: collective.name }),
      description: intl.formatMessage(messages.collectiveArchivedDescription),
    };
  }
};

/**
 * Adds a notification bar for the collective.
 */
const CollectiveNotificationBar = ({ intl, status, collective, host }) => {
  const notification = getNotification(intl, status, collective, host);

  return !notification ? null : (
    <NotificationBar status={status} title={notification.title} description={notification.description} />
  );
};

CollectiveNotificationBar.propTypes = {
  /** Collective */
  collective: PropTypes.shape({
    name: PropTypes.string,
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
