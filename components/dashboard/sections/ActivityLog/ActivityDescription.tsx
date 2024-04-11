import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { capitalize } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { ActivityDescriptionI18n } from '../../../../lib/i18n/activities';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import formatMemberRole from '../../../../lib/i18n/member-role';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import LinkExpense from '../../../LinkExpense';

const ResourceTag = ({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) => (
  <div
    className={clsx(
      'inline-block rounded-full bg-muted px-2 py-0.5 text-sm',
      disabled ? 'text-muted-foreground' : 'hover:underline',
    )}
  >
    {children}
  </div>
);

export const getActivityVariables = (
  intl,
  activity,
  options?: {
    onClickExpense?: (id: number) => void;
  },
) => ({
  expenseDescription: activity.expense?.description,
  updateTitle: activity.update?.title,
  conversationTitle: activity.conversation?.title,
  hasParent: Boolean(activity.account?.parent),
  Individual: () => (
    <LinkCollective
      collective={activity.individual}
      withHoverCard
      className="font-medium hover:underline"
      hoverCardProps={{
        includeAdminMembership: {
          hostSlug: activity.host?.slug,
          accountSlug: activity.account?.slug,
        },
      }}
    />
  ),
  IndividualOrAccount: () => (
    <LinkCollective
      collective={activity.individual || activity.account}
      withHoverCard
      className="font-medium hover:underline"
      {...(activity.individual && {
        hoverCardProps: {
          includeAdminMembership: {
            hostSlug: activity.host?.slug,
            accountSlug: activity.account?.slug,
          },
        },
      })}
    />
  ),
  FromAccount: () => (
    <LinkCollective collective={activity.fromAccount} withHoverCard className="font-medium hover:underline" />
  ),
  Account: () => (
    <LinkCollective
      collective={activity.account}
      withHoverCard
      hoverCardProps={{ displayFollowButton: true }}
      className="font-medium hover:underline"
    />
  ),
  AccountType: () => formatCollectiveType(intl, activity.account?.type || 'COLLECTIVE'),
  AccountParent: () => (
    <LinkCollective collective={activity.account?.parent} withHoverCard className="font-medium hover:underline" />
  ),
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
  Payee: msg =>
    !activity.expense ? (
      msg
    ) : (
      <LinkCollective collective={activity.expense.payee} withHoverCard className="font-medium hover:underline" />
    ),
  Expense: msg =>
    !activity.expense ? (
      <ResourceTag disabled>
        <FormattedMessage defaultMessage="Deleted expense" id="tt1zRa" />
      </ResourceTag>
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
  Host: () => <LinkCollective collective={activity.host} withHoverCard className="font-medium hover:underline" />,
  Vendor: () => (
    <LinkCollective collective={activity.data?.vendor} withHoverCard className="font-medium hover:underline" />
  ),
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
      return <LinkCollective collective={activity.account} withHoverCard className="font-medium hover:underline" />;
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
  Conversation: msg =>
    !activity.conversation ? (
      msg
    ) : (
      <ResourceTag>
        <Link
          href={`${getCollectivePageRoute(activity.account)}/conversations/${activity.conversation.slug}-${activity.conversation.id}`}
          title={activity.conversation.title}
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
