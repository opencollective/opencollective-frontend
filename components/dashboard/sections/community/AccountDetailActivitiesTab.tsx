import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { getAccountReferenceInput } from '@/lib/collective';
import { integer } from '@/lib/filters/schemas';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { InfoTooltipIcon } from '@/components/InfoTooltipIcon';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import { Pagination } from '../../filters/Pagination';
import TimelineItem from '../overview/TimelineItem';

import { communityAccountActivitiesQuery } from './queries';

export function ActivitiesTab({ account, host, setOpenExpenseId }) {
  const pagination = useQueryFilter({
    schema: z.object({ limit: integer.default(15), offset: integer.default(0) }),
    filters: {},
    skipRouter: true,
  });

  const { data, loading, error } = useQuery(communityAccountActivitiesQuery, {
    variables: {
      accountId: account.id,
      host: getAccountReferenceInput(host),
      ...pagination.variables,
    },
  });

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const activities = data?.account?.communityStats?.activities.nodes || [];
  const total = data?.account?.communityStats?.activities.totalCount;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="flex items-center font-medium">
        <FormattedMessage defaultMessage="Recent activities" id="RecentActivities" />
        <InfoTooltipIcon className="ml-2">
          <FormattedMessage
            defaultMessage="The activities listed here are contextual to your fiscal-host and do not necessarily represent all activities performed by this user on the platform."
            id="mTzyCH"
          />
        </InfoTooltipIcon>
      </h1>
      <div className="group flex flex-col gap-1 space-y-3 divide-y rounded-xl border p-4">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="Loading activities..." id="LoadingActivities" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="No recent activities" id="NoRecentActivities" />
          </div>
        ) : (
          activities.map(activity => (
            <TimelineItem key={activity.id} activity={activity} openExpense={id => setOpenExpenseId(id)} />
          ))
        )}
      </div>
      <Pagination queryFilter={pagination} total={total} />
    </div>
  );
}
