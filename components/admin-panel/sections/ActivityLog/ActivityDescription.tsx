import React from 'react';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import type { Account } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityDescriptionI18n } from '../../../../lib/i18n/activities';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import formatMemberRole from '../../../../lib/i18n/member-role';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import Avatar from '../../../Avatar';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import LinkExpense from '../../../LinkExpense';
import { Span } from '../../../Text';

const ResourceTag = styled.div`
  display: inline-block;
  background-color: #fff;
  border-radius: 32px;
  padding: 2px 8px;
  font-size: 12px;

  a {
    color: ${props => props.theme.colors.black[800]};
    font-weight: 400;
    text-decoration: underline;
  }
`;

const CollectiveTag = ({
  collective,
  openInNewTab,
}: {
  collective: Pick<Account, 'slug' | 'name' | 'type' | 'imageUrl' | 'isIncognito'>;
  openInNewTab?: boolean;
}) => {
  return (
    <ResourceTag>
      <Avatar collective={collective} radius={14} display="inline-block" verticalAlign="middle" mr={1} mb="1px" />
      <LinkCollective collective={collective} openInNewTab={openInNewTab} />
    </ResourceTag>
  );
};

export const getActivityVariables = (
  intl,
  activity,
  options?: {
    onClickExpense?: (id: number) => void;
  },
) => ({
  expenseDescription: activity.expense?.description,
  updateTitle: activity.data?.update?.title,
  hasParent: Boolean(activity.account?.parent),
  Individual: () => (
    <Span fontWeight={600}>
      <LinkCollective collective={activity.individual || activity.fromAccount} openInNewTab />
    </Span>
  ),
  FromAccount: () => <CollectiveTag collective={activity.fromAccount} openInNewTab />,
  Account: () => <CollectiveTag collective={activity.account} openInNewTab />,
  AccountType: () => formatCollectiveType(intl, activity.account?.type || 'COLLECTIVE'),
  AccountParent: () => <CollectiveTag collective={activity.account?.parent} openInNewTab />,
  Expense: msg =>
    !activity.expense ? (
      msg
    ) : (
      <ResourceTag>
        <LinkExpense
          collective={activity.expense.account}
          expense={activity.expense}
          title={activity.expense.description}
          onClick={options?.onClickExpense}
          openInNewTab
        >
          {msg || `#${activity.expense.legacyId}`}
        </LinkExpense>
      </ResourceTag>
    ),
  Host: () => <CollectiveTag collective={activity.host} openInNewTab />,
  CommentEntity: () => {
    if (activity.expense) {
      return (
        <ResourceTag>
          <LinkExpense
            collective={activity.expense.account}
            expense={activity.expense}
            title={activity.expense.description}
            openInNewTab
          >
            <FormattedMessage id="Expense" defaultMessage="Expense" /> #{activity.expense.legacyId}
          </LinkExpense>
        </ResourceTag>
      );
    } else {
      // We're not yet linking conversations & updates to comments in the activity table
      return <CollectiveTag collective={activity.account} openInNewTab />;
    }
  },
  Order: msg =>
    !activity.order ? (
      msg
    ) : (
      <ResourceTag>
        <Link
          href={`${getCollectivePageRoute(activity.order.toAccount)}/contributions/${activity.order.legacyId}`}
          title={activity.order.description}
          openInNewTab
        >
          {msg} #{activity.order.legacyId}
        </Link>
      </ResourceTag>
    ),
  Update: msg =>
    !activity.update ? (
      msg
    ) : (
      <ResourceTag>
        <Link
          href={`${getCollectivePageRoute(activity.account)}/updates/${activity.update.slug}`}
          title={activity.update.title}
          openInNewTab
        >
          {msg}
        </Link>
      </ResourceTag>
    ),
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

const ActivityDescription = ({ activity }) => {
  const intl = useIntl();

  if (!ActivityDescriptionI18n[activity.type]) {
    return capitalize(activity.type.replace('_', ' '));
  }

  return intl.formatMessage(ActivityDescriptionI18n[activity.type], getActivityVariables(intl, activity));
};

ActivityDescription.propTypes = {
  activity: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }).isRequired,
};

export default ActivityDescription;
