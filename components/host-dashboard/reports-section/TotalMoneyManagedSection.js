import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dollar } from '@styled-icons/boxicons-regular/Dollar';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { ChevronDown } from '@styled-icons/fa-solid/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/fa-solid/ChevronUp/ChevronUp';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import dynamic from 'next/dynamic';

import { formatCurrency } from '../../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import ContainerOverlay from '../../ContainerOverlay';
import { Box, Flex } from '../../Grid';
import StyledCard from '../../StyledCard';
import StyledLinkButton from '../../StyledLinkButton';
import { StyledSelectFilter } from '../../StyledSelectFilter';
import StyledSpinner from '../../StyledSpinner';
import StyledTooltip from '../../StyledTooltip';
import { P, Span } from '../../Text';

import { getActiveYearsOptions } from './HostFeesSection';

const FundAmounts = styled.div`
  height: 48px;
  border-radius: 10px;
  padding-top: 10px;
  padding-left: 5px;
  background: linear-gradient(to right, #9a7bf1 50%, #46347f 50%);

  @media (max-width: 832px) {
    height: 130px;
    border-right: 0px;
    background: linear-gradient(to bottom, #9a7bf1 50%, #46347f 50%);
  }
`;

const TotalFundsLabel = styled(Container)`
  font-size: 12px;
  display: table-cell;
  padding-left: 10px;
  height: 26px;
  border-radius: 5px;
  background-color: white;
  opacity: 80%;
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
        totalMoneyManagedProgress {
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

  const totalMoneyManagedProgressNodes = get(timeSeries, 'totalMoneyManagedProgress.nodes', []);
  return [
    {
      name: intl.formatMessage({ defaultMessage: 'Total Managed Amount' }),
      data: dataToSeries(totalMoneyManagedProgressNodes),
    },
  ];
};

const TotalMoneyManagedSection = ({ currency, hostMetrics, hostSlug }) => {
  const intl = useIntl();
  const [showMoneyManagedChart, setShowMoneyManagedChart] = useState(false);
  const yearsOptions = useMemo(() => getActiveYearsOptions(null), [null]);
  const chartOptions = useMemo(() => getChartOptions(intl, currency), [currency]);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const variables = getQueryVariables(hostSlug, selectedYear);
  const { loading, data, previousData } = useQuery(totalMoneyManagedQuery, {
    variables,
    context: API_V2_CONTEXT,
    skip: !showMoneyManagedChart,
  });
  const host = loading && !data ? previousData?.host : data?.host;
  const timeSeries = host?.hostMetricsTimeSeries;
  const series = React.useMemo(() => getSeriesFromData(intl, timeSeries), [timeSeries]);

  const {
    totalMoneyManaged,
    pendingPlatformFees,
    pendingPlatformTips,
    pendingHostFeeShare,
    platformTips,
    hostFees,
    platformFees,
  } = hostMetrics;
  const currentAmount = totalMoneyManaged.valueInCents;
  const projectedAmount =
    totalMoneyManaged.valueInCents +
    pendingPlatformFees.valueInCents +
    pendingPlatformTips.valueInCents +
    pendingHostFeeShare.valueInCents;
  const totalCollectiveFunds =
    totalMoneyManaged.valueInCents - platformTips.valueInCents - platformFees.valueInCents - hostFees.valueInCents;
  const totalHostFunds = hostFees.valueInCents;
  return (
    <StyledCard borderColor="#46347F">
      <Container pl={27} pr={24} pt={16} pb={16} backgroundColor="#F6F5FF">
        <P minHeight="16px" fontSize="12px" fontWeight="500" lineHeight="16px" textTransform="uppercase">
          <Dollar size={14} color="#1300AB" />
          <FormattedMessage id="Host.Metrics.TotalMoneyManages" defaultMessage="Total Money Managed" />
        </P>
        <Flex flexWrap="wrap" mt={12} mb={14}>
          <Span fontSize={18} fontWeight="500">
            {formatCurrency(currentAmount, currency)}
          </Span>
          <Span fontSize={17} fontWeight="500" lineHeight="20px" ml="8px" mr="8px">
            /
          </Span>
          <Span fontSize={15} fontWeight="500" lineHeight="25px">
            {formatCurrency(projectedAmount, currency)}
          </Span>
          <Span fontSize={12} fontWeight="500" lineHeight="27px" ml="8px">
            <FormattedMessage id="TotalMoneyManagedSection.projected" defaultMessage="Projected" />
          </Span>
        </Flex>
        <Container display="flex" fontSize="11px" fontWeight="700" lineHeight="12px" alignItems="center">
          <Span textTransform="uppercase">
            <FormattedMessage
              id="TotalMoneyManagedSection.subHeading"
              defaultMessage="My Organization and My Collectives"
            />
          </Span>
          <Box ml={1}>
            <StyledTooltip
              content={() => (
                <FormattedMessage
                  id="Host.Metrics.TotalMoneyManages.description"
                  defaultMessage="Total amount held in your bank account for the Host and its Collectives."
                />
              )}
            >
              <InfoCircle size={14} />
            </StyledTooltip>
          </Box>
        </Container>
        <Container mt={18} mb={12}>
          <FundAmounts>
            <Flex flexWrap="wrap">
              <Box width={[1, 1, 1 / 2]} pl="8px">
                <TotalFundsLabel minWidth="210px" style={{ verticalAlign: 'middle' }}>
                  <Span fontWeight="700">{formatCurrency(totalCollectiveFunds, currency)}</Span> |{' '}
                  <FormattedMessage id="Collectives" defaultMessage="Collectives" />
                </TotalFundsLabel>
              </Box>
              <Box width={[1, 1, 1 / 2]} pt={['35px', '35px', 0]} pl="8px">
                <TotalFundsLabel minWidth="230px" style={{ verticalAlign: 'middle' }}>
                  <Span fontWeight="700">{formatCurrency(totalHostFunds, currency)}</Span> |{' '}
                  <FormattedMessage id="TotalMoneyManagedSection.hostOrganization" defaultMessage="Host Organization" />
                </TotalFundsLabel>
              </Box>
            </Flex>
          </FundAmounts>
        </Container>
        <Flex flexWrap="wrap">
          <Container width={[1, 1, 3 / 4]} px={2}>
            <P fontSize="12px" fontWeight="400" mt="16px">
              <FormattedMessage defaultMessage="Total amount held in your bank account for the Host and its Collectives." />
            </P>
          </Container>
          <Container width={[1, 1, 1 / 4]} px={2} textAlign="right">
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
      </Container>
    </StyledCard>
  );
};

TotalMoneyManagedSection.propTypes = {
  hostSlug: PropTypes.string,
  currency: PropTypes.string,
  hostMetrics: PropTypes.object,
};

export default TotalMoneyManagedSection;
