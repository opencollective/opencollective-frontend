import React from 'react';
import { useQuery } from '@apollo/client';
import { flatten } from 'lodash';
import { ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { HELP_MESSAGE } from '../../../../lib/constants/dismissable-help-message';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { WorkspaceHomeQuery } from '../../../../lib/graphql/types/v2/graphql';
import { ActivityClassesI18N } from '../../../../lib/i18n/activities-classes';

import DismissibleMessage from '../../../DismissibleMessage';
import ExpenseDrawer from '../../../expenses/ExpenseDrawer';
import { Flex } from '../../../Grid';
import Image from '../../../Image';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledButton from '../../../StyledButton';
import { makeTruncatedValueAllSelectedLabelContainer, StyledSelectFilter } from '../../../StyledSelectFilter';
import { H2 } from '../../../Text';
import { Alert, AlertDescription, AlertTitle } from '../../../ui/Alert';
import DashboardHeader from '../../DashboardHeader';
import { DashboardSectionProps } from '../../types';

import { workspaceHomeQuery } from './query';
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

const Home = ({ accountSlug }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const filterOptions = React.useMemo(() => getFilterOptions(intl), [intl]);
  const [filters, setFilters] = React.useState(filterOptions);
  const [isTimelineBeingGenerated, setIsTimelineBeingGenerated] = React.useState(false);
  const [openExpenseLegacyId, setOpenExpenseLegacyId] = React.useState<number | null>(null);
  const slug = router.query?.as || accountSlug;
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
    <div className="flex max-w-screen-lg flex-col-reverse xl:flex-row">
      <div className="flex-1">
        <DashboardHeader
          title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
          description={
            <FormattedMessage
              id="Dashboard.Home.Subtitle"
              defaultMessage="The latest news and updates you need to know in Open Collective."
            />
          }
        />

        <Flex flexDirection="column" mt="36px">
          <Flex
            justifyContent="space-between"
            alignItems={[null, 'center']}
            flexDirection={['column', 'row']}
            gap="8px"
          >
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
              maxWidth={['100%', 300]}
              minWidth={150}
              styles={{
                control: { flexWrap: 'nowrap' },
              }}
            />
          </Flex>
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
          </div>
          {canViewMore && (
            <StyledButton
              mt={4}
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
      </div>
      <div className="xl:ml-8 xl:w-64">
        <DismissibleMessage messageId={HELP_MESSAGE.WELCOME_TO_DASHBOARD}>
          {({ dismiss }) => (
            <Alert className="relative mb-8 flex items-start gap-4 fade-in">
              <Image
                className="block h-12 w-12 xl:hidden"
                alt="Illustration of plant"
                width={48}
                height={48}
                src="/static/images/dashboard.png"
              />
              <div>
                <div className="mb-2 flex items-start gap-3">
                  <Image
                    className="hidden h-12 w-12 xl:block"
                    alt="Illustration of plant"
                    width={48}
                    height={48}
                    src="/static/images/dashboard.png"
                  />
                  <AlertTitle className="text-lg leading-tight">
                    <FormattedMessage id="Dashboard.Banner.Title" defaultMessage="Welcome to your new dashboard" />
                  </AlertTitle>
                </div>

                <AlertDescription className="mt-1 max-w-prose">
                  <FormattedMessage
                    id="Dashboard.Banner.Description"
                    defaultMessage="We’ve created this space for you to keep on top of everything you do in Open Collective, from tracking your expenses to managing organizations."
                  />
                  <div className="mt-3 flex justify-between space-x-2">
                    <a
                      href="https://docs.google.com/forms/d/1-WGUCUF_i5HPS6AsN8kTfqofyt0q0HB-q7na4cQL788/viewform"
                      target="_blank"
                      rel="noopener noreferrer"
                      className=" group font-medium hover:underline"
                    >
                      <FormattedMessage id="GiveFeedback" defaultMessage="Give feedback" />{' '}
                      <ArrowRight className="inline-block group-hover:animate-arrow-right" size={16} />
                    </a>
                  </div>
                </AlertDescription>
              </div>

              <button
                className="absolute right-1 top-1 rounded-full p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                onClick={dismiss}
              >
                <X size={16} />
              </button>
            </Alert>
          )}
        </DismissibleMessage>
      </div>
    </div>
  );
};

export default Home;
