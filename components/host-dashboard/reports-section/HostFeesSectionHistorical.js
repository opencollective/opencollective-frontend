import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import dynamic from 'next/dynamic';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

import { get, groupBy } from 'lodash';
import styled from 'styled-components';

import { formatCurrency } from '../../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { i18nTransactionSettlementStatus } from '../../../lib/i18n/transaction';

import { Box, Flex } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import { StyledSelectFilter } from '../../StyledSelectFilter';
import { P } from '../../Text';

const hostFeeSectionTimeSeriesQuery = gqlV2/* GraphQL */ `
  query HostFeeSectionTimeSeries($hostSlug: String!, $dateFrom: DateTime!, $dateTo: DateTime!) {
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

const ChartWrapper = styled.div`
  position: relative;

  .apexcharts-legend-series {
    background: white;
    padding: 8px;
    border-radius: 10px;
    & > span {
      vertical-align: middle;
    }
  }

  .apexcharts-legend-marker {
    margin-right: 8px;
  }
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

const SERIES_NAMES = defineMessages({
  hostRevenue: { defaultMessage: 'Host revenue' },
  hostFeeShare: { id: 'Transaction.kind.HOST_FEE_SHARE', defaultMessage: 'Host fee share' },
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

const getActiveYearsOptions = host => {
  const currentYear = new Date().getFullYear();
  const firstYear = host ? parseInt(host.createdAt.split('-')[0]) : currentYear;
  const activeYears = [...Array(currentYear - firstYear + 1).keys()].map(year => year + firstYear);
  return activeYears.map(year => ({ value: year, label: year }));
};

const getQueryVariables = (hostSlug, year) => {
  return {
    hostSlug,
    dateFrom: `${year}-01-01T00:00:00Z`,
    dateTo: `${year}-12-31T23:59:59Z`,
  };
};

export const HostFeesSectionHistorical = ({ hostSlug }) => {
  const intl = useIntl();
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const variables = getQueryVariables(hostSlug, selectedYear);
  const { loading, data } = useQuery(hostFeeSectionTimeSeriesQuery, { variables, context: API_V2_CONTEXT });
  const host = data?.host;
  const timeSeries = data?.host?.hostMetricsTimeSeries;
  const series = useMemo(() => getSeriesFromData(intl, timeSeries), [timeSeries]);
  const yearsOptions = useMemo(() => getActiveYearsOptions(host), [host]);
  const chartOptions = useMemo(() => getChartOptions(intl, host?.currency), [host?.currency]);
  return (
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
          isLoading={loading}
          disabled={loading}
        />
      </Flex>
      {loading ? (
        <LoadingPlaceholder height={250} />
      ) : (
        <ChartWrapper>
          <Chart type="bar" width="100%" height="250px" options={chartOptions} series={series} />
        </ChartWrapper>
      )}
    </Box>
  );
};

HostFeesSectionHistorical.propTypes = {
  collectives: PropTypes.arrayOf(PropTypes.object),
  hostSlug: PropTypes.string.isRequired,
};
