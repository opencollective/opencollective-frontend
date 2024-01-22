import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { alignSeries } from '../../../../lib/charts';
import { formatCurrency } from '../../../../lib/currency-utils';
import { i18nTransactionKind } from '../../../../lib/i18n/transaction';

import { Box } from '../../../Grid';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import ProportionalAreaChart from '../../../ProportionalAreaChart';
import { P, Span } from '../../../Text';

import { formatAmountForLegend } from './helpers';

// Dynamic imports
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const StyledBox = styled(Box)`
  .apexcharts-toolbar {
    z-index: 0;
  }
`;
const getChartOptions = (intl, timeUnit, hostCurrency, series) => {
  return {
    chart: {
      id: 'chart-transactions-overview',
    },
    legend: {
      show: true,
      horizontalAlign: 'left',
    },
    colors: ['#29CC75', '#F55882'],
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    stroke: {
      curve: 'straight',
      width: 1.5,
    },
    dataLabels: {
      enabled: false,
    },

    xaxis: {
      labels: {
        formatter: function (value) {
          // Show data aggregated yearly
          if (timeUnit === 'YEAR') {
            return dayjs(value).utc().year();
            // Show data aggregated monthly
          } else if (timeUnit === 'MONTH') {
            return dayjs(value).utc().format('MMM-YYYY');
            // Show data aggregated by week or day
          } else if (timeUnit === 'WEEK' || timeUnit === 'DAY') {
            return dayjs(value).utc().format('DD-MMM-YYYY');
          }
        },
      },
    },

    yaxis: {
      labels: {
        formatter: value => formatAmountForLegend(value, hostCurrency, intl.locale),
      },
    },
    tooltip: {
      y: {
        formatter: (value, { seriesIndex, dataPointIndex }) => {
          const formatAmount = amount => formatAmountForLegend(amount, hostCurrency, intl.locale, false); // Never use compact notation in tooltip
          const dataPoint = series[seriesIndex].data[dataPointIndex];
          if (dataPoint.kinds && Object.keys(dataPoint.kinds).length > 1) {
            const formatKindAmount = ([kind, amount]) => `${formatAmount(amount)} ${i18nTransactionKind(intl, kind)}`;
            const amountsByKind = Object.entries(dataPoint.kinds).map(formatKindAmount).join(', ');
            const prettyKindAmounts = `<small style="font-weight: normal; text-transform: lowercase;">(${amountsByKind})</small>`;
            return `${formatAmount(value)} ${prettyKindAmounts}`;
          } else {
            return formatAmount(value);
          }
        },
      },
    },
  };
};

const getTransactionsAreaChartData = (host, locale) => {
  if (!host) {
    return [];
  }

  const currency = host.currency;
  const { contributionsCount, dailyAverageIncomeAmount } = host.contributionStats;
  const { expensesCount, dailyAverageAmount } = host.expenseStats;
  return [
    {
      key: 'contributions',
      percentage: 0.5,
      color: 'green.500',
      label: (
        <P fontSize="12px" lineHeight="18px">
          <FormattedMessage
            defaultMessage="{count, plural, one {# contribution} other {# contributions}}"
            values={{ count: contributionsCount }}
          />
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage
            defaultMessage="Daily average: {amount}"
            values={{
              amount: <strong>{formatCurrency(dailyAverageIncomeAmount.valueInCents, currency, { locale })}</strong>,
            }}
          />
        </P>
      ),
    },
    {
      key: 'expenses',
      percentage: 0.5,
      color: 'red.500',
      label: (
        <P fontSize="12px" lineHeight="18px">
          <FormattedMessage
            defaultMessage="{count, plural, one {# expense} other {# expenses}}"
            values={{ count: expensesCount }}
          />
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage
            defaultMessage="Daily average: {amount}"
            values={{
              amount: <strong>{formatCurrency(dailyAverageAmount.valueInCents, currency, { locale })}</strong>,
            }}
          />
        </P>
      ),
    },
  ];
};

const getTransactionsBreakdownChartData = host => {
  if (!host) {
    return [];
  }

  const contributionStats = host?.contributionStats;
  const expenseStats = host?.expenseStats;
  const { recurringContributionsCount, oneTimeContributionsCount } = contributionStats;
  const { invoicesCount, reimbursementsCount, grantsCount } = expenseStats;
  const hasGrants = grantsCount > 0;
  const areas = [
    {
      key: 'one-time',
      percentage: 0.25,
      color: 'green.400',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# One-time} other {# One-time}}"
          values={{ count: oneTimeContributionsCount }}
        />
      ),
    },
    {
      key: 'recurring',
      percentage: 0.25,
      color: 'green.300',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# Recurring} other {# Recurring}}"
          values={{ count: recurringContributionsCount }}
        />
      ),
    },
    {
      key: 'invoices',
      percentage: hasGrants ? 0.166 : 0.25,
      color: 'red.600',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# Invoice} other {# Invoices}}"
          values={{ count: invoicesCount }}
        />
      ),
    },
    {
      key: 'receipts',
      percentage: hasGrants ? 0.166 : 0.25,
      color: 'red.400',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# Reimbursement} other {# Reimbursements}}"
          values={{ count: reimbursementsCount }}
        />
      ),
    },
  ];

  // Grants are only enabled for a few hosts/collectives, we only display the metric if active
  if (hasGrants) {
    areas.push({
      key: 'grants',
      percentage: 0.166,
      color: 'red.300',
      legend: (
        <FormattedMessage
          defaultMessage="{count, plural, one {# Grant} other {# Grants}}"
          values={{ count: grantsCount }}
        />
      ),
    });
  }

  return areas;
};

/**
 * Transforms a list of datapoints like [{ date, kind, amount }] into a series like:
 * `[{ x: date, y: 3000, kinds: { ADDED_FUNDS: 2000, CONTRIBUTION: 1000 } }]`
 */
const getSeriesDataFromTotalReceivedNodes = nodes => {
  const keyedData = {};
  nodes.forEach(({ date, amount, kind }) => {
    if (!keyedData[date]) {
      keyedData[date] = { x: date, y: 0, kinds: {} };
    }

    keyedData[date].y += amount.value;
    keyedData[date]['kinds'][kind] = amount.value;
  });

  return Object.values(keyedData);
};

const getSeries = (host, intl) => {
  const getNodes = timeSeries => host?.hostMetricsTimeSeries?.[timeSeries]?.nodes || [];
  const series = [
    {
      name: intl.formatMessage({ id: 'Contributions', defaultMessage: 'Contributions' }),
      data: getSeriesDataFromTotalReceivedNodes(getNodes('totalReceived')),
    },
    {
      name: intl.formatMessage({ id: 'Expenses', defaultMessage: 'Expenses' }),
      data: getNodes('totalSpent').map(({ date, amount }) => ({ x: date, y: Math.abs(amount.value) })),
    },
  ];

  alignSeries(series);

  return series;
};

const TransactionsOverviewSection = ({ host, isLoading }) => {
  const intl = useIntl();
  const { locale } = intl;
  const timeUnit = host?.hostMetricsTimeSeries?.timeUnit;
  const series = React.useMemo(() => getSeries(host, intl), [host]);
  const areaChartData = React.useMemo(() => getTransactionsAreaChartData(host, locale), [host, locale]);
  const transactionBreakdownChart = React.useMemo(() => getTransactionsBreakdownChartData(host), [host]);
  return (
    <React.Fragment>
      <Box mt={18} mb={12}>
        {isLoading ? (
          <LoadingPlaceholder height="98px" borderRadius="8px" />
        ) : (
          <div>
            <ProportionalAreaChart areas={areaChartData} borderRadius="6px 6px 0 0" />
            <ProportionalAreaChart areas={transactionBreakdownChart} borderRadius="0 0 6px 6px" />
          </div>
        )}
      </Box>
      <StyledBox mt="24px" mb="12px">
        {isLoading ? (
          <LoadingPlaceholder height={21} width="100%" borderRadius="8px" />
        ) : (
          <Chart
            type="area"
            width="100%"
            height="250px"
            options={getChartOptions(intl, timeUnit, host.currency, series)}
            series={series}
          />
        )}
      </StyledBox>
    </React.Fragment>
  );
};

TransactionsOverviewSection.propTypes = {
  isLoading: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string,
    createdAt: PropTypes.string,
    hostMetricsTimeSeries: PropTypes.shape({
      timeUnit: PropTypes.string,
      totalReceived: PropTypes.shape({
        nodes: PropTypes.shape({
          date: PropTypes.string,
          kind: PropTypes.string,
          amount: PropTypes.shape({
            valueInCents: PropTypes.number,
          }),
        }),
      }),
      totalSpent: PropTypes.shape({
        nodes: PropTypes.shape({
          date: PropTypes.string,
          kind: PropTypes.string,
          amount: PropTypes.shape({
            valueInCents: PropTypes.number,
          }),
        }),
      }),
    }),
  }),
};

export default TransactionsOverviewSection;
