import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { TimelineQuery } from '../../../../lib/graphql/types/v2/graphql';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

import ExpenseDrawer from '../../../expenses/ExpenseDrawer';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';

import { timelineQuery } from './queries';
import TimelineItem from './TimelineItem';

const PAGE_SIZE = 20;

export function Timeline({ accountSlug, withTitle = false }) {
  const [isTimelineBeingGenerated, setIsTimelineBeingGenerated] = React.useState(false);
  const [openExpenseLegacyId, setOpenExpenseLegacyId] = React.useState<number | null>(null);

  const { data, loading, error, fetchMore, refetch } = useQuery(timelineQuery, {
    variables: {
      slug: accountSlug,
      limit: PAGE_SIZE,
      classes: ['EXPENSES', 'VIRTUAL_CARDS', 'CONTRIBUTIONS', 'ACTIVITIES_UPDATES', 'COLLECTIVE'],
    },
    context: API_V2_CONTEXT,
    notifyOnNetworkStatusChange: true,
  });
  const activities: TimelineQuery['account']['feed'] = data?.account.feed || [];
  const canViewMore = activities.length >= PAGE_SIZE && activities.length % PAGE_SIZE === 0;

  React.useEffect(() => {
    if (error?.graphQLErrors?.[0]?.extensions?.code === 'ContentNotReady') {
      setIsTimelineBeingGenerated(true);
      setTimeout(() => refetch(), 1000);
    } else if (data?.account?.feed) {
      setIsTimelineBeingGenerated(false);
    }
  }, [error, data]);

  return (
    <Card>
      {withTitle && (
        <CardHeader>
          <CardTitle className="text-xl">
            <FormattedMessage id="Dashboard.Home.ActivityHeader" defaultMessage="Recent activity" />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={!withTitle && 'pt-6'}>
        <div className="space-y-3">
          <div className="flex flex-col gap-6">
            {error && !isTimelineBeingGenerated ? (
              <MessageBoxGraphqlError error={error} />
            ) : isTimelineBeingGenerated || (!activities.length && loading) ? (
              <React.Fragment>
                {isTimelineBeingGenerated && (
                  <MessageBox type="info" withIcon mb="24px">
                    <FormattedMessage defaultMessage="Generating activity timeline..." id="Uf2NLT" />
                  </MessageBox>
                )}
                <TimelineItem />
                <TimelineItem />
                <TimelineItem />
                <TimelineItem />
                <TimelineItem />
              </React.Fragment>
            ) : !activities.length ? (
              <MessageBox type="info" withIcon>
                <FormattedMessage defaultMessage="No activity yet" id="aojEGT" />
              </MessageBox>
            ) : (
              activities.map(activity => (
                <TimelineItem key={activity.id} activity={activity} openExpense={id => setOpenExpenseLegacyId(id)} />
              ))
            )}
            {canViewMore && (
              <Button
                className="w-full"
                size="sm"
                variant="outline"
                loading={loading}
                onClick={() =>
                  fetchMore({
                    variables: { dateTo: activities[activities.length - 1].createdAt },
                    updateQuery: (prevResult, { fetchMoreResult }) => {
                      const account = fetchMoreResult?.account;
                      account.feed = [...prevResult.account.feed, ...account.feed];
                      return { account };
                    },
                  })
                }
              >
                <FormattedMessage defaultMessage="View more" id="34Up+l" />
              </Button>
            )}
          </div>

          <ExpenseDrawer openExpenseLegacyId={openExpenseLegacyId} handleClose={() => setOpenExpenseLegacyId(null)} />
        </div>
      </CardContent>
    </Card>
  );
}
