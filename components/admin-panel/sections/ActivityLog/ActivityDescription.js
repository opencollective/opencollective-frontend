import React from 'react';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import { useIntl } from 'react-intl';

import { ActivityDescriptionI18n } from '../../../../lib/i18n/activities';
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
    FromAccount: () => <LinkCollective collective={activity.fromAccount} openInNewTab />,
    Account: () => <LinkCollective collective={activity.account} openInNewTab />,
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
