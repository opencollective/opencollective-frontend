import React from 'react';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { ActivityDescriptionI18n } from '../../../../lib/i18n/activities';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import formatMemberRole from '../../../../lib/i18n/member-role';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import LinkExpense from '../../../LinkExpense';

const ActivityDescription = ({ activity }) => {
  const intl = useIntl();

  if (!ActivityDescriptionI18n[activity.type]) {
    return capitalize(activity.type.replace('_', ' '));
  }

  return intl.formatMessage(ActivityDescriptionI18n[activity.type], {
    hasParent: Boolean(activity.account?.parent),
    FromAccount: () => <LinkCollective collective={activity.fromAccount} openInNewTab />,
    Account: () => <LinkCollective collective={activity.account} openInNewTab />,
    AccountType: () => formatCollectiveType(intl, activity.account?.type || 'COLLECTIVE'),
    AccountParent: () => <LinkCollective collective={activity.account?.parent} openInNewTab />,
    Expense: msg =>
      !activity.expense ? (
        msg
      ) : (
        <LinkExpense
          collective={activity.expense.account}
          expense={activity.expense}
          title={activity.expense.description}
          openInNewTab
        >
          {msg} #{activity.expense.legacyId}
        </LinkExpense>
      ),
    Order: msg =>
      !activity.order ? (
        msg
      ) : (
        <Link
          href={`${getCollectivePageRoute(activity.order.toAccount)}/orders?searchTerm=%23${activity.order.legacyId}`}
          title={activity.order.description}
          openInNewTab
        >
          {msg} #{activity.order.legacyId}
        </Link>
      ),
    Host: () => <LinkCollective collective={activity.host} openInNewTab />,
    CommentEntity: () => {
      if (activity.expense) {
        return (
          <LinkExpense
            collective={activity.expense.account}
            expense={activity.expense}
            title={activity.expense.description}
            openInNewTab
          >
            <FormattedMessage id="Expense" defaultMessage="Expense" /> #{activity.expense.legacyId}
          </LinkExpense>
        );
      } else {
        // We're not yet linking conversations & updates to comments in the activity table
        return <LinkCollective collective={activity.account} openInNewTab />;
      }
    },
    MemberRole: () => {
      if (activity.data?.member?.role) {
        return formatMemberRole(intl, activity.data.member.role);
      } else if (activity.data?.invitation?.role) {
        return formatMemberRole(intl, activity.data.invitation.role);
      } else {
        return 'member';
      }
    },
  });
};

ActivityDescription.propTypes = {
  activity: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }).isRequired,
};

export default ActivityDescription;
