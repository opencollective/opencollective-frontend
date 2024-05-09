import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Update, UpdateAudience } from '../../../../lib/graphql/types/v2/graphql';
import { elementFromClass } from '../../../../lib/react-utils';
import { formatDate } from '../../../../lib/utils';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import LinkCollective from '../../../LinkCollective';
import { Badge } from '../../../ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';

export const TwoColumnContainer = elementFromClass('div', 'flex flex-col gap-6 lg:flex-row lg:gap-10');
export const MainColumn = elementFromClass('div', 'flex w-full max-w-2xl flex-col gap-6');
const SideColumnWrapper = elementFromClass('div', 'w-full lg:max-w-56');
export const SideColumn = ({ children }) => (
  <SideColumnWrapper>
    <div className="sticky top-10 flex flex-col gap-6">{children}</div>
  </SideColumnWrapper>
);

export const SideColumnItem = ({ children }) => {
  const [label, ...items] = children;
  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="text-xs font-bold">{label}</div>
      {items}
    </div>
  );
};

export const UpdateStatus = ({ update }: { update: Partial<Update> }) => {
  let type, message, tooltip;
  if (update.publishedAt) {
    type = 'info';
    message = <FormattedMessage id="update.status.published" defaultMessage="Published" />;
    tooltip = (
      <FormattedMessage id="update.status.published.tooltip" defaultMessage="This update is publicly visible" />
    );
    if (update.isChangelog) {
      message = (
        <React.Fragment>
          {message}&nbsp;(
          <FormattedMessage id="Changelog" defaultMessage="Changelog" />)
        </React.Fragment>
      );
      tooltip = (
        <FormattedMessage
          id="update.status.published.tooltip.changelog"
          defaultMessage="This update is public visible and displayed in the What's New section"
        />
      );
    } else if (update.isPrivate) {
      message = (
        <React.Fragment>
          {message}&nbsp;(
          <FormattedMessage id="Private" defaultMessage="Private" />)
        </React.Fragment>
      );
      if (update.notificationAudience === UpdateAudience.COLLECTIVE_ADMINS) {
        tooltip = (
          <FormattedMessage
            id="update.status.published.tooltip.private.COLLECTIVE_ADMINS"
            defaultMessage="This update is visible for hosted collective admins only"
          />
        );
      } else if (update.notificationAudience === UpdateAudience.FINANCIAL_CONTRIBUTORS) {
        tooltip = (
          <FormattedMessage
            id="update.status.published.tooltip.private.FINANCIAL_CONTRIBUTORS"
            defaultMessage="This update is visible for contributors only"
          />
        );
      } else {
        tooltip = (
          <FormattedMessage
            id="update.status.published.tooltip.private"
            defaultMessage="This update is visible for members only"
          />
        );
      }
    }
  } else {
    type = 'neutral';
    message = <FormattedMessage id="expense.draft" defaultMessage="Draft" />;
    tooltip = (
      <FormattedMessage
        id="update.status.drafted.tooltip"
        defaultMessage="This update is a draft and it is not publicly visible"
      />
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge type={type} className="ml-2 inline-flex self-start font-semibold" size="sm">
          {message}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export const UpdateDate = ({ update }: { update: Partial<Update> }) => {
  const author = (
    <AccountHoverCard
      key={update.fromAccount.id}
      account={update.fromAccount}
      includeAdminMembership={{ accountSlug: update.account.slug }}
      trigger={
        <div className="mx-1 inline-flex flex-row items-baseline gap-1">
          <Avatar collective={update.fromAccount} radius={16} className="self-center" />
          <LinkCollective collective={update.fromAccount} />
        </div>
      }
    />
  );

  return update.publishedAt ? (
    <FormattedMessage
      id="update.publishedAtBy"
      defaultMessage="Published on {date} by {author}"
      values={{
        date: formatDate(update.publishedAt, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        author,
      }}
    />
  ) : (
    <FormattedMessage
      id="update.draftedBy"
      defaultMessage="Drafted on {date} by {author}"
      values={{
        date: formatDate(update.createdAt, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        author,
      }}
    />
  );
};
