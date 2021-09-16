import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../../lib/currency-utils';
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
    $accounts: [AccountReferenceInput!]
    $dateFrom: String
    $dateTo: String
  ) {
    host(slug: $hostSlug) {
      id
      contributionStats(accounts: $accounts, from: $dateFrom, to: $dateTo) {
        numContributions
        numOneTime
        numRecurring
        dailyAvgIncome
      }
      expenseStats(accounts: $accounts, from: $dateFrom, to: $dateTo) {
        numExpenses
        dailyAverage
        numInvoices
        numReimbursements
        numGrants
      }
    }
  }
`;

const TransactionsOverviewSection = ({ hostSlug, currency }) => {
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [collectives, setCollectives] = useState(null);

  const { data, loading, refetch } = useQuery(transactionsOverviewQuery, {
    variables: { hostSlug, dateFrom, dateTo, accounts: collectives },
    context: API_V2_CONTEXT,
  });
  const contributionStats = data?.host.contributionStats;
  const expenseStats = data?.host.expenseStats;

  useEffect(() => {
    refetch();
  }, [dateFrom, dateTo, collectives]);

  const { numContributions, numRecurring, numOneTime, dailyAvgIncome } = contributionStats;
  const { numExpenses, numInvoices, numReimbursements, numGrants, dailyAverage } = expenseStats;

  const setDate = dateRange => {
    if (!dateRange) {
      setDateFrom(null);
      setDateTo(null);
      refetch();
      return;
    }
    const dates = dateRange.split('→');
    const dateFrom = dates[0];
    const dateTo = dates[1];
    if (dateFrom === 'all') {
      setDateFrom(null);
    } else {
      setDateFrom(dateFrom);
    }
    if (dateTo === 'all') {
      setDateTo(null);
    } else {
      setDateTo(dateTo);
    }
  };

  const getDateString = () => {
    let dateString;
    if (!dateFrom && !dateTo) {
      return;
    }
    if (dateFrom) {
      dateString = `${dateFrom}→`;
    } else {
      dateString = 'all→';
    }

    if (dateTo) {
      dateString += dateTo;
    } else {
      dateString += 'all';
    }
    return dateString;
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
          <PeriodFilter onChange={value => setDate(value)} value={getDateString()} />
        </Container>
        <Container width={[1, 1, 1 / 2]}>
          <FilterLabel htmlFor="transactions-collective-filter">
            <FormattedMessage id="TransactionsOverviewSection.CollectiveFilter" defaultMessage="Filter by Collective" />
          </FilterLabel>
          <CollectivePickerAsync
            inputId="TransactionsCollectiveFilter"
            data-cy="transactions-collective-filter"
            types={['COLLECTIVE']}
            isMulti
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
                  {numContributions} <FormattedMessage id="Contributions" defaultMessage="Contributions" />
                </Span>{' '}
                | <FormattedMessage id="DailyAverage" defaultMessage="Daily avg" />
                {': '}
                <Span fontWeight="700">{formatCurrency(dailyAvgIncome, currency)}</Span>
              </P>
            </TotalFundsLabel>
            <TotalFundsLabel
              minWidth="250px"
              position="relative"
              left={['-280px', '-280px', '-280px', '300px']}
              top={['85px', '85px', '85px', '0px']}
            >
              <P>
                <Span fontWeight="500">
                  {numExpenses} <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
                </Span>{' '}
                | <FormattedMessage id="DailyAverage" defaultMessage="Daily avg" />
                {': '}
                <Span fontWeight="700">{formatCurrency(dailyAverage, currency)}</Span>
              </P>
            </TotalFundsLabel>
          </FundAmounts>
          <Container mt={2}>
            <Span mr={3}>
              <Square color="#51E094" />
              {` ${numOneTime} `}
              <FormattedMessage id="Frequency.OneTime" defaultMessage="One time" />
            </Span>
            <Span mr={['20px', '20px', '20px', '380px']}>
              <Square color="#BEFADA" />
              {` ${numRecurring} `}
              <FormattedMessage id="TransactionsOverviewSection.Recurring" defaultMessage="Recurring" />
            </Span>
            <Span mr={3}>
              <Square color="#CC2955" />
              {` ${numInvoices} `}
              <FormattedMessage id="TransactionsOverviewSection.Invoices" defaultMessage="Invoices" />
            </Span>
            <Span mr={3}>
              <Square color="#F55882" />
              {` ${numReimbursements} `}
              <FormattedMessage id="TransactionsOverviewSection.Reimbursements" defaultMessage="Reimbursements" />
            </Span>
            <Span mr={3}>
              <Square color="#FFC2D2" />
              {` ${numGrants} `}
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
    numContributions: PropTypes.number,
    numOneTime: PropTypes.number,
    numRecurring: PropTypes.number,
    dailyAvgIncome: PropTypes.number,
  }),
  expenseStats: PropTypes.shape({
    numExpenses: PropTypes.number,
    numInvoices: PropTypes.number,
    numReimbursements: PropTypes.number,
    numGrants: PropTypes.number,
    dailyAverage: PropTypes.number,
  }),
};

export default TransactionsOverviewSection;
