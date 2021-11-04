import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { ChevronDown } from '@styled-icons/fa-solid/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/fa-solid/ChevronUp/ChevronUp';
import dynamic from 'next/dynamic';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

import { get, groupBy } from 'lodash';
import styled from 'styled-components';

import { CollectiveType } from '../../../lib/collective-sections';
import { formatCurrency } from '../../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { i18nTransactionSettlementStatus } from '../../../lib/i18n/transaction';

import PeriodFilter from '../../budget/filters/PeriodFilter';
import { ChartWrapper } from '../../ChartWrapper';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import Container from '../../Container';
import ContainerOverlay from '../../ContainerOverlay';
import { Box, Flex } from '../../Grid';
import Image from '../../Image';
import Loading from '../../Loading';
import StyledCard from '../../StyledCard';
import StyledLinkButton from '../../StyledLinkButton';
import { StyledSelectFilter } from '../../StyledSelectFilter';
import StyledSpinner from '../../StyledSpinner';
import { P, Span } from '../../Text';

import { getActiveYearsOptions } from './helpers';

const hostFeeSectionQuery = gqlV2/* GraphQL */ `
  query HostFeeSection($hostSlug: String!, $dateFrom: DateTime!, $dateTo: DateTime!) {
    host(slug: $hostSlug) {
      id
      legacyId
      createdAt
      currency
      hostMetricsTimeSeries(dateFrom: $dateFrom, dateTo: $dateTo, timeUnit: MONTH) {
        hostFees {
          nodes {
            date
            amount {
              value
              valueInCents
              currency
            }
          }
        }
        hostFeeShare {
          nodes {
            date
            settlementStatus
            amount {
              value
              valueInCents
              currency
            }
          }
        }
      }
    }
  }
`;

const hostFeeSectionTimeSeriesQuery = gqlV2/* GraphQL */ `
  query HostFeeSectionTimeSeries(
    $hostSlug: String!
    $dateFrom: DateTime!
    $dateTo: DateTime!
    $account: [AccountReferenceInput!]
  ) {
    host(slug: $hostSlug) {
      id
      hostMetrics(dateFrom: $dateFrom, dateTo: $dateTo, account: $account) {
        hostFees {
          valueInCents
          currency
        }
        hostFeeShare {
          valueInCents
          currency
        }
      }
    }
  }
`;

const FilterLabel = styled.label`
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #4e5052;
`;

const getChartOptions = (intl, hostCurrency) => ({
  chart: {
    id: 'chart-host-report-fees',
    stacked: true,
  },
  legend: {
    show: true,
    showForSingleSeries: true,
    horizontalAlign: 'left',
    fontWeight: 'bold',
    fontSize: '12px',
    markers: {
      width: 16,
      height: 16,
    },
  },
  dataLabels: { enabled: false },
  grid: {
    raw: { opacity: 0 },
    column: { opacity: 0 },
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: false } },
  },
  plotOptions: {
    bar: {
      columnWidth: '50%',
    },
  },
  colors: ['#46347F', '#95DDF4', '#F5C451', '#0EA755'], // TODO(HostReport): Use host primary colors
  xaxis: {
    categories: [...new Array(12)].map(
      (_, idx) => `${intl.formatDate(new Date(0, idx), { month: 'short' }).toUpperCase()}`,
    ),
  },
  yaxis: {
    labels: {
      minWidth: 38,
      formatter: function (value) {
        return value < 1000 ? value : `${Math.round(value / 1000)}k`;
      },
    },
  },
  tooltip: {
    y: {
      formatter: function (value) {
        return formatCurrency(value * 100, hostCurrency);
      },
    },
  },
});

const getHostFeesWithoutShare = (hostFeeNodes, hostFeeShareNodes) => {
  const totalHostFeeSharePerMonthInCents = hostFeeShareNodes.reduce((result, node) => {
    const monthKey = new Date(node.date).getMonth();
    result[monthKey] = (result[monthKey] || 0) + node.amount.valueInCents;
    return result;
  }, {});

  return hostFeeNodes.map(node => {
    const monthKey = new Date(node.date).getMonth();
    if (totalHostFeeSharePerMonthInCents[monthKey]) {
      const valueInCents = node.amount.valueInCents - totalHostFeeSharePerMonthInCents[monthKey];
      return { ...node, amount: { ...node.amount, valueInCents, value: valueInCents / 100 } };
    } else {
      return node;
    }
  });
};

const SERIES_NAMES = defineMessages({
  hostRevenue: { defaultMessage: 'Host revenue' },
  hostFeeShare: { id: 'Transaction.kind.HOST_FEE_SHARE', defaultMessage: 'Host fee share' },
});

const getSeriesFromData = (intl, timeSeries) => {
  const dataToSeries = data => {
    const series = new Array(12).fill(0); // = 12 months
    data?.forEach(({ date, amount }) => (series[new Date(date).getMonth()] = amount.value));
    return series;
  };

  const hostFeeNodes = get(timeSeries, 'hostFees.nodes', []);
  const hostFeeShareNodes = get(timeSeries, 'hostFeeShare.nodes', []);
  return [
    {
      name: intl.formatMessage(SERIES_NAMES.hostRevenue),
      data: dataToSeries(getHostFeesWithoutShare(hostFeeNodes, hostFeeShareNodes)),
    },
    ...Object.entries(groupBy(hostFeeShareNodes, 'settlementStatus')).map(([status, nodes]) => ({
      name: `${intl.formatMessage(SERIES_NAMES.hostFeeShare)} (${i18nTransactionSettlementStatus(intl, status)})`,
      data: dataToSeries(nodes),
    })),
  ];
};

const getQueryVariables = (hostSlug, year) => {
  return {
    hostSlug,
    dateFrom: `${year}-01-01T00:00:00Z`,
    dateTo: `${year}-12-31T23:59:59Z`,
  };
};

const HostFeesSection = ({ hostSlug }) => {
  const intl = useIntl();
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const variables = getQueryVariables(hostSlug, selectedYear);
  const { loading, data, previousData } = useQuery(hostFeeSectionQuery, { variables, context: API_V2_CONTEXT });
  const host = loading && !data ? previousData?.host : data?.host;
  const timeSeries = host?.hostMetricsTimeSeries;
  const series = useMemo(() => getSeriesFromData(intl, timeSeries), [timeSeries]);
  const yearsOptions = useMemo(() => getActiveYearsOptions(host), [host]);
  const chartOptions = useMemo(() => getChartOptions(intl, host?.currency), [host?.currency]);
  const [dateInterval, setDateInterval] = useState(null);
  const [showHostFeeChart, setShowHostFeeChart] = useState(false);
  const [collectives, setCollectives] = useState(null);
  const { loading: loadingHostMetrics, data: hostMetricsData } = useQuery(hostFeeSectionTimeSeriesQuery, {
    variables: {
      dateFrom: dateInterval?.from ? new Date(dateInterval.from) : variables.dateFrom,
      dateTo: dateInterval?.to ? new Date(dateInterval.to) : variables.dateTo,
      account: collectives,
      hostSlug,
    },
    context: API_V2_CONTEXT,
  });

  if (loading && !host) {
    return <Loading />;
  }

  let totalHostFees, profit, sharedRevenue;
  if (!loadingHostMetrics) {
    const { hostFees, hostFeeShare } = hostMetricsData.host.hostMetrics;
    totalHostFees = hostFees.valueInCents;
    sharedRevenue = hostFeeShare.valueInCents;
    profit = totalHostFees - sharedRevenue;
  }

  const setCollectiveFilter = collectives => {
    if (collectives.length === 0) {
      setCollectives(null);
    } else {
      const collectiveIds = collectives.map(collective => ({ legacyId: collective.value.id }));
      setCollectives(collectiveIds);
    }
  };

  return (
    <React.Fragment>
      <Flex flexWrap="wrap" mt="16px" mb="16px">
        <Container width={[1, 1, 1 / 2]} pr={2} mb={[3, 3, 0, 0]}>
          <FilterLabel htmlFor="transactions-period-filter">
            <FormattedMessage id="TransactionsOverviewSection.PeriodFilter" defaultMessage="Filter by Date" />
          </FilterLabel>
          <PeriodFilter onChange={setDateInterval} value={dateInterval} minDate={host?.createdAt} />
        </Container>
        <Container width={[1, 1, 1 / 2]}>
          <FilterLabel htmlFor="transactions-collective-filter">
            <FormattedMessage id="TransactionsOverviewSection.CollectiveFilter" defaultMessage="Filter by Collective" />
          </FilterLabel>
          <CollectivePickerAsync
            inputId="TransactionsCollectiveFilter"
            data-cy="transactions-collective-filter"
            types={[CollectiveType.COLLECTIVE, CollectiveType.EVENT, CollectiveType.PROJECT]}
            isMulti
            hostCollectiveIds={[host?.legacyId]}
            onChange={value => setCollectiveFilter(value)}
          />
        </Container>
      </Flex>
      <StyledCard minHeight={200} px={3} css={{ background: '#F6F5FF' }}>
        {loadingHostMetrics ? (
          <Loading />
        ) : (
          <Flex flexWrap="wrap">
            <Container width={[1, 1, '230px']} px={2}>
              <P fontSize="12px" fontWeight="500" textTransform="uppercase" mt="24px">
                <Span mr={10}>
                  <Image width={14} height={7} src="/static/images/host-fees-timeline.svg" />
                </Span>
                <FormattedMessage defaultMessage="Total Host Fees" />
              </P>
              <Box pt="12px" pb="10px" fontSize="18px" fontWeight="500">
                {formatCurrency(totalHostFees, host.currency)}
              </Box>
              <P fontSize="12px" fontWeight="400" mt="10px">
                <FormattedMessage defaultMessage="Host Fees charged each month, which will be added to the Host budget at the end of the month." />
              </P>
            </Container>
            <Container display={['none', 'none', 'flex']} borderLeft="1px solid #6B5D99" height="88px" mt="39px" />
            <Container width={[1, 1, '230px']} px={2}>
              <P fontSize="12px" fontWeight="500" textTransform="uppercase" mt="24px">
                <Span mr={10}>
                  <Image width={6.5} height={12} mr={10} src="/static/images/host-fees-money-sign.svg" />
                </Span>
                <FormattedMessage defaultMessage="Your Profit" />
              </P>
              <Box pt="12px" pb="10px" fontSize="18px" fontWeight="500">
                {formatCurrency(profit, host.currency)}
              </Box>
              <P fontSize="12px" fontWeight="400" mt="10px">
                <FormattedMessage defaultMessage="The profit as an organization resulting of the host fees you collect without the shared revenue for the use of the platform." />
              </P>
            </Container>
            <Container display={['none', 'none', 'flex']} borderLeft="1px solid #6B5D99" height="88px" mt="39px" />
            <Container width={[1, 1, '230px']} px={2}>
              <P fontSize="12px" fontWeight="500" textTransform="uppercase" mt="24px">
                <Span mr={10}>
                  <Image width={9.42} height={12} mr={10} src="/static/images/host-fees-oc.svg" />
                </Span>
                <FormattedMessage defaultMessage="Shared Revenue" />
              </P>
              <Box pt="12px" pb="10px" fontSize="18px" fontWeight="500">
                {formatCurrency(sharedRevenue, host.currency)}
              </Box>
              <P fontSize="12px" fontWeight="400" mt="10px">
                <FormattedMessage defaultMessage="The cost of using the platform. It is collected each month with a settlement invoice uploaded to you as an expense." />
              </P>
            </Container>
          </Flex>
        )}
        <Flex flexWrap="wrap">
          <Container width={[1, 1, 3 / 4]} px={2}>
            <P fontSize="12px" fontWeight="400" mt="16px">
              <FormattedMessage defaultMessage="How is you organization's doing using Open Collective?" />
            </P>
          </Container>
          <Container width={[1, 1, 1 / 4]} px={2} textAlign="right">
            <StyledLinkButton asLink color="#46347F" onClick={() => setShowHostFeeChart(!showHostFeeChart)}>
              <P fontSize="12px" fontWeight="400" mt="16px">
                <FormattedMessage defaultMessage="See historical" />
                <Span pl="8px">
                  {showHostFeeChart ? (
                    <ChevronUp size={12} color="#46347F" />
                  ) : (
                    <ChevronDown fontVariant="solid" size={12} color="#46347F" />
                  )}
                </Span>
              </P>
            </StyledLinkButton>
          </Container>
        </Flex>
        {showHostFeeChart && (
          <Box py={3}>
            <Flex alignItems="center" px={2} mb={2}>
              <P fontSize="11px" fontWeight="700" mr={3} textTransform="uppercase">
                <FormattedMessage id="HostFeesSection.Title" defaultMessage="Collected host fees per year" />
              </P>
              <StyledSelectFilter
                inputId="host-report-host-fees-year-select"
                options={yearsOptions}
                defaultValue={{ value: selectedYear, label: selectedYear }}
                onChange={({ value }) => setSelectedYear(value)}
                isSearchable={false}
                minWidth={100}
              />
            </Flex>
            <ChartWrapper>
              {loading && (
                <ContainerOverlay>
                  <StyledSpinner size={64} />
                </ContainerOverlay>
              )}
              <Chart type="bar" width="100%" height="250px" options={chartOptions} series={series} />
            </ChartWrapper>
          </Box>
        )}
      </StyledCard>
    </React.Fragment>
  );
};

HostFeesSection.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default HostFeesSection;
