import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import ProportionalAreaChart from '../../ProportionalAreaChart';
import { P, Span } from '../../Text';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const getChartOptions = (intl, startDate, endDate, hostCreatedAt) => {
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
      categories: getCategories(intl, startDate, endDate, hostCreatedAt),
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

const getCategories = (intl, startDate, endDate, hostCreatedAt) => {
  const numberOfDays = dayjs(startDate || hostCreatedAt).diff(dayjs(endDate), 'day');
  if (numberOfDays <= 7) {
    const startDay = startDate.getDay();
    return [...new Array(7)].map(
      (_, idx) => `${intl.formatDate(new Date(0, 0, idx + startDay), { weekday: 'long' }).toUpperCase()}`,
    );
  } else if (numberOfDays <= 365) {
    const currentMonth = new Date().getMonth();
    return [...new Array(12)].map(
      (_, idx) => `${intl.formatDate(new Date(0, idx + currentMonth + 1), { month: 'short' }).toUpperCase()}`,
    );
  } else {
    return [...new Array(6)].map(
      (_, idx) =>
        `${intl.formatDate(new Date(new Date().getFullYear() - 5 + idx, 0), { year: 'numeric' }).toUpperCase()}`,
    );
  }
};

const getCategoryType = (startDate, endDate, hostCreatedAt) => {
  const numberOfDays = dayjs(startDate || hostCreatedAt).diff(dayjs(endDate), 'day');
  if (numberOfDays <= 7) {
    return 'WEEK';
  } else if (numberOfDays <= 365) {
    return 'MONTH';
  } else {
    return 'YEAR';
  }
};

const constructDataPointObjects = (category, dataPoints) => {
  let dataPointObject;
  /*
   * Show data for the past 5 years form the current year.
   */
  if (category === 'YEAR') {
    dataPointObject = new Array(6).fill(0);
    const currentYear = new Date().getFullYear();
    dataPoints.forEach(dataPoint => {
      const year = new Date(dataPoint.date).getFullYear();
      if (year > currentYear - 6) {
        dataPointObject[5 - (currentYear - year)] = Math.abs(dataPoint.amount.value);
      }
    });
    /*
     * Show data for the past the past 12 months from the current month.
     */
  } else if (category === 'MONTH') {
    dataPointObject = new Array(12).fill(0);
    dataPoints.forEach(dataPoint => {
      const date = new Date(dataPoint.date);
      const today = new Date();
      if (today.getFullYear() - date.getFullYear() <= 1) {
        dataPointObject[(date.getMonth() + (12 - today.getMonth())) % 12] = Math.abs(dataPoint.amount.value);
      }
    });
    /*
     * Show data for past 7 days from the current day.
     */
  } else if (category === 'WEEK') {
    dataPointObject = new Array(7).fill(0);
    dataPoints.forEach(dataPoint => {
      const date = new Date(dataPoint.date);
      const today = new Date();
      if (today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth()) {
        dataPointObject[date.getDay() % 7] = Math.abs(dataPoint.amount.value);
      }
    });
  }

  return dataPointObject;
};

const getTransactionsAreaChartData = host => {
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
              amount: <strong>{formatCurrency(dailyAverageIncomeAmount.valueInCents, currency)}</strong>,
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
              amount: <strong>{formatCurrency(dailyAverageAmount.valueInCents, currency)}</strong>,
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

const TransactionsOverviewSection = ({ host, isLoading, dateInterval }) => {
  const intl = useIntl();
  const categoryType = getCategoryType(new Date(dateInterval?.from), new Date(dateInterval?.to), host?.createdAt);

  const contributionStats = host?.contributionStats;
  const expenseStats = host?.expenseStats;

  const { contributionAmountOverTime } = contributionStats || 0;
  const { expenseAmountOverTime } = expenseStats || 0;

  const series = [
    {
      name: 'Contributions',
      data: contributionAmountOverTime
        ? constructDataPointObjects(categoryType, contributionAmountOverTime.nodes)
        : null,
    },
    {
      name: 'Expenses',
      data: expenseAmountOverTime ? constructDataPointObjects(categoryType, expenseAmountOverTime.nodes) : null,
    },
  ];

  const areaChartData = React.useMemo(() => getTransactionsAreaChartData(host), [host]);
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
      <Box>
        {isLoading ? (
          <LoadingPlaceholder height={21} width={125} />
        ) : (
          <Flex flexWrap="wrap" mt={18} mb={12}>
            <Container mt={2}>
              <Chart
                type="area"
                width="100%"
                height="250px"
                options={getChartOptions(
                  intl,
                  new Date(dateInterval?.from),
                  new Date(dateInterval?.to),
                  host.createdAt,
                )}
                series={series}
              />
            </Container>
          </Flex>
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
  dateInterval: PropTypes.object,
};

export default TransactionsOverviewSection;
