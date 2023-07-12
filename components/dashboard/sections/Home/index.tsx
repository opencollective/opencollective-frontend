import React from 'react';
import { useQuery } from '@apollo/client';
import { flatten } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { WorkspaceHomeQuery } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityClassesI18N } from '../../../../lib/i18n/activities-classes';

import Container from '../../../Container';
import ExpenseDrawer from '../../../expenses/ExpenseDrawer';
import { Flex } from '../../../Grid';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledButton from '../../../StyledButton';
import { StyledSelectFilter, TruncatedValueContainer } from '../../../StyledSelectFilter';
import { H1, H2 } from '../../../Text';
import { AdminSectionProps } from '../../types';

import { workspaceHomeQuery } from './query';
import TimelineItem from './TimelineItem';

const PAGE_SIZE = 20;

const REACT_SELECT_COMPONENT_OVERRIDE = {
  ValueContainer: TruncatedValueContainer,
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

const Home = (props: AdminSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const filterOptions = React.useMemo(() => getFilterOptions(intl), [intl]);
  const [filters, setFilters] = React.useState(filterOptions);
  const [isTimelineBeingGenerated, setIsTimelineBeingGenerated] = React.useState(false);
  const [openExpenseLegacyId, setOpenExpenseLegacyId] = React.useState<number | null>(null);
  const slug = router.query?.as || props.account.slug;
  const { data, loading, error, fetchMore, refetch } = useQuery(workspaceHomeQuery, {
    variables: { slug, limit: PAGE_SIZE, classes: flatten(filters.map(f => f.value.split(','))) },
    context: API_V2_CONTEXT,
    notifyOnNetworkStatusChange: true,
  });

  const activities: WorkspaceHomeQuery['account']['feed'] = data?.account.feed || [];
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
    <Container maxWidth={'100%'}>
      <H1 fontSize="32px" lineHeight="40px" fontWeight="normal">
        <FormattedMessage id="Dashboard.Home.Title" defaultMessage="This is your workspace" />
      </H1>
      <Flex flexDirection="column" mt="50px">
        <Flex justifyContent="space-between" alignItems="center" mb="32px">
          <H2 fontSize="20px" lineHeight="28px" fontWeight="700">
            <FormattedMessage id="Dashboard.Home.ActivityHeader" defaultMessage="Recent activity" />
          </H2>
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
            maxWidth={['100%', 200, 300]}
            minWidth={150}
            styles={{
              control: { flexWrap: 'nowrap' },
            }}
            {...props}
          />
        </Flex>
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
        ) : !activities ? (
          <MessageBox type="info" withIcon>
            <FormattedMessage defaultMessage="No activity yet" />
          </MessageBox>
        ) : (
          activities.map(activity => (
            <TimelineItem key={activity.id} activity={activity} openExpense={id => setOpenExpenseLegacyId(id)} />
          ))
        )}
        {canViewMore && (
          <StyledButton
            mt={2}
            width="100%"
            buttonSize="small"
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
          </StyledButton>
        )}
        <ExpenseDrawer openExpenseLegacyId={openExpenseLegacyId} handleClose={() => setOpenExpenseLegacyId(null)} />
      </Flex>
    </Container>
  );
};

export default Home;
