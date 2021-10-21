import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../../lib/constants/collectives';
import { formatCurrency } from '../../../lib/currency-utils';
import { simpleDateToISOString } from '../../../lib/date-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import PeriodFilter from '../../budget/filters/PeriodFilter';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import Container from '../../Container';
import { Flex } from '../../Grid';
import Loading from '../../Loading';
import { P, Span } from '../../Text';

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
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
      currency
      contributionStats(account: $account, dateFrom: $dateFrom, dateTo: $dateTo) {
        contributionsCount
        oneTimeContributionsCount
        recurringContributionsCount
        dailyAverageIncomeAmount {
          valueInCents
        }
      }
      expenseStats(account: $account, dateFrom: $dateFrom, dateTo: $dateTo) {
        expensesCount
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

const TransactionsOverviewSection = ({ hostSlug }) => {
  const [collectives, setCollectives] = useState(null);
  const [dateInterval, setDateInterval] = useState(null);

  const prepareDateArgs = dateInterval => {
    if (!dateInterval) {
      return {};
    } else {
      return {
        dateFrom: simpleDateToISOString(dateInterval.from, false, dateInterval.timezoneType),
        dateTo: simpleDateToISOString(dateInterval.to, true, dateInterval.timezoneType),
      };
    }
  };

  const { data, loading } = useQuery(transactionsOverviewQuery, {
    variables: { hostSlug, ...prepareDateArgs(dateInterval), account: collectives },
    context: API_V2_CONTEXT,
  });
  const host = data?.host;
  const currency = host?.currency;
  const contributionStats = host?.contributionStats;
  const expenseStats = host?.expenseStats;

  const { contributionsCount, recurringContributionsCount, oneTimeContributionsCount, dailyAverageIncomeAmount } =
    contributionStats || 0;
  const { expensesCount, invoicesCount, reimbursementsCount, grantsCount, dailyAverageAmount } = expenseStats || 0;

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
          <PeriodFilter onChange={setDateInterval} value={dateInterval} minDate={host?.createdAt} />
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
