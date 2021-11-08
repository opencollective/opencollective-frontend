import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { ChevronDown } from '@styled-icons/fa-solid/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/fa-solid/ChevronUp/ChevronUp';
import { get, pick, sumBy } from 'lodash';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { ChartWrapper } from '../../ChartWrapper';
import Container from '../../Container';
import ContainerOverlay from '../../ContainerOverlay';
import { Box, Flex } from '../../Grid';
import ProportionalAreaChart from '../../ProportionalAreaChart';
import StyledLinkButton from '../../StyledLinkButton';
import { StyledSelectFilter } from '../../StyledSelectFilter';
import StyledSpinner from '../../StyledSpinner';
import { P, Span } from '../../Text';

import { getActiveYearsOptions } from './helpers';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const getMoneyManagedChartAreas = (collectivesBalance, hostBalance, currency) => {
  return [
    {
      key: 'my-collectives',
      color: 'primary.500',
      label: (
        <P fontSize="12px" lineHeight="18px">
          <Span fontWeight="700">{formatCurrency(collectivesBalance, currency)}</Span>{' '}
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage id="Collectives" defaultMessage="Collectives" />
        </P>
      ),
    },
    {
      key: 'organization',
      color: 'primary.800',
      label: (
        <P fontSize="12px" lineHeight="18px" color="black.700">
          <Span fontWeight="bold">{formatCurrency(hostBalance, currency)}</Span>
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage id="TotalMoneyManagedSection.hostOrganization" defaultMessage="Host Organization" />
        </P>
      ),
    },
  ];
};

const getChartOptions = intl => ({
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
});

const totalMoneyManagedQuery = gqlV2/* GraphQL */ `
  query TotalMoneyManagedQuery($hostSlug: String!, $dateFrom: DateTime!, $dateTo: DateTime!) {
    host(slug: $hostSlug) {
      id
      hostMetricsTimeSeries(dateFrom: $dateFrom, dateTo: $dateTo, timeUnit: MONTH) {
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

const getQueryVariables = (hostSlug, year) => {
  return {
    hostSlug,
    dateFrom: `${year}-01-01T00:00:00Z`,
    dateTo: `${year}-12-31T23:59:59Z`,
  };
};

const getSeriesFromData = (intl, timeSeries) => {
  const dataToSeries = data => {
    const series = new Array(12).fill(0); // = 12 months
    data?.forEach(({ date, amount }) => (series[new Date(date).getMonth() + 1] = amount.value));
    return series;
  };

  const totalMoneyManagedProgressNodes = get(timeSeries, 'totalMoneyManaged.nodes', []);
  return [
    {
      name: intl.formatMessage({ defaultMessage: 'Total Managed Amount' }),
      data: dataToSeries(totalMoneyManagedProgressNodes),
    },
  ];
};

const TotalMoneyManagedSection = ({ host }) => {
  const intl = useIntl();
  const [showMoneyManagedChart, setShowMoneyManagedChart] = useState(false);
  const yearsOptions = useMemo(() => getActiveYearsOptions(null), [null]);
  const chartOptions = useMemo(() => getChartOptions(intl, host.currency), [host.currency]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const variables = getQueryVariables(host.slug, selectedYear);
  const { loading, data, previousData } = useQuery(totalMoneyManagedQuery, {
    variables,
    context: API_V2_CONTEXT,
    skip: !showMoneyManagedChart,
  });
  const hostTimeSeriesData = loading && !data ? previousData?.host : data?.host;
  const timeSeries = hostTimeSeriesData?.hostMetricsTimeSeries;
  const series = React.useMemo(() => getSeriesFromData(intl, timeSeries), [timeSeries]);

  // Compute some general stats
  const { totalMoneyManaged } = host.hostMetrics;
  const fees = pick(host.hostMetrics, ['platformTips', 'platformFees', 'hostFees']);
  const pendingFees = pick(host.hostMetrics, ['pendingPlatformTips', 'pendingPlatformFees', 'pendingHostFeeShare']);
  const totalFees = sumBy(Object.values(fees), 'valueInCents');
  const totalPendingFees = sumBy(Object.values(pendingFees), 'valueInCents');
  const collectivesBalance = totalMoneyManaged.valueInCents - totalFees;
  const hostBalance = host.stats.balance.valueInCents;

  // Generate graph data (memoized for performances)
  const chartArgs = [collectivesBalance, hostBalance, host.currency];
  const chartAreas = React.useMemo(() => getMoneyManagedChartAreas(...chartArgs), chartArgs);

  return (
    <div>
      <Flex flexWrap="wrap" my={14} alignItems="baseline">
        <Span fontSize={18} fontWeight="500">
          {formatCurrency(totalMoneyManaged.valueInCents, host.currency)}
        </Span>
        <Span fontSize={15} fontWeight="500" lineHeight="20px" ml="8px" mr="8px">
          /
        </Span>
        <Span fontSize={15} fontWeight="500" lineHeight="25px">
          {formatCurrency(totalMoneyManaged.valueInCents + totalPendingFees, host.currency)}
        </Span>
        <Span fontSize={12} fontWeight="500" lineHeight="27px" ml="8px">
          <FormattedMessage id="TotalMoneyManagedSection.projected" defaultMessage="Projected" />
        </Span>
      </Flex>
      <Container display="flex" fontSize="11px" fontWeight="700" lineHeight="12px" alignItems="center">
        <Span textTransform="uppercase">
          <FormattedMessage
            id="TotalMoneyManagedSection.subHeading"
            defaultMessage="My Organization and My initiatives"
          />
        </Span>
      </Container>
      <Container mt={18} mb={12}>
        <ProportionalAreaChart areas={chartAreas} />
      </Container>
      <Flex flexWrap="wrap" justifyContent="space-between">
        <Container px={2}>
          <P fontSize="12px" fontWeight="400" mt="16px">
            <FormattedMessage
              id="Host.Metrics.TotalMoneyManages.description"
              defaultMessage="Total amount held in your bank account for the Host and its Collectives."
            />
          </P>
        </Container>
        <Container px={2} textAlign="right">
          <StyledLinkButton color="#46347F" asLink onClick={() => setShowMoneyManagedChart(!showMoneyManagedChart)}>
            <P fontSize="12px" fontWeight="400" mt="16px">
              <FormattedMessage defaultMessage="See historical" />
              <Span pl="8px">
                {showMoneyManagedChart ? (
                  <ChevronUp size={12} color="#46347F" />
                ) : (
                  <ChevronDown fontVariant="solid" size={12} color="#46347F" />
                )}
              </Span>
            </P>
          </StyledLinkButton>
        </Container>
      </Flex>
      {showMoneyManagedChart && (
        <Box py={3}>
          <Flex alignItems="center" px={2} mb={2}>
            <P fontSize="11px" fontWeight="700" mr={3} textTransform="uppercase">
              <FormattedMessage defaultMessage="Total money managed per year" />
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
      )}
    </div>
  );
};

TotalMoneyManagedSection.propTypes = {
  host: PropTypes.shape({
    slug: PropTypes.string,
    stats: PropTypes.shape({ balance: PropTypes.shape({ valueInCents: PropTypes.number }) }).isRequired,
    hostMetrics: PropTypes.object.isRequired,
    currency: PropTypes.string,
  }).isRequired,
};

export default TotalMoneyManagedSection;
