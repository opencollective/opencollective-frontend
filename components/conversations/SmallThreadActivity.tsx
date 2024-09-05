import React from 'react';
import { useIntl } from 'react-intl';
import { useTheme } from 'styled-components';

import type { Activity } from '../../lib/graphql/types/v2/graphql';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import DateTime from '../DateTime';

import { ACTIVITIES_INFO, getActivityColors, getActivityIcon } from './activity-helpers';

type SmallThreadActivityProps = {
  activity: Partial<Activity>;
};

export default function SmallThreadActivity(props: SmallThreadActivityProps) {
  const theme = useTheme();
  const intl = useIntl();

  if (!props.activity) {
    return null;
  }

  const activityColors = getActivityColors(props.activity.type, theme);
  const message = ACTIVITIES_INFO[props.activity.type]?.message;
  const details =
    ACTIVITIES_INFO[props.activity.type]?.renderDetails?.(props.activity.data) ||
    props.activity.data?.message ||
    props.activity.data?.error?.message;
  const DataRenderer = ACTIVITIES_INFO[props.activity.type]?.DataRenderer;

  return (
    <div
      className="relative w-full border-slate-200 py-4 first:border-none first:pt-0 [&:last-child_.timeline-indicator]:-bottom-4 [&:last-child_.timeline-separator]:hidden"
      data-cy="activity"
    >
      <div className="timeline-separator absolute bottom-0 left-5 right-0 border-b" />
      <div className="flex justify-between">
        <div className="flex gap-4">
          <div className="relative">
            <div className="timeline-indicator absolute -bottom-4 -top-4 left-5 -z-10 border-l" />
            {props.activity.individual ? (
              <AccountHoverCard
                account={props.activity.individual}
                trigger={
                  <div className="relative">
                    <Avatar collective={props.activity.individual} radius={40} />
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
                      {getActivityIcon(props.activity, theme, 16)}
                    </div>
                  </div>
                }
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow">
                {getActivityIcon(props.activity, theme, 20)}
              </div>
            )}
          </div>
          <div>
            {props.activity.individual && (
              <div className="mb-1 text-sm font-medium leading-5">{props.activity.individual.name}</div>
            )}
            <div className="text-sm leading-4 text-muted-foreground">
              <DateTime dateStyle="medium" value={props.activity.createdAt} />
            </div>
            {message ? (
              <div className="mt-4 whitespace-pre-line text-sm">
                <div
                  className="font-medium"
                  style={{
                    color: activityColors.text,
                  }}
                >
                  {intl.formatMessage(message, {
                    movedFromCollective: props.activity.data?.movedFromCollective?.name || 'collective',
                  })}
                </div>
                {details ? <div className="mt-4">{details}</div> : null}
              </div>
            ) : null}
            {DataRenderer && <DataRenderer activity={props.activity} />}
          </div>
        </div>
      </div>
    </div>
  );
}
