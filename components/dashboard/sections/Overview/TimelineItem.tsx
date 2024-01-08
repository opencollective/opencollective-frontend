import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { FormattedMessage, useIntl } from 'react-intl';

import { ActivityType, type WorkspaceHomeQuery } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityDescriptionI18n, ActivityTimelineMessageI18n } from '../../../../lib/i18n/activities';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import { getActivityVariables } from '../../../admin-panel/sections/ActivityLog/ActivityDescription';
import { AvatarWithLink } from '../../../AvatarWithLink';
import DateTime from '../../../DateTime';
import HTMLContent from '../../../HTMLContent';
import Link from '../../../Link';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import StyledLink from '../../../StyledLink';

dayjs.extend(relativeTime);

type ActivityListItemProps = {
  activity?: WorkspaceHomeQuery['account']['feed'][0];
  isLast?: boolean;
  openExpense?: (legacyId: number) => void;
};

const TimelineItem = ({ activity, openExpense }: ActivityListItemProps) => {
  const intl = useIntl();
  const secondaryAccount = activity?.individual?.id !== activity?.account?.id && activity.account;
  const content = activity?.data?.comment?.html || activity?.update?.summary;

  const isLoading = !activity;
  const isLastWeek = dayjs(activity?.createdAt).isAfter(dayjs().subtract(1, 'week'));

  const displayFollowButton = activity?.type === ActivityType.COLLECTIVE_UPDATE_PUBLISHED;
  return (
    <div className="rounded-2xl border p-4 text-sm">
      <div className="flex flex-1 items-start gap-3">
        {isLoading ? (
          <LoadingPlaceholder height={32} width={32} borderRadius="50%" />
        ) : (
          <AvatarWithLink
            size={32}
            account={activity.individual || activity.fromAccount}
            secondaryAccount={secondaryAccount}
          />
        )}
        {isLoading ? (
          <LoadingPlaceholder height={16} width={300} />
        ) : (
          <div className="flex flex-1 items-center justify-between">
            <div className="text-foreground">
              {intl.formatMessage(
                ActivityTimelineMessageI18n[activity.type] || ActivityDescriptionI18n[activity.type],
                getActivityVariables(intl, activity, { onClickExpense: openExpense, displayFollowButton }),
              )}
            </div>

            <div className="self-start whitespace-nowrap text-muted-foreground">
              {isLastWeek ? (
                dayjs(activity.createdAt).fromNow()
              ) : (
                <DateTime dateStyle="medium" value={activity.createdAt} />
              )}
            </div>
          </div>
        )}
      </div>
      {Boolean(content) && (
        <div className="mt-4 space-y-2 rounded-xl bg-slate-50  p-4">
          {activity?.update?.title && <p className="font-medium">{activity?.update?.title}</p>}
          <HTMLContent fontSize="14px" lineHeight="20px" content={content} />
          {activity?.update?.summary && (
            <div>
              <StyledLink
                as={Link}
                fontSize="14px"
                lineHeight="16px"
                href={`${getCollectivePageRoute(activity.account)}/updates/${activity.update.slug}`}
                className="font-medium !text-slate-900 hover:underline"
              >
                <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
              </StyledLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineItem;
