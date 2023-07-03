import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { WorkspaceHomeQuery } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityClassesI18N } from '../../../../lib/i18n/activities-classes';

import Container from '../../../Container';
import ExpenseDrawer from '../../../expenses/ExpenseDrawer';
import { Flex, Box } from '../../../Grid';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledButton from '../../../StyledButton';
import { StyledSelectFilter, TruncatedValueContainer } from '../../../StyledSelectFilter';
import { H1 } from '../../../Text';
import { AdminSectionProps } from '../../types';

import { workspaceHomeQuery } from './query';
import TimelineItem from './TimelineItem';

const PAGE_SIZE = 20;

const REACT_SELECT_COMPONENT_OVERRIDE = {
  ValueContainer: TruncatedValueContainer,
  MultiValue: () => null, // Items will be displayed as a truncated string in `TruncatedValueContainer `
};

const getFilterOptions = intl => [
  { value: 'EXPENSES', label: intl.formatMessage(ActivityClassesI18N['expenses.title']) },
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
  const [openExpenseLegacyId, setOpenExpenseLegacyId] = React.useState<number | null>(null);
  const slug = router.query?.as || props.account.slug;
  const { data, loading, error, fetchMore } = useQuery(workspaceHomeQuery, {
    variables: { slug, limit: PAGE_SIZE, type: filters.map(f => f.value) },
    context: API_V2_CONTEXT,
    notifyOnNetworkStatusChange: true,
  });

  const activities: WorkspaceHomeQuery['activities']['nodes'] = data?.activities?.nodes || [];
  const canViewMore = activities.length >= PAGE_SIZE && activities.length % PAGE_SIZE === 0;

  return (
    <Box maxWidth={768} m="0 auto" px={2}>
      <Flex justifyContent="space-between" alignItems="center" mb="32px">
        <H1 fontSize="32px" lineHeight="40px" fontWeight="normal">
          <FormattedMessage id="Dashboard.Home.ActivityHeader" defaultMessage="Recent activity" />
        </H1>
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
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !activities.length && loading ? (
        <React.Fragment>
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
              variables: { offset: activities.length },
              updateQuery: (prevResult, { fetchMoreResult }) => {
                const activities = fetchMoreResult?.activities;
                activities.nodes = [...prevResult.activities.nodes, ...activities.nodes];
                return { activities };
              },
            })
          }
        >
          <FormattedMessage defaultMessage="View more" />
        </StyledButton>
      )}
      <ExpenseDrawer openExpenseLegacyId={openExpenseLegacyId} handleClose={() => setOpenExpenseLegacyId(null)} />
    </Box>
  );
};

export default Home;
