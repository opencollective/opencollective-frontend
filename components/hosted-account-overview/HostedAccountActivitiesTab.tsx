import React from 'react';
import { useQuery } from '@apollo/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { activityLogQuery } from '@/components/dashboard/sections/ActivityLog';
import ActivitiesTable from '@/components/dashboard/sections/ActivityLog/ActivitiesTable';
import ActivityDetailsDrawer from '@/components/dashboard/sections/ActivityLog/ActivityDetailsDrawer';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { Button } from '@/components/ui/Button';

import type { HostedAccountProfileData } from './types';

const ACTIVITY_LIMIT = 25;

type HostedAccountActivitiesTabProps = {
  account?: HostedAccountProfileData;
};

export function HostedAccountActivitiesTab({ account }: HostedAccountActivitiesTabProps) {
  const [offset, setOffset] = React.useState(0);
  const [selectedActivity, setSelectedActivity] = React.useState(null);

  const { data, loading, error } = useQuery(activityLogQuery, {
    variables: {
      accountSlug: account?.slug,
      account: [{ slug: account?.slug }],
      limit: ACTIVITY_LIMIT,
      offset,
      includeChildrenAccounts: true,
      includeHostedAccounts: false,
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
    <div className="flex flex-col gap-4 text-[13px]">
      <React.Fragment>
        <ActivitiesTable
          activities={activities}
          loading={loading}
          nbPlaceholders={5}
          openActivity={activity => setSelectedActivity(activity)}
          showAccount
        />
        {totalCount > ACTIVITY_LIMIT && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - ACTIVITY_LIMIT))}
            >
              <ChevronLeft size={16} />
              <FormattedMessage defaultMessage="Previous" id="Pagination.Prev" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + ACTIVITY_LIMIT >= totalCount}
              onClick={() => setOffset(offset + ACTIVITY_LIMIT)}
            >
              <FormattedMessage defaultMessage="Next" id="Pagination.Next" />
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </React.Fragment>
      <ActivityDetailsDrawer
        open={Boolean(selectedActivity)}
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
}
