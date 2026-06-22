import React from 'react';
import { useQuery } from '@apollo/client';
import { z } from 'zod';

import { integer } from '@/lib/filters/schemas';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { Pagination } from '@/components/dashboard/filters/Pagination';
import { activityLogQuery } from '@/components/dashboard/sections/ActivityLog';
import ActivitiesTable from '@/components/dashboard/sections/ActivityLog/ActivitiesTable';
import ActivityDetailsDrawer from '@/components/dashboard/sections/ActivityLog/ActivityDetailsDrawer';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import type { HostedAccountProfileData } from './types';

const ACTIVITY_LIMIT = 25;

type HostedAccountActivitiesTabProps = {
  account?: HostedAccountProfileData;
};

export function HostedAccountActivitiesTab({ account }: HostedAccountActivitiesTabProps) {
  const [selectedActivity, setSelectedActivity] = React.useState(null);

  const queryFilter = useQueryFilter({
    schema: z.object({ limit: integer.default(ACTIVITY_LIMIT), offset: integer.default(0) }),
    filters: {},
    skipRouter: true,
  });

  const { data, loading, error } = useQuery(activityLogQuery, {
    variables: {
      accountSlug: account?.slug,
      account: [{ slug: account?.slug }],
      includeChildrenAccounts: true,
      includeHostedAccounts: false,
      ...queryFilter.variables,
    },
    skip: !account?.slug,
    fetchPolicy: 'network-only',
  });

  const activities = data?.activities;
  const totalCount = activities?.totalCount || 0;

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ActivitiesTable
        activities={activities}
        loading={loading}
        nbPlaceholders={5}
        openActivity={activity => setSelectedActivity(activity)}
        showAccount
      />
      <Pagination queryFilter={queryFilter} total={totalCount} />
      <ActivityDetailsDrawer
        open={Boolean(selectedActivity)}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
}
