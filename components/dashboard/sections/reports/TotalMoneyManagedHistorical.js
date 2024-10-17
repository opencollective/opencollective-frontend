import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';

import { ChartWrapper } from '../../../ChartWrapper';
import ContainerOverlay from '../../../ContainerOverlay';
import { Box, Flex } from '../../../Grid';
import { StyledSelectFilter } from '../../../StyledSelectFilter';
import StyledSpinner from '../../../StyledSpinner';
import { P } from '../../../Text';

import { formatAmountForLegend, getActiveYearsOptions, getMinMaxDifference } from './helpers';

// Dynamic imports
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const totalMoneyManagedQuery = gql`
  query TotalMoneyManaged(
    $hostSlug: String!
    $dateFrom: DateTime!
    $account: [AccountReferenceInput!]
    $dateTo: DateTime!
  ) {
    host(slug: $hostSlug) {
      id
      hostMetricsTimeSeries(dateFrom: $dateFrom, dateTo: $dateTo, account: $account, timeUnit: MONTH) {
        totalMoneyManaged {
          nodes {
            date
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

const getQueryVariables = (hostSlug, year, collectives) => {
  return {
    hostSlug,
    account: collectives?.map(collective => ({ legacyId: collective.legacyId })),
    dateFrom: `${year}-01-01T00:00:00Z`,
    dateTo: `${year}-12-31T23:59:59Z`,
  };
};

const getSeriesFromData = (intl, timeSeries, year) => {
  const currentYear = new Date().getUTCFullYear();
  const currentMonth = new Date().getUTCMonth();
  const dataToSeries = data => {
    let series;
    // For previous years we show all the months in the chart
    if (year < currentYear) {
      series = new Array(12).fill(0); // = 12 months
      // For current year we only show upto the current month (as no data is available for future)
    } else {
      series = new Array(currentMonth + 1).fill(0); // = upto current month
    }
    data?.forEach(({ date, amount }) => (series[new Date(date).getUTCMonth()] = amount.value));
    return series;
  };

  const totalMoneyManagedProgressNodes = get(timeSeries, 'totalMoneyManaged.nodes', []);
  return [
    {
      name: intl.formatMessage({ defaultMessage: 'Total Managed Amount', id: 'MzXqKG' }),
      data: dataToSeries(totalMoneyManagedProgressNodes),
    },
  ];
};

const getChartOptions = (intl, hostCurrency, isCompactNotation) => ({
  chart: {
    id: 'chart-host-report-money-managed',
  },
  stroke: {
    curve: 'straight',
    width: 2,
  },
  markers: {
    size: 4,
  },
  colors: ['#46347F'],
  xaxis: {
    categories: [...new Array(12)].map(
      (_, idx) => `${intl.formatDate(new Date(0, idx), { month: 'short' }).toUpperCase()}`,
    ),
  },
  yaxis: {
    labels: {
      minWidth: 38,
      formatter: value => formatAmountForLegend(value, hostCurrency, intl.locale, isCompactNotation),
    },
  },
  tooltip: {
    y: {
      formatter: value => formatAmountForLegend(value, hostCurrency, intl.locale, false), // Never use compact notation in tooltip
    },
  },
});

const TotalMoneyManagedHistorical = ({ host, collectives }) => {
  const intl = useIntl();
  const yearsOptions = useMemo(() => getActiveYearsOptions(host), [null]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const variables = getQueryVariables(host.slug, selectedYear, collectives);
  const { loading, data, previousData } = useQuery(totalMoneyManagedQuery, {
    variables,
    context: API_V2_CONTEXT,
  });
  const hostTimeSeriesData = loading && !data ? previousData?.host : data?.host;
  const timeSeries = hostTimeSeriesData?.hostMetricsTimeSeries;
  const series = React.useMemo(() => getSeriesFromData(intl, timeSeries, selectedYear), [timeSeries]);
  const isCompactNotation = getMinMaxDifference(series[0].data) >= 10000;
  const chartOptions = useMemo(
    () => getChartOptions(intl, host.currency, isCompactNotation),
    [host.currency, isCompactNotation],
  );
  return (
    <Box py={3}>
      <Flex alignItems="center" px={2} mb={2}>
        <P fontSize="11px" fontWeight="700" mr={3} textTransform="uppercase">
          <FormattedMessage defaultMessage="Total money managed per year" id="hx2hjA" />
        </P>
        <StyledSelectFilter
          inputId="host-report-money-managed-year-select"
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
        <Chart type="line" width="100%" height="250px" options={chartOptions} series={series} />
      </ChartWrapper>
    </Box>
  );
};

TotalMoneyManagedHistorical.propTypes = {
  host: PropTypes.shape({
    slug: PropTypes.string,
    stats: PropTypes.shape({ balance: PropTypes.shape({ valueInCents: PropTypes.number }) }).isRequired,
    hostMetrics: PropTypes.object.isRequired,
    currency: PropTypes.string,
  }).isRequired,
  collectives: PropTypes.arrayOf(PropTypes.object),
};

export default TotalMoneyManagedHistorical;
