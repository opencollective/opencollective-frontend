import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { Question } from '@styled-icons/remix-line/Question';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../lib/filters/filter-types';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type { HostReportsPageQueryVariables } from '../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import HostFeesSection from '../../host-dashboard/reports-section/HostFeesSection';
import PlatformTipsCollected from '../../host-dashboard/reports-section/PlatformTipsCollected';
import TotalMoneyManagedSection from '../../host-dashboard/reports-section/TotalMoneyManagedSection';
import TransactionsOverviewSection from '../../host-dashboard/reports-section/TransactionsOverviewSection';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import NotFound from '../../NotFound';
import StyledCard from '../../StyledCard';
import StyledHr from '../../StyledHr';
import StyledTooltip from '../../StyledTooltip';
import { H2 } from '../../Text';
import { Button } from '../../ui/Button';
import DashboardHeader from '../DashboardHeader';
import ExportTransactionsCSVModal from '../ExportTransactionsCSVModal';
import { dateFilter } from '../filters/DateFilter';
import { DateFilterType } from '../filters/DateFilter/schema';
import { Filterbar } from '../filters/Filterbar';
import { hostedAccountFilter } from '../filters/HostedAccountFilter';
import type { DashboardSectionProps } from '../types';

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
      settings
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

const schema = z.object({
  date: dateFilter.schema,
  account: hostedAccountFilter.schema,
});

type FilterValues = z.infer<typeof schema>;

type FilterMeta = {
  hostSlug: string;
};

const toVariables: FiltersToVariables<FilterValues, HostReportsPageQueryVariables, FilterMeta> = {
  date: dateFilter.toVariables,
  account: hostedAccountFilter.toVariables,
};
const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  date: { ...dateFilter.filter, static: true },
  account: hostedAccountFilter.filter,
};

const getDefaultFilterValues = (): Partial<FilterValues> => {
  return {
    date: {
      type: DateFilterType.BETWEEN,
      gte: dayjs.utc().startOf('month').format('YYYY-MM-DD'),
      lte: dayjs.utc().endOf('day').format('YYYY-MM-DD'),
      tz: 'UTC',
    },
  };
};
const HostDashboardReports = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const defaultFilterValues = getDefaultFilterValues();
  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
    defaultFilterValues,
    meta: { hostSlug },
  });

  const { data, error, loading } = useQuery(hostReportPageQuery, {
    variables: { hostSlug, ...queryFilter.variables },
    context: API_V2_CONTEXT,
  });
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
  const collectives = queryFilter.values.account ? [{ slug: queryFilter.values.account }] : undefined;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="Reports" defaultMessage="Reports" />}
        actions={
          <ExportTransactionsCSVModal
            account={host}
            isHostReport
            queryFilter={queryFilter}
            trigger={
              <Button size="sm" variant="outline">
                <FormattedMessage id="Export.Format" defaultMessage="Export {format}" values={{ format: 'CSV' }} />
              </Button>
            }
          />
        }
      />
      <Filterbar {...queryFilter} />

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
          <HostFeesSection host={host} isLoading={loading} />
        </Container>
        <Container mb={38}>
          <SectionTitle>
            <FormattedMessage id="TransactionsOverview" defaultMessage="Contributions and Expenses" />
          </SectionTitle>
          <TransactionsOverviewSection host={host} isLoading={loading} />
        </Container>
        <Box mb={4}>
          <PlatformTipsCollected host={host} isLoading={loading} />
        </Box>
      </StyledCard>
    </div>
  );
};

HostDashboardReports.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default HostDashboardReports;
