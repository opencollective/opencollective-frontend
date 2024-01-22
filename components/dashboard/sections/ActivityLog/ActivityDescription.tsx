import React from 'react';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import { CheckCircle, XCircle } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Account } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityDescriptionI18n } from '../../../../lib/i18n/activities';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import formatMemberRole from '../../../../lib/i18n/member-role';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import Avatar from '../../../Avatar';
import FollowButton from '../../../FollowButton';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import LinkExpense from '../../../LinkExpense';

const ResourceTag = ({ children }) => (
  <div className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-sm hover:underline">{children}</div>
);

const CollectiveTag = ({
  collective,
  openInNewTab,
  displayFollowButton,
}: {
  collective: Pick<Account, 'slug' | 'name' | 'type' | 'imageUrl' | 'isIncognito'>;
  openInNewTab?: boolean;
  displayFollowButton?: boolean;
}) => {
  return (
    <div className="inline-block">
      <div className="flex flex-wrap">
        <ResourceTag>
          <Avatar collective={collective} radius={14} display="inline-block" verticalAlign="middle" mr={1} mb="1px" />
          <LinkCollective collective={collective} openInNewTab={openInNewTab} />
        </ResourceTag>
        {displayFollowButton && (
          <FollowButton
            buttonProps={{ buttonSize: 'tiny', isBorderless: true }}
            account={collective}
            followButtonStyle="secondary"
            followLabel={
              <React.Fragment>
                <CheckCircle className="mr-[0.2rem]" size="1rem" />
                <FormattedMessage defaultMessage="Follow collective" />
              </React.Fragment>
            }
            unfollowLabel={
              <React.Fragment>
                <XCircle className="mr-[0.2rem]" size="1rem" />
                <FormattedMessage defaultMessage="Unfollow collective" />
              </React.Fragment>
            }
          />
        )}
      </div>
    </div>
  );
};

export const getActivityVariables = (
  intl,
  activity,
  options?: {
    onClickExpense?: (id: number) => void;
    displayFollowButton?: boolean;
  },
) => ({
  expenseDescription: activity.expense?.description,
  updateTitle: activity.data?.update?.title,
  hasParent: Boolean(activity.account?.parent),
  Individual: () => (
    <span className="font-medium">
      <LinkCollective collective={activity.individual || activity.fromAccount} className="hover:underline" />
    </span>
  ),
  FromAccount: () => <CollectiveTag collective={activity.fromAccount} />,
  Account: () => <CollectiveTag collective={activity.account} displayFollowButton={options?.displayFollowButton} />,
  AccountType: () => formatCollectiveType(intl, activity.account?.type || 'COLLECTIVE'),
  AccountParent: () => <CollectiveTag collective={activity.account?.parent} />,
  Amount: msg => {
    if (!activity.expense) {
      return msg;
    }

    return (
      <FormattedMoneyAmount
        amount={activity.expense.amountV2.valueInCents}
        currency={activity.expense.amountV2.currency}
        precision={2}
        amountStyles={{ letterSpacing: 0 }}
      />
    );
  },
  Payee: msg => (!activity.expense ? msg : <CollectiveTag collective={activity.expense.payee} />),
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
        >
          {msg || `#${activity.expense.legacyId}`}
        </LinkExpense>
      </ResourceTag>
    ),
  Host: () => <CollectiveTag collective={activity.host} />,
  Vendor: () => <CollectiveTag collective={activity.data?.vendor} />,
  CommentEntity: () => {
    if (activity.expense) {
      return (
        <ResourceTag>
          <LinkExpense
            collective={activity.expense.account}
            expense={activity.expense}
            title={activity.expense.description}
            className="text-slate-800"
          >
            <FormattedMessage id="Expense" defaultMessage="Expense" /> #{activity.expense.legacyId}
          </LinkExpense>
        </ResourceTag>
      );
    } else {
      // We're not yet linking conversations & updates to comments in the activity table
      return <CollectiveTag collective={activity.account} />;
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
