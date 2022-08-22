import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { BarChart, FormatListBulleted, Timeline } from '@styled-icons/material';
import dayjs from 'dayjs';
import { capitalize, sumBy } from 'lodash';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { alignSeries, extractSeriesFromTimeSeries, formatAmountForLegend } from '../../../../lib/charts';
import { formatCurrency } from '../../../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../../lib/graphql/helpers';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import { Box, Flex } from '../../../Grid';
import Link from '../../../Link';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import PeriodFilterPresetsSelect from '../../../PeriodFilterPresetsSelect';
import StyledCard from '../../../StyledCard';
import { P } from '../../../Text';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

import {
  BudgetTable,
  COLORS,
  GRAPH_TYPES,
  GraphTypeButton,
  makeBudgetTableRow,
  StatsCardContent,
  TagMarker,
} from './common';

const budgetSectionExpenseQuery = gqlV2/* GraphQL */ `
  query BudgetSectionExpenseQuery($slug: String!, $from: DateTime, $to: DateTime) {
    account(slug: $slug) {
      id
      currency
      stats {
        id
        expensesTags(dateFrom: $from, dateTo: $to) {
          label
          count
          amount {
            valueInCents
            currency
          }
        }
        expensesTagsTimeSeries(dateFrom: $from, dateTo: $to) {
          timeUnit
          nodes {
            date
            amount {
              value
              currency
            }
            label
          }
        }
      }
    }
  }
`;
const ExpenseBudget = ({ collective, defaultTimeInterval, ...props }) => {
  const [tmpDateInterval, setTmpDateInterval] = React.useState(defaultTimeInterval);
  const [graphType, setGraphType] = React.useState(GRAPH_TYPES.LIST);
  const { data, loading } = useQuery(budgetSectionExpenseQuery, {
    variables: { slug: collective.slug, ...tmpDateInterval },
    context: API_V2_CONTEXT,
  });
  const intl = useIntl();

  const timeUnit = data?.account?.stats.expensesTagsTimeSeries.timeUnit;
  const { series } = extractSeriesFromTimeSeries(data?.account?.stats.expensesTagsTimeSeries.nodes, {
    x: 'date',
    y: 'amount.value',
    group: 'label',
    groupNameTransformer: capitalize,
  });

  const defaultApexOptions = {
    legend: {
      show: true,
      horizontalAlign: 'left',
    },
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
        formatter: value => formatAmountForLegend(value, collective.currency, intl.locale),
      },
    },
  };

  return (
    <Flex {...props}>
      <Flex justifyContent="space-between" alignItems="center" flexGrow={1}>
        <P fontSize="20px" lineHeight="20px" fontWeight="500">
          <FormattedMessage id="Expenses" defaultMessage="Expenses" />
        </P>
        <Flex gap="8px" alignItems="center">
          <PeriodFilterPresetsSelect
            onChange={setTmpDateInterval}
            interval={tmpDateInterval}
            formatDateFn={v => v?.toISOString()}
            disabled={loading}
          />
          <GraphTypeButton active={graphType === GRAPH_TYPES.LIST} onClick={() => setGraphType(GRAPH_TYPES.LIST)}>
            <FormatListBulleted />
          </GraphTypeButton>
          <GraphTypeButton active={graphType === GRAPH_TYPES.TIME} onClick={() => setGraphType(GRAPH_TYPES.TIME)}>
            <Timeline />
          </GraphTypeButton>
          <GraphTypeButton active={graphType === GRAPH_TYPES.BAR} onClick={() => setGraphType(GRAPH_TYPES.BAR)}>
            <BarChart />
          </GraphTypeButton>
        </Flex>
      </Flex>
      {loading ? (
        <LoadingPlaceholder mt="30px" height={100} />
      ) : (
        <StyledCard mt="30px">
          <StatsCardContent>
            <Box width="50%">
              <P fontSize="12px" lineHeight="16px" fontWeight="500" textTransform="uppercase" color="black.700">
                <FormattedMessage id="ExpensesPaid" defaultMessage="Expenses paid" />
              </P>
              <P fontSize="16px" lineHeight="24px" fontWeight="500" mt="4px">
                {sumBy(data?.account?.stats.expensesTags, 'count')}
              </P>
            </Box>
            <Box width="50%">
              <P fontSize="12px" lineHeight="16px" fontWeight="500" textTransform="uppercase" color="black.700">
                <FormattedMessage id="AmountDisbursed" defaultMessage="Amount disbursed" />
              </P>
              <P fontSize="16px" lineHeight="24px" fontWeight="500" mt="4px">
                {formatCurrency(sumBy(data?.account?.stats.expensesTags, 'amount.valueInCents'), collective.currency)}
              </P>
            </Box>
          </StatsCardContent>
        </StyledCard>
      )}

      {loading ? (
        <LoadingPlaceholder mt={4} height={300} />
      ) : (
        <React.Fragment>
          {graphType === GRAPH_TYPES.LIST && (
            <BudgetTable
              mt={4}
              cellPadding="10px"
              headers={[
                <FormattedMessage key={1} id="Tags" defaultMessage="Tags" />,
                <FormattedMessage key={2} id="Label.NumberOfExpenses" defaultMessage="# of Expenses" />,
                <FormattedMessage
                  key={3}
                  id="Label.AmountWithCurrency"
                  defaultMessage="Amount ({currency})"
                  values={{ currency: data?.account.currency }}
                />,
              ]}
              rows={data?.account?.stats.expensesTags.map((expenseTag, i) =>
                makeBudgetTableRow(expenseTag.id + expenseTag.count, [
                  <React.Fragment key={expenseTag.label}>
                    <TagMarker color={COLORS[i % COLORS.length]} />
                    {expenseTag.label}
                  </React.Fragment>,
                  expenseTag.count,
                  formatCurrency(expenseTag.amount.valueInCents, expenseTag.amount.currency),
                ]),
              )}
            />
          )}
          {graphType === GRAPH_TYPES.TIME && (
            <Box mt={4}>
              <Chart
                type="area"
                width="100%"
                height="250px"
                options={{
                  ...defaultApexOptions,
                  chart: {
                    id: 'chart-budget-expenses-time-series',
                  },
                }}
                series={alignSeries(series)}
              />
            </Box>
          )}
          {graphType === GRAPH_TYPES.BAR && (
            <Box mt={4}>
              <Chart
                type="bar"
                width="100%"
                height="250px"
                options={{
                  ...defaultApexOptions,
                  chart: {
                    id: 'chart-budget-expenses-stacked-bars',
                    stacked: true,
                  },
                }}
                series={series}
              />
            </Box>
          )}
        </React.Fragment>
      )}
      <P mt={3} textAlign="right">
        <Link href={`${getCollectivePageRoute(collective)}/expenses`} data-cy="view-all-expenses-link">
          <FormattedMessage id="CollectivePage.SectionBudget.ViewAllExpenses" defaultMessage="View all expenses" />{' '}
          &rarr;
        </Link>
      </P>
    </Flex>
  );
};

ExpenseBudget.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
  }),
  defaultTimeInterval: PropTypes.shape({
    from: PropTypes.object,
    to: PropTypes.object,
  }),
};

export default ExpenseBudget;
