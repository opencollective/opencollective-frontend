import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { TimelineQuery } from '../../../../lib/graphql/types/v2/graphql';
import { getDashboardRoute } from '@/lib/url-helpers';

import { InfoTooltipIcon } from '@/components/InfoTooltipIcon';
import Link from '@/components/Link';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

import ExpenseDrawer from '../../../expenses/ExpenseDrawer';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { DashboardContext } from '../../DashboardContext';

import { timelineQuery } from './queries';
import TimelineItem from './TimelineItem';

const PAGE_SIZE = 20;

export function Timeline({ accountSlug, withTitle = false }) {
  const { account } = useContext(DashboardContext);
  const [isTimelineBeingGenerated, setIsTimelineBeingGenerated] = React.useState(false);
  const [openExpenseLegacyId, setOpenExpenseLegacyId] = React.useState<number | null>(null);

  const { data, loading, error, fetchMore, refetch } = useQuery(timelineQuery, {
    variables: {
      slug: accountSlug,
      limit: PAGE_SIZE,
      classes: ['EXPENSES', 'VIRTUAL_CARDS', 'CONTRIBUTIONS', 'ACTIVITIES_UPDATES', 'COLLECTIVE'],
    },

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
  }, [error, data, refetch]);

  return (
    <Card className="pb-3">
      {withTitle && (
        <CardHeader className="relative">
          <CardTitle className="relative text-xl">
            <FormattedMessage id="Dashboard.Home.ActivityHeader" defaultMessage="Recent activity" />{' '}
            <InfoTooltipIcon className="inline-block" contentClassname="font-normal">
              <FormattedMessage
                defaultMessage="This is a selection of activities happening on your account, go to the <Link>Activity log</Link> to see everything."
                id="hTYdKy"
                values={{
                  Link: label => (
                    <Link className="underline" href={getDashboardRoute(account, 'activity-log')}>
                      {label}
                    </Link>
                  ),
                }}
              />
            </InfoTooltipIcon>
          </CardTitle>
          <CardAction>
            <Button asChild variant="outline">
              <Link href={getDashboardRoute(account, 'activity-log')}>
                <FormattedMessage defaultMessage="Go to activity log" id="zOk9pq" /> <ArrowRight size={14} />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col gap-3 divide-y">
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
                variant="ghost"
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
