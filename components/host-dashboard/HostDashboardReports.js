import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { Question } from '@styled-icons/remix-line/Question';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import { simpleDateToISOString } from '../../lib/date-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import PeriodFilter from '../filters/PeriodFilter';
import { Box, Flex, Grid } from '../Grid';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import NotFound from '../NotFound';
import { PERIOD_FILTER_PRESETS } from '../PeriodFilterPresetsSelect';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledTooltip from '../StyledTooltip';
import { H1, H2 } from '../Text';

import HostCSVDownloadButton from './reports-section/HostCSVDownloadButton';
import HostFeesSection from './reports-section/HostFeesSection';
import PlatformTipsCollected from './reports-section/PlatformTipsCollected';
import TotalMoneyManagedSection from './reports-section/TotalMoneyManagedSection';
import TransactionsOverviewSection from './reports-section/TransactionsOverviewSection';

const hostReportPageQuery = gql`
  query HostReportsPage(
    $hostSlug: String!
    $account: [AccountReferenceInput!]
    $dateFrom: DateTime
    $dateTo: DateTime
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
      slug
      name
      currency
      isHost
      isActive
      type
      createdAt
      hostFeePercent
      isTrustedHost
      stats {
        id
        balance(dateTo: $dateTo) {
          valueInCents
          currency
        }
      }
      contributionStats(account: $account, dateFrom: $dateFrom, dateTo: $dateTo) {
        contributionsCount
        oneTimeContributionsCount
        recurringContributionsCount
        dailyAverageIncomeAmount {
          valueInCents
        }
      }
      expenseStats(account: $account, dateFrom: $dateFrom, dateTo: $dateTo) {
        expensesCount
        dailyAverageAmount {
          valueInCents
        }
        invoicesCount
        reimbursementsCount
        grantsCount
      }
      hostMetrics(account: $account, dateFrom: $dateFrom, dateTo: $dateTo) {
        hostFees {
          valueInCents
          currency
        }
        hostFeeShare {
          valueInCents
          currency
        }
        platformTips {
          valueInCents
          currency
        }
        pendingPlatformTips {
          valueInCents
          currency
        }
        totalMoneyManaged {
          valueInCents
          currency
        }
      }
      hostMetricsTimeSeries(account: $account, dateFrom: $dateFrom, dateTo: $dateTo) {
        timeUnit
        totalReceived {
          timeUnit
          nodes {
            date
            kind
            amount {
              value
            }
          }
        }
        totalSpent {
          timeUnit
          nodes {
            date
            kind
            amount {
              value
            }
          }
        }
      }
    }
  }
`;

const SectionTitle = ({ children, hint = null }) => (
  <Flex alignItems="center" justifyContent="space-between" mb={22}>
    <H2 fontWeight="500" fontSize="20px" lineHeight="28px">
      {children}
    </H2>
    {hint && (
      <Box mx={2}>
        <StyledTooltip content={hint}>
          <Question size={18} color="#75777A" />
        </StyledTooltip>
      </Box>
    )}
    <StyledHr borderColor="black.300" flex="1" ml={2} />
  </Flex>
);

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
  hint: PropTypes.node,
};

const FilterLabel = styled.label`
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #4e5052;
`;

const prepareCollectivesForFilter = collectives => {
  return !collectives?.length ? null : collectives.map(({ value }) => ({ legacyId: value.id, slug: value.slug }));
};

const getDefaultDateInterval = () => {
  const interval = PERIOD_FILTER_PRESETS.thisMonth.getInterval();
  return {
    timezoneType: 'UTC', // To match the monthly host report sent by email
    from: interval.from.format('YYYY-MM-DD'),
    to: interval.to.format('YYYY-MM-DD'),
  };
};

const HostDashboardReports = ({ hostSlug }) => {
  const [dateInterval, setDateInterval] = React.useState(getDefaultDateInterval);
  const [collectives, setCollectives] = React.useState(null);
  const dateFrom = simpleDateToISOString(dateInterval?.from, false, dateInterval?.timezoneType);
  const dateTo =
    // Not useful to pass today or a future date, can end up deoptimizing the API call
    dateInterval?.to && dayjs(dateInterval?.to).isBefore(dayjs().startOf('day'))
      ? simpleDateToISOString(dateInterval?.to, true, dateInterval?.timezoneType)
      : null;
  const variables = { hostSlug, account: collectives, dateFrom, dateTo };
  const { data, error, loading } = useQuery(hostReportPageQuery, { variables, context: API_V2_CONTEXT });
  const host = data?.host;

  if (!loading) {
    if (error) {
      return <MessageBoxGraphqlError error={error} maxWidth={500} m="0 auto" />;
    } else if (!host) {
      return <NotFound />;
    } else if (!host.isActive) {
      return (
        <MessageBox withIcon type="error" maxWidth={400} m="0 auto">
          <FormattedMessage id="host.onlyActive" defaultMessage="This page is only available for active fiscal hosts" />
        </MessageBox>
      );
    }
  }

  return (
    <Box m="0 auto" px={2}>
      <Flex alignItems="center" mb={24} flexWrap="wrap">
        <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal">
          <FormattedMessage id="Reports" defaultMessage="Reports" />
        </H1>
        <Box mx="auto" />
      </Flex>
      <Container
        position={['relative', 'sticky']}
        top="0"
        background="white"
        zIndex="10"
        py={3}
        mb={4}
        boxShadow="5px 12px 7px -10px #44444429"
      >
        <Grid gridTemplateColumns={['100%', '1fr 2fr auto']} gridGap={['8px', null, null, '28px']} width="100%">
          <div>
            <FilterLabel htmlFor="transactions-period-filter">
              <FormattedMessage id="TransactionsOverviewSection.PeriodFilter" defaultMessage="Filter by Date" />
            </FilterLabel>
            <PeriodFilter onChange={setDateInterval} value={dateInterval} minDate={host?.createdAt} />
          </div>
          <div>
            <FilterLabel htmlFor="transactions-collective-filter">
              <FormattedMessage
                id="TransactionsOverviewSection.CollectiveFilter"
                defaultMessage="Filter by Collective"
              />
            </FilterLabel>
            <CollectivePickerAsync
              inputId="TransactionsCollectiveFilter"
              data-cy="transactions-collective-filter"
              types={[CollectiveType.COLLECTIVE, CollectiveType.EVENT, CollectiveType.PROJECT, CollectiveType.FUND]}
              isMulti
              hostCollectiveIds={[host?.legacyId]}
              onChange={value => setCollectives(prepareCollectivesForFilter(value))}
              styles={{ control: baseStyles => ({ ...baseStyles, borderRadius: 16 }) }}
              isLoading={loading}
              disabled={loading}
              useCompactMode
            />
          </div>
          <Flex alignItems="flex-end" width="100%" mt={[24, 0]}>
            <HostCSVDownloadButton host={host} collectives={collectives} dateInterval={dateInterval} />
          </Flex>
        </Grid>
      </Container>
      <StyledCard mb={5} borderRadius="12px" padding="32px 24px" borderColor="black.400">
        <Container mb={38}>
          <SectionTitle
            hint={
              <FormattedMessage
                id="Host.Metrics.TotalMoneyManages.description"
                defaultMessage="Total amount held in your bank account for the Host and its Collectives."
              />
            }
          >
            <FormattedMessage id="Host.Metrics.TotalMoneyManages" defaultMessage="Total Money Managed" />
          </SectionTitle>
          <TotalMoneyManagedSection host={host} isLoading={loading} collectives={collectives} />
        </Container>
        <Container mb={38}>
          <SectionTitle>
            <FormattedMessage id="Host.Metrics.HostFees" defaultMessage="Host Fees" />
          </SectionTitle>
          <HostFeesSection host={host} collectives={collectives} isLoading={loading} />
        </Container>
        <Container mb={38}>
          {/*
          <SectionTitle
            hint={
              <FormattedMessage
                id="HostDashboardReports.TransactionsOverview.description"
                defaultMessage="Transactions related to contributions and expenses."
              />
            }
          >
          */}
          <SectionTitle>
            <FormattedMessage id="TransactionsOverview" defaultMessage="Contributions and Expenses" />
          </SectionTitle>
          <TransactionsOverviewSection host={host} isLoading={loading} />
        </Container>
        <Box mb={4}>
          <PlatformTipsCollected host={host} isLoading={loading} />
        </Box>
      </StyledCard>
    </Box>
  );
};

HostDashboardReports.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default HostDashboardReports;
