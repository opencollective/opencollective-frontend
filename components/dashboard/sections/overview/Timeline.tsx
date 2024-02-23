import React from 'react';
import { useQuery } from '@apollo/client';
import { flatten } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { TimelineQuery } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityClassesI18N } from '../../../../lib/i18n/activities-classes';

import ExpenseDrawer from '../../../expenses/ExpenseDrawer';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { makeTruncatedValueAllSelectedLabelContainer, StyledSelectFilter } from '../../../StyledSelectFilter';
import { Button } from '../../../ui/Button';

import { timelineQuery } from './queries';
import TimelineItem from './TimelineItem';

const PAGE_SIZE = 20;

const REACT_SELECT_COMPONENT_OVERRIDE = {
  ValueContainer: makeTruncatedValueAllSelectedLabelContainer(
    <FormattedMessage id="Dashboard.AllActivities" defaultMessage="All activities" />,
  ),
  MultiValue: () => null, // Items will be displayed as a truncated string in `TruncatedValueContainer `
};

const getFilterOptions = intl => [
  { value: 'EXPENSES,VIRTUAL_CARDS', label: intl.formatMessage(ActivityClassesI18N['expenses.title']) },
  { value: 'CONTRIBUTIONS', label: intl.formatMessage(ActivityClassesI18N['contributions.title']) },
  {
    value: 'ACTIVITIES_UPDATES',
    label: intl.formatMessage(ActivityClassesI18N['activitiesUpdates.title']),
  },
];

export function Timeline({ accountSlug, withFilter = false }) {
  const intl = useIntl();
  const [isTimelineBeingGenerated, setIsTimelineBeingGenerated] = React.useState(false);
  const [openExpenseLegacyId, setOpenExpenseLegacyId] = React.useState<number | null>(null);
  const filterOptions = React.useMemo(() => getFilterOptions(intl), [intl]);
  const [filters, setFilters] = React.useState(filterOptions);

  const { data, loading, error, fetchMore, refetch } = useQuery(timelineQuery, {
    variables: {
      slug: accountSlug,
      limit: PAGE_SIZE,
      classes: flatten(filters.map(f => f.value.split(','))),
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">
          <FormattedMessage id="Dashboard.Home.ActivityHeader" defaultMessage="Recent activity" />
        </h3>
        {withFilter && (
          <StyledSelectFilter
            intl={intl}
            inputId="activity-filter"
            isClearable={false}
            onChange={setFilters}
            options={filterOptions}
            components={REACT_SELECT_COMPONENT_OVERRIDE}
            value={filters}
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            isMulti
            maxWidth={['100%', 300]}
            minWidth={150}
            styles={{
              control: { flexWrap: 'nowrap' },
            }}
          />
        )}
      </div>

      <div className="mt-4 space-y-4">
        {error && !isTimelineBeingGenerated ? (
          <MessageBoxGraphqlError error={error} />
        ) : isTimelineBeingGenerated || (!activities.length && loading) ? (
          <React.Fragment>
            {isTimelineBeingGenerated && (
              <MessageBox type="info" withIcon mb="24px">
                <FormattedMessage defaultMessage="Generating activity timeline..." />
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
            <FormattedMessage defaultMessage="No activity yet" />
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
            <FormattedMessage defaultMessage="View more" />
          </Button>
        )}
      </div>

      <ExpenseDrawer openExpenseLegacyId={openExpenseLegacyId} handleClose={() => setOpenExpenseLegacyId(null)} />
    </div>
  );
}
