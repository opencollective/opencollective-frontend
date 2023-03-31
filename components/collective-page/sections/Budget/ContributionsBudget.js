import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { BarChart } from '@styled-icons/material/BarChart';
import { FormatListBulleted } from '@styled-icons/material/FormatListBulleted';
import { PieChart } from '@styled-icons/material/PieChart';
import { Timeline } from '@styled-icons/material/Timeline';
import { capitalize, sumBy } from 'lodash';
import dynamic from 'next/dynamic';
import { FormattedMessage, useIntl } from 'react-intl';

import { alignSeries, extractSeriesFromTimeSeries } from '../../../../lib/charts';
import { formatCurrency } from '../../../../lib/currency-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
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
  makeApexOptions,
  makeBudgetTableRow,
  StatsCardContent,
  TagMarker,
} from './common';

export const budgetSectionContributionsQuery = gql`
  query BudgetSectionContributionsQuery($slug: String!, $from: DateTime, $to: DateTime) {
    account(slug: $slug) {
      id
      currency
      stats {
        id
        contributionsAmount(dateFrom: $from, dateTo: $to, includeChildren: false) {
          label
          count
          amount {
            value
            valueInCents
            currency
          }
        }
        contributionsAmountTimeSeries(dateFrom: $from, dateTo: $to, includeChildren: false) {
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
const ContributionsBudget = ({ collective, defaultTimeInterval, ...props }) => {
  const [tmpDateInterval, setTmpDateInterval] = React.useState(defaultTimeInterval);
  const [graphType, setGraphType] = React.useState(GRAPH_TYPES.LIST);
  const { data, loading } = useQuery(budgetSectionContributionsQuery, {
    variables: { slug: collective.slug, ...tmpDateInterval },
    context: API_V2_CONTEXT,
  });
  const intl = useIntl();

  const timeUnit = data?.account?.stats.contributionsAmountTimeSeries.timeUnit;
  const { series } = extractSeriesFromTimeSeries(data?.account?.stats.contributionsAmountTimeSeries.nodes, {
    x: 'date',
    y: 'amount.value',
    group: 'label',
    groupNameTransformer: capitalize,
  });

  const defaultApexOptions = makeApexOptions(collective.currency, timeUnit, intl);

  return (
    <Flex {...props}>
      <Flex justifyContent="space-between" alignItems="center" flexGrow={1}>
        <P fontSize="20px" lineHeight="20px" fontWeight="500">
          <FormattedMessage id="Contributions" defaultMessage="Contributions" />
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
          <GraphTypeButton active={graphType === GRAPH_TYPES.PIE} onClick={() => setGraphType(GRAPH_TYPES.PIE)}>
            <PieChart />
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
                <FormattedMessage id="ContributionsReceived" defaultMessage="Contributions received" />
              </P>
              <P fontSize="16px" lineHeight="24px" fontWeight="500" mt="4px">
                {sumBy(data?.account?.stats.contributionsAmount, 'count')}
              </P>
            </Box>
            <Box width="50%">
              <P fontSize="12px" lineHeight="16px" fontWeight="500" textTransform="uppercase" color="black.700">
                <FormattedMessage id="Label.AmountCollected" defaultMessage="Amount collected" />
              </P>
              <P fontSize="16px" lineHeight="24px" fontWeight="500" mt="4px">
                {formatCurrency(
                  sumBy(data?.account?.stats.contributionsAmount, 'amount.valueInCents'),
                  collective.currency,
                )}
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
                <FormattedMessage key={1} id="Tiers" defaultMessage="Tiers" />,
                <FormattedMessage key={2} id="Label.NumberOfContributions" defaultMessage="# of Contributions" />,
                <FormattedMessage
                  key={3}
                  id="Label.AmountWithCurrency"
                  defaultMessage="Amount ({currency})"
                  values={{ currency: data?.account.currency }}
                />,
              ]}
              rows={data?.account?.stats.contributionsAmount.map((contribution, i) =>
                makeBudgetTableRow(contribution.label + contribution.count, [
                  <React.Fragment key={contribution.label}>
                    <TagMarker color={COLORS[i % COLORS.length]} />
                    {contribution.label}
                  </React.Fragment>,
                  contribution.count,
                  formatCurrency(contribution.amount.valueInCents, contribution.amount.currency),
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
                    id: 'chart-budget-contributions-overview',
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
                series={alignSeries(series)}
              />
            </Box>
          )}
          {graphType === GRAPH_TYPES.PIE && (
            <Box mt={4}>
              <Chart
                type="pie"
                width="100%"
                height="300px"
                options={{
                  labels: data?.account?.stats.contributionsAmount.map(contribution => capitalize(contribution.label)),
                  colors: COLORS,
                  chart: {
                    id: 'chart-budget-expenses-pie',
                  },
                  legend: { ...defaultApexOptions.legend, position: 'left' },
                  xaxis: defaultApexOptions.xaxis,
                  yaxis: defaultApexOptions.yaxis,
                }}
                series={data?.account?.stats.contributionsAmount.map(contribution => contribution.amount.value)}
              />
            </Box>
          )}
        </React.Fragment>
      )}
      <P mt={3} textAlign="right">
        <Link
          href={`${getCollectivePageRoute(collective)}/transactions?kind=ADDED_FUNDS%2CCONTRIBUTION`}
          data-cy="view-all-contributions-link"
        >
          <FormattedMessage
            id="CollectivePage.SectionBudget.ViewAllContributions"
            defaultMessage="View all contributions"
          />{' '}
          &rarr;
        </Link>
      </P>
    </Flex>
  );
};

ContributionsBudget.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
  }),
  defaultTimeInterval: PropTypes.shape({
    from: PropTypes.object,
    to: PropTypes.object,
  }),
};

export default ContributionsBudget;
