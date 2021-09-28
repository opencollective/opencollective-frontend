import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../../lib/constants/collectives';
import { formatCurrency } from '../../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { days } from '../../../lib/utils';

import PeriodFilter, { encodePeriod, getDateRangeFromPeriod } from '../../budget/filters/PeriodFilter';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import Container from '../../Container';
import { Flex } from '../../Grid';
import Loading from '../../Loading';
import { P, Span } from '../../Text';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const FilterLabel = styled.label`
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #4e5052;
`;

const FundAmounts = styled.div`
  width: 100%;
  height: 48px;
  border-radius: 10px;
  background-color: #29cc75;
  border-right: 360px solid #e03f6a;
  padding-top: 10px;
  padding-left: 5px;
  @media (max-width: 1025px) {
    height: 130px;
    background-color: #29cc75;
    border-right: 0px;
    border-bottom: 40px solid #e03f6a;
  }
`;

const TotalFundsLabel = styled(Container)`
  display: table-cell;
  padding-left: 10px;
  height: 26px;
  border-radius: 5px;
  background-color: white;
  opacity: 80%;
  vertical-align: middle;
`;

const Square = styled(Container)`
  width: 8px;
  height: 8px;
  display: inline-block;
  background-color: ${props => props.color};
`;

const transactionsOverviewQuery = gqlV2/* GraphQL */ `
  query TransactionsOverviewQuery(
    $hostSlug: String!
    $account: [AccountReferenceInput!]
    $dateFrom: DateTime
    $dateTo: DateTime
    $timeUnit: TimeUnit
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
      currency
      contributionStats(account: $account, dateFrom: $dateFrom, dateTo: $dateTo, timeUnit: $timeUnit) {
        contributionsCount
        contributionAmountOverTime {
          nodes {
            date
            amount {
              value
              valueInCents
              currency
            }
          }
        }
        oneTimeContributionsCount
        recurringContributionsCount
        dailyAverageIncomeAmount {
          valueInCents
        }
      }
      expenseStats(account: $account, dateFrom: $dateFrom, dateTo: $dateTo, timeUnit: $timeUnit) {
        expensesCount
        expenseAmountOverTime {
          nodes {
            date
            amount {
              value
              valueInCents
              currency
            }
          }
        }
        dailyAverageAmount {
          valueInCents
        }
        invoicesCount
        reimbursementsCount
        grantsCount
      }
    }
  }
`;

const getChartOptions = (intl, startDate, endDate) => {
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
      categories: getCategories(intl, startDate, endDate),
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

const getNumberOfDays = (startDate, endDate) => {
  const startTimeOfStatistics = new Date(2015, 0, 1);
  let numberOfDays;
  if (startDate && endDate) {
    numberOfDays = days(new Date(startDate), new Date(endDate));
  } else if (startDate) {
    numberOfDays = days(new Date(startDate));
  } else if (endDate) {
    numberOfDays = days(startTimeOfStatistics, new Date(endDate));
  } else {
    numberOfDays = days(startTimeOfStatistics);
  }
  return numberOfDays;
};

const getCategories = (intl, startDate, endDate) => {
  const numberOfDays = getNumberOfDays(startDate, endDate);
  if (numberOfDays <= 7) {
    const currentDay = new Date().getDay();
    return [...new Array(7)].map(
      (_, idx) => `${intl.formatDate(new Date(0, 0, idx + currentDay), { weekday: 'long' }).toUpperCase()}`,
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

const getCategoryType = (startDate, endDate) => {
  const numberOfDays = getNumberOfDays(startDate, endDate);
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
  if (category === 'YEAR') {
    dataPointObject = new Array(6).fill(0);
    const currentYear = new Date().getFullYear();
    dataPoints.forEach(dataPoint => {
      const year = new Date(dataPoint.date).getFullYear();
      if (year > currentYear - 6) {
        dataPointObject[5 - (currentYear - year)] = dataPoint.amount.value;
      }
    });
  } else if (category === 'MONTH') {
    dataPointObject = new Array(12).fill(0);
    dataPoints.forEach(dataPoint => {
      const date = new Date(dataPoint.date);
      const today = new Date();
      if (today.getFullYear() - date.getFullYear() === 0) {
        dataPointObject[date.getMonth() + (12 - today.getMonth())] = dataPoint.amount.value;
      }
      // } else if (today.getFullYear() - date.getFullYear() === 1) {
      //
      // }
    });
  } else if (category === 'WEEK') {
    dataPointObject = new Array(7).fill(0);
  }

  return dataPointObject;
};

const TransactionsOverviewSection = ({ hostSlug }) => {
  const intl = useIntl();
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [collectives, setCollectives] = useState(null);

  const categoryType = getCategoryType(dateFrom, dateTo);

  const { data, loading } = useQuery(transactionsOverviewQuery, {
    variables: { hostSlug, dateFrom, dateTo, account: collectives, timeUnit: categoryType },
    context: API_V2_CONTEXT,
  });
  const host = data?.host;
  const currency = host?.currency;
  const contributionStats = host?.contributionStats;
  const expenseStats = host?.expenseStats;

  const {
    contributionsCount,
    recurringContributionsCount,
    oneTimeContributionsCount,
    dailyAverageIncomeAmount,
    contributionAmountOverTime,
  } = contributionStats || 0;
  const { expensesCount, invoicesCount, reimbursementsCount, grantsCount, dailyAverageAmount, expenseAmountOverTime } =
    expenseStats || 0;

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

  const setDate = period => {
    const [dateFrom, dateTo] = getDateRangeFromPeriod(period);
    setDateFrom(dateFrom || null);
    setDateTo(dateTo || null);
  };

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
      <Flex flexWrap="wrap">
        <Container width={[1, 1, 1 / 2]} pr={2} mb={[3, 3, 0, 0]}>
          <FilterLabel htmlFor="transactions-period-filter">
            <FormattedMessage id="TransactionsOverviewSection.PeriodFilter" defaultMessage="Filter by Date" />
          </FilterLabel>
          <PeriodFilter
            onChange={value => setDate(value)}
            value={encodePeriod({ dateInterval: { from: dateFrom, to: dateTo } })}
          />
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
      {loading ? (
        <Loading />
      ) : (
        <Flex flexWrap="wrap" mt={18} mb={12}>
          <FundAmounts>
            <TotalFundsLabel minWidth="280px">
              <P>
                <Span fontWeight="500">
                  {contributionsCount} <FormattedMessage id="Contributions" defaultMessage="Contributions" />
                </Span>{' '}
                | <FormattedMessage id="DailyAverage" defaultMessage="Daily avg" />
                {': '}
                <Span fontWeight="700">{formatCurrency(dailyAverageIncomeAmount.valueInCents, currency)}</Span>
              </P>
            </TotalFundsLabel>
            <TotalFundsLabel
              minWidth="250px"
              position="relative"
              left={['-280px', '-280px', '-280px', '100px']}
              top={['85px', '85px', '85px', '0px']}
            >
              <P>
                <Span fontWeight="500">
                  {expensesCount} <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
                </Span>{' '}
                | <FormattedMessage id="DailyAverage" defaultMessage="Daily avg" />
                {': '}
                <Span fontWeight="700">{formatCurrency(dailyAverageAmount.valueInCents, currency)}</Span>
              </P>
            </TotalFundsLabel>
          </FundAmounts>
          <Container mt={2}>
            <Span mr={3}>
              <Square color="#51E094" />
              {` ${oneTimeContributionsCount} `}
              <FormattedMessage id="Frequency.OneTime" defaultMessage="One time" />
            </Span>
            <Span mr={['10px', '10px', '10px', '200px']}>
              <Square color="#BEFADA" />
              {` ${recurringContributionsCount} `}
              <FormattedMessage id="TransactionsOverviewSection.Recurring" defaultMessage="Recurring" />
            </Span>
            <Span mr={3}>
              <Square color="#CC2955" />
              {` ${invoicesCount} `}
              <FormattedMessage id="TransactionsOverviewSection.Invoices" defaultMessage="Invoices" />
            </Span>
            <Span mr={3}>
              <Square color="#F55882" />
              {` ${reimbursementsCount} `}
              <FormattedMessage id="TransactionsOverviewSection.Reimbursements" defaultMessage="Reimbursements" />
            </Span>
            <Span mr={3}>
              <Square color="#FFC2D2" />
              {` ${grantsCount} `}
              <FormattedMessage id="TransactionsOverviewSection.Grants" defaultMessage="Grants" />
            </Span>
          </Container>
          <Container mt={2}>
            <Chart
              type="area"
              width="100%"
              height="250px"
              options={getChartOptions(intl, dateFrom, dateTo)}
              series={series}
            />
          </Container>
        </Flex>
      )}
    </React.Fragment>
  );
};

TransactionsOverviewSection.propTypes = {
  hostSlug: PropTypes.string,
  onChange: PropTypes.func,
  filters: PropTypes.object,
  currency: PropTypes.string,
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
};

export default TransactionsOverviewSection;
