import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { capitalize } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { type TimelineQuery } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityDescriptionI18n, ActivityTimelineMessageI18n } from '../../../../lib/i18n/activities';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import { AvatarWithLink } from '../../../AvatarWithLink';
import DateTime from '../../../DateTime';
import HTMLContent from '../../../HTMLContent';
import StyledLink from '../../../StyledLink';
import { Skeleton } from '../../../ui/Skeleton';
import { getActivityVariables } from '../ActivityLog/ActivityDescription';

dayjs.extend(relativeTime);

type TimelineActivity = TimelineQuery['account']['feed'][0];

type ActivityListItemProps = {
  activity?: TimelineActivity;
  isLast?: boolean;
  openExpense?: (legacyId: number) => void;
};

const ActivityContent = ({
  activity,
  contentKey,
}: {
  activity: TimelineActivity;
  contentKey?: 'conversation' | 'update';
}) => {
  if (!contentKey) {
    return null;
  }
  const content = activity?.[contentKey]?.summary;
  if (!content || !activity) {
    return null;
  }
  const title = activity[contentKey]?.title;
  const summary = activity[contentKey]?.summary;
  const href = `${getCollectivePageRoute(activity?.account)}/${activity.update ? 'updates' : 'conversations'}/${activity.update?.slug || `${activity.conversation?.slug}-${activity.conversation?.id}`}`;
  return (
    <div className="mt-4 space-y-2 rounded-xl bg-slate-50  p-4">
      {title && <p className="text-base font-medium">{title}</p>}
      <HTMLContent fontSize="14px" lineHeight="20px" content={content} />
      {summary && (
        <div>
          <StyledLink
            fontSize="14px"
            lineHeight="16px"
            href={href}
            className="font-medium !text-slate-900 hover:underline"
          >
            <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
          </StyledLink>
        </div>
      )}
    </div>
  );
};

const TimelineItem = ({ activity, openExpense }: ActivityListItemProps) => {
  const intl = useIntl();

  const isLoading = !activity;
  const isLastWeek = dayjs(activity?.createdAt).isAfter(dayjs().subtract(1, 'week'));

  const timelineMessage = ActivityTimelineMessageI18n[activity?.type];
  const i18nMsg = timelineMessage || ActivityDescriptionI18n[activity?.type];
  const hasTimeLineMessage = Boolean(timelineMessage);
  let description = null;
  if (i18nMsg) {
    description = intl.formatMessage(i18nMsg, getActivityVariables(intl, activity, { onClickExpense: openExpense }));
  } else {
    description = capitalize(activity?.type.replace('_', ' '));
  }

  // Pick which account to use as the avatar
  let avatar = 'individual';
  if (i18nMsg?.avatar) {
    avatar = i18nMsg.avatar;
  }

  // Pick which content card to use
  const contentKey = i18nMsg?.content;

  return (
    <div className="rounded-2xl border p-4 text-sm">
      <div className="flex flex-1 items-start gap-3">
        {isLoading ? (
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
        ) : (
          hasTimeLineMessage && <AvatarWithLink size={32} account={activity[avatar]} />
        )}
        {isLoading ? (
          <Skeleton className="h-4 w-80" />
        ) : (
          <div className="flex min-w-0 flex-1 flex-col justify-between sm:flex-row sm:gap-1.5 sm:pt-1">
            <div className="leading-6 text-foreground">{description}</div>

            <div className="flex items-center self-start whitespace-nowrap leading-6 text-muted-foreground">
              {isLastWeek ? (
                dayjs(activity.createdAt).fromNow()
              ) : (
                <DateTime dateStyle="medium" value={activity.createdAt} />
              )}
            </div>
          </div>
        )}
      </div>

      <ActivityContent activity={activity} contentKey={contentKey} />
    </div>
  );
};

export default TimelineItem;
