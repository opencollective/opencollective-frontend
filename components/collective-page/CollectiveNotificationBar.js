import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { checkIfOCF } from '../../lib/collective';
import { CollectiveType } from '../../lib/constants/collectives';
import { moneyCanMoveFromEvent } from '../../lib/events';

import Link from '../Link';
import NotificationBar, { NotificationBarButton, NotificationBarLink } from '../NotificationBar';
import { getOCFBannerMessage } from '../OCFBanner';
import SendMoneyToCollectiveBtn from '../SendMoneyToCollectiveBtn';

import PendingApplicationActions from './PendingApplicationActions';

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
  tooFewAdmins: {
    id: 'collective.tooFewAdmins',
    defaultMessage:
      'Your collective was approved but you need {missingAdminsCount, plural, one {one more admin} other {# more admins} } before you can accept financial contributions.',
  },
  tooFewAdminsDescription: {
    id: 'collective.tooFewAdmins.description',
    defaultMessage:
      'You will automatically be able to accept contributions when {missingAdminsCount, plural, one {an invited administrator} other {# invited administrators} } has joined.',
  },
});

const getNotification = (intl, status, collective, host, LoggedInUser, refetch) => {
  const numberOfAdmins = collective.parentCollective
    ? collective.parentCollective.coreContributors?.filter(c => c.isAdmin)?.length + collective.admins.length
    : collective.admins.length;
  if (status === 'collectiveCreated') {
    switch (collective.type) {
      case CollectiveType.ORGANIZATION:
        return {
          title: intl.formatMessage(messages.organizationCreated),
          description: intl.formatMessage(messages.organizationCreateDescription),
          type: 'success',
          inline: false,
        };
      default:
        if (collective.isApproved) {
          return {
            title: intl.formatMessage(messages.collectiveCreated),
            description: intl.formatMessage(messages.collectiveApprovedDescription, { host: host.name }),
            type: 'success',
            inline: true,
          };
        }
        return {
          title: intl.formatMessage(messages.collectiveCreated),
          description: host ? intl.formatMessage(messages.collectiveCreatedDescription, { host: host.name }) : '',
          type: 'info',
          inline: true,
        };
    }
  } else if (status === 'fundCreated') {
    if (collective.isApproved) {
      return {
        title: intl.formatMessage(messages.fundCreated),
        description: intl.formatMessage(messages.fundCreatedApprovedDescription, { host: host.name }),
        type: 'success',
        inline: true,
      };
    }
    return {
      title: intl.formatMessage(messages.fundCreated),
      description: host ? intl.formatMessage(messages.fundCreatedDescription, { host: host.name }) : '',
      type: 'info',
      inline: true,
    };
  } else if (status === 'eventCreated') {
    return {
      title: intl.formatMessage(messages.eventCreated),
      type: 'success',
      inline: true,
    };
  } else if (status === 'projectCreated') {
    return {
      title: intl.formatMessage(messages.projectCreated),
      type: 'success',
      inline: true,
    };
  } else if (status === 'collectiveArchived' || collective.isArchived) {
    return {
      title: intl.formatMessage(messages.collectiveArchived, { name: collective.name }),
      description: intl.formatMessage(messages.collectiveArchivedDescription, { name: collective.name }),
      type: 'warning',
      inline: true,
    };
  } else if (!collective.isApproved && collective.host) {
    return {
      title: intl.formatMessage(messages.approvalPending),
      description: intl.formatMessage(messages.approvalPendingDescription, { host: collective.host.name }),
      type: 'warning',
      actions: LoggedInUser?.isHostAdmin(collective) && (
        <PendingApplicationActions collective={collective} refetch={refetch} />
      ),
    };
  } else if (
    LoggedInUser?.isAdminOfCollectiveOrHost(collective) &&
    collective.isApproved &&
    host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.freeze &&
    host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins > numberOfAdmins &&
    collective.features?.RECEIVE_FINANCIAL_CONTRIBUTIONS === 'DISABLED'
  ) {
    return {
      title: intl.formatMessage(messages.tooFewAdmins, {
        missingAdminsCount: host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins - collective.admins.length,
      }),
      description: intl.formatMessage(messages.tooFewAdminsDescription, {
        missingAdminsCount: host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins - collective.admins.length,
      }),
      type: 'warning',
      actions: (
        <NotificationBarLink href={`/dashboard/${collective.slug}/team`}>
          <FormattedMessage defaultMessage="Manage members" />
        </NotificationBarLink>
      ),
    };
  } else if (get(collective, 'type') === CollectiveType.EVENT && moneyCanMoveFromEvent(collective)) {
    if (!LoggedInUser || !LoggedInUser.isAdminOfCollectiveOrHost(collective)) {
      return;
    }
    return {
      title: intl.formatMessage(messages['event.over.sendMoneyToParent.title']),
      description: intl.formatMessage(messages['event.over.sendMoneyToParent.description'], {
        collective: collective.parentCollective.name,
      }),
      type: 'info',
      actions: (
        <SendMoneyToCollectiveBtn
          fromCollective={collective}
          toCollective={collective.parentCollective}
          LoggedInUser={LoggedInUser}
          amount={collective.stats.balance}
          currency={collective.currency}
          customButton={props => <NotificationBarButton {...props} />}
        />
      ),
    };
  } else if (checkIfOCF(collective) || checkIfOCF(collective.parentCollective)) {
    return {
      type: 'warning',
      title: 'Open Collective Official Statement: OCF Dissolution',
      description: (
        <React.Fragment>
          Find more information here:{' '}
          <Link href="https://blog.opencollective.com/open-collective-official-statement-ocf-dissolution/" openInNewTab>
            Open Collective official Statement
          </Link>
          .
        </React.Fragment>
      ),
    };
  } else if (checkIfOCF(collective.host)) {
    const duplicateCollective = get(collective, 'duplicatedCollectives.collectives.0');
    const isAdmin = LoggedInUser?.isAdminOfCollectiveOrHost(collective);
    const { title, severity, message } = getOCFBannerMessage({
      isAdmin,
      account: collective,
      newAccount: duplicateCollective,
      isCentered: true,
      hideNextSteps: true,
    });
    return {
      type: severity,
      title,
      description: message,
      isSticky: true,
    };
  }
};

/**
 * Adds a notification bar for the collective.
 */
const CollectiveNotificationBar = ({ intl, status, collective, host, LoggedInUser, refetch }) => {
  const notification = getNotification(intl, status, collective, host, LoggedInUser, refetch);

  return !notification ? null : <NotificationBar {...notification} />;
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
