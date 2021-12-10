import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { differenceBy } from 'lodash';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';

import { Box } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import ProportionalAreaChart from '../../ProportionalAreaChart';
import { P, Span } from '../../Text';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const getChartOptions = timeUnit => {
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
        formatter: function (value) {
          return value < 1000 ? value : `${Math.round(value / 1000)}k`;
        },
      },
    },
  };
};

const constructChartDataPoints = dataPoints => {
  return dataPoints.map(({ date, amount }) => ({ x: date, y: Math.abs(amount.value) }));
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

const TransactionsOverviewSection = ({ host, isLoading }) => {
  const intl = useIntl();
  const { locale } = intl;

  const contributionStats = host?.contributionStats;
  const expenseStats = host?.expenseStats;

  const { contributionAmountOverTime } = contributionStats || 0;
  const { expenseAmountOverTime } = expenseStats || 0;
  const timeUnit = contributionAmountOverTime?.timeUnit;

  const series = [
    {
      name: 'Contributions',
      data: contributionAmountOverTime ? constructChartDataPoints(contributionAmountOverTime.nodes) : null,
    },
    {
      name: 'Expenses',
      data: expenseAmountOverTime ? constructChartDataPoints(expenseAmountOverTime.nodes) : null,
    },
  ];

  /*
   * If a date doesn't have any contributions or expenses API returns nothing.
   * But we need to make sure the two series (expenses and contributions) show 0 in these cases rather than NaN which
   * is shown by default by Appex charts.
   */
  if (series[0]?.data && series[1]?.data) {
    const dataMissingFromSeries0 = differenceBy(series[1].data, series[0].data, 'x');
    const dataMissingFromSeries1 = differenceBy(series[0].data, series[1].data, 'x');
    series[0].data.push(...dataMissingFromSeries0.map(({ x }) => ({ x, y: 0 })));
    series[1].data.push(...dataMissingFromSeries1.map(({ x }) => ({ x, y: 0 })));
    series[0].data.sort((a, b) => new Date(a.x) - new Date(b.x));
    series[1].data.sort((a, b) => new Date(a.x) - new Date(b.x));
  }

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
      <Box mt="24px" mb="12px">
        {isLoading ? (
          <LoadingPlaceholder height={21} width="100%" borderRadius="8px" />
        ) : (
          <Chart type="area" width="100%" height="250px" options={getChartOptions(timeUnit)} series={series} />
        )}
      </Box>
    </React.Fragment>
  );
};

TransactionsOverviewSection.propTypes = {
  isLoading: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string,
    createdAt: PropTypes.string,
    contributionStats: PropTypes.shape({
      contributionsCount: PropTypes.number,
      oneTimeContributionsCount: PropTypes.number,
      recurringContributionsCount: PropTypes.number,
      dailyAverageIncomeAmount: PropTypes.shape({
        value: PropTypes.number,
      }),
    }),
    expenseStats: PropTypes.shape({
      expensesCount: PropTypes.number,
      invoicesCount: PropTypes.number,
      reimbursementsCount: PropTypes.number,
      grantsCount: PropTypes.number,
      dailyAverageAmount: PropTypes.shape({
        value: PropTypes.number,
      }),
    }),
  }),
};

export default TransactionsOverviewSection;
