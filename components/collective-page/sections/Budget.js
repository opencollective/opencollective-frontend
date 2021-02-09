import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { get, orderBy } from 'lodash';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { CollectiveType } from '../../../lib/constants/collectives';
import { formatCurrency } from '../../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { DebitItem } from '../../budget/DebitCreditList';
import ExpenseBudgetItem from '../../budget/ExpenseBudgetItem';
import Container from '../../Container';
import DefinedTerm, { Terms } from '../../DefinedTerm';
import { expensesListFieldsFragment } from '../../expenses/graphql/fragments';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledCard from '../../StyledCard';
import StyledFilters from '../../StyledFilters';
import { P, Span } from '../../Text';
import { transactionsQueryCollectionFragment } from '../../transactions/graphql/fragments';
import TransactionItem from '../../transactions/TransactionItem';
import { withUser } from '../../UserProvider';
import ContainerSectionContent from '../ContainerSectionContent';

export const budgetSectionQuery = gqlV2/* GraphQL */ `
  query BudgetSection($slug: String!, $limit: Int!) {
    transactions(account: { slug: $slug }, limit: $limit, hasExpense: false) {
      ...TransactionsQueryCollectionFragment
    }
    expenses(account: { slug: $slug }, limit: $limit) {
      totalCount
      nodes {
        ...ExpensesListFieldsFragment
      }
    }
  }
  ${transactionsQueryCollectionFragment}
  ${expensesListFieldsFragment}
`;

export const getBudgetSectionQueryVariables = slug => {
  return { slug, limit: 3 };
};

const BudgetItemContainer = styled.div`
  ${props =>
    !props.$isFirst &&
    css`
      border-top: 1px solid #e6e8eb;
    `}
`;

const FILTERS = ['all', 'expenses', 'transactions'];

const geFilterLabel = filter => {
  switch (filter) {
    case 'all':
      return <FormattedMessage id="SectionTransactions.All" defaultMessage="All" />;
    case 'expenses':
      return <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />;
    case 'transactions':
      return <FormattedMessage id="SectionTransactions.Title" defaultMessage="Transactions" />;
    default:
      return null;
  }
};

const EMPTY_ARRAY = [];

const getBudgetItems = (transactions, expenses, filter) => {
  if (filter === 'expenses') {
    return expenses;
  } else if (filter === 'transactions') {
    return transactions;
  } else {
    return orderBy([...transactions, ...expenses], 'createdAt', 'desc').slice(0, 3);
  }
};

const ViewAllLink = ({ collective, filter }) => {
  switch (filter) {
    case 'expenses':
      return (
        <Link route="expenses" params={{ collectiveSlug: collective.slug }} data-cy="view-all-expenses-link">
          <FormattedMessage id="CollectivePage.SectionBudget.ViewAllExpenses" defaultMessage="View all expenses" />{' '}
          &rarr;
        </Link>
      );
    case 'transactions':
      return (
        <Link route="transactions" params={{ collectiveSlug: collective.slug }} data-cy="view-all-transactions-link">
          <FormattedMessage id="CollectivePage.SectionBudget.ViewAll" defaultMessage="View all transactions" /> &rarr;
        </Link>
      );
    default:
      return null;
  }
};

ViewAllLink.propTypes = {
  collective: PropTypes.object,
  filter: PropTypes.oneOf(FILTERS),
};

/**
 * The budget section. Shows the expenses, the latests transactions and some statistics
 * abut the global budget of the collective.
 */
const SectionBudget = ({ collective, stats, LoggedInUser }) => {
  const [filter, setFilter] = React.useState('all');
  const budgetQueryResult = useQuery(budgetSectionQuery, {
    variables: getBudgetSectionQueryVariables(collective.slug),
    context: API_V2_CONTEXT,
  });
  const { data, refetch } = budgetQueryResult;
  const monthlyRecurring =
    (stats.activeRecurringContributions?.monthly || 0) + (stats.activeRecurringContributions?.yearly || 0) / 12;
  const isFund = collective.type === CollectiveType.FUND;
  const isProject = collective.type === CollectiveType.PROJECT;
  const transactions = get(data, 'transactions.nodes') || EMPTY_ARRAY;
  const expenses = get(data, 'expenses.nodes') || EMPTY_ARRAY;
  const budgetItemsParams = [transactions, expenses, filter];
  const allItems = React.useMemo(() => getBudgetItems(...budgetItemsParams), budgetItemsParams);
  const isLoading = !allItems.length && data?.loading;

  // Refetch data when used logs in to refresh permissions
  React.useEffect(() => {
    refetch();
  }, [LoggedInUser]);

  return (
    <ContainerSectionContent pb={4}>
      <Flex mb={3} flexWrap="wrap" justifyContent="space-between" alignItems="center" maxWidth={720}>
        <StyledFilters filters={FILTERS} getLabel={geFilterLabel} selected={filter} onChange={setFilter} />
        <ViewAllLink collective={collective} filter={filter} />
      </Flex>
      <Flex flexDirection={['column-reverse', null, 'row']} justifyContent="space-between" alignItems="flex-start">
        <Container flex="10" mb={3} width="100%" maxWidth={800}>
          <StyledCard>
            {isLoading ? (
              <LoadingPlaceholder height={300} />
            ) : !allItems.length ? (
              <Container textAlign="center" py={94} px={2}>
                <Image src="/static/images/empty-jars.png" alt="Empty jars" width={125} height={125} />
                <P fontWeight="500" fontSize="20px" lineHeight="28px">
                  <FormattedMessage id="Budget.Empty" defaultMessage="There are no transactions yet." />
                </P>
                <P mt={2} fontSize="16px" lineHeight="24px" color="black.600">
                  <FormattedMessage
                    id="Budget.EmptyComeBackLater"
                    defaultMessage="Come back to this section once there is at least one transaction!"
                  />
                </P>
              </Container>
            ) : (
              allItems.map((item, idx) => {
                return (
                  <BudgetItemContainer
                    key={`${item.__typename}-${item?.id || idx}`}
                    $isFirst={!idx}
                    data-cy="single-budget-item"
                  >
                    {item.__typename === 'Expense' ? (
                      <DebitItem>
                        <ExpenseBudgetItem
                          expense={item}
                          collective={collective}
                          host={collective.host}
                          showAmountSign
                          showProcessActions
                        />
                      </DebitItem>
                    ) : (
                      <TransactionItem
                        transaction={item}
                        collective={collective}
                        displayActions
                        onMutationSuccess={refetch}
                      />
                    )}
                  </BudgetItemContainer>
                );
              })
            )}
          </StyledCard>
        </Container>

        <Box width="32px" flex="1" />

        <StyledCard
          display="flex"
          flex={[null, null, '1 1 300px']}
          width="100%"
          flexDirection={['column', 'row', 'column']}
          mb={2}
          mx={[null, null, 3]}
        >
          <Box data-cy="budgetSection-today-balance" flex="1" py={16} px={4}>
            <P fontSize="10px" textTransform="uppercase" color="black.700">
              <FormattedMessage id="CollectivePage.SectionBudget.Balance" defaultMessage="Today’s balance" />
            </P>
            <P fontSize="20px" mt={1}>
              {formatCurrency(stats.balance, collective.currency)} <Span color="black.700">{collective.currency}</Span>
            </P>
          </Box>
          {!isFund && !isProject && (
            <Container data-cy="budgetSection-estimated-budget" flex="1" background="#F5F7FA" py={16} px={4}>
              <DefinedTerm
                term={Terms.ESTIMATED_BUDGET}
                fontSize="10px"
                textTransform="uppercase"
                color="black.700"
                extraTooltipContent={
                  <Box mt={2}>
                    <FormattedMessage
                      id="CollectivePage.SectionBudget.MonthlyRecurringAmount"
                      defaultMessage="Monthly recurring: {amount}"
                      values={{ amount: formatCurrency(monthlyRecurring, collective.currency) }}
                    />
                    <br />
                    <FormattedMessage
                      id="CollectivePage.SectionBudget.TotalAmountReceived"
                      defaultMessage="Total received in the last 12 months: {amount}"
                      values={{ amount: formatCurrency(stats?.totalAmountReceived || 0, collective.currency) }}
                    />
                  </Box>
                }
              />
              <P fontSize="20px" mt={2}>
                <Span fontWeight="bold">~ {formatCurrency(stats.yearlyBudget, collective.currency)}</Span>{' '}
                <Span color="black.700">{collective.currency}</Span>
              </P>
            </Container>
          )}
          {isFund && (
            <Fragment>
              <Container flex="1" background="#F5F7FA" py={16} px={4}>
                <P fontSize="10px" textTransform="uppercase" color="black.700">
                  <FormattedMessage id="budgetSection-disbursed" defaultMessage="Total Amount Disbursed" />
                </P>
                <P fontSize="20px" mt={2}>
                  <Span fontWeight="bold">
                    {formatCurrency(stats.totalAmountRaised - stats.balance, collective.currency)}
                  </Span>{' '}
                  <Span color="black.700">{collective.currency}</Span>
                </P>
              </Container>

              <Container flex="1" background="#F5F7FA" py={16} px={4}>
                <P fontSize="10px" textTransform="uppercase" color="black.700">
                  <FormattedMessage id="budgetSection-raised" defaultMessage="Total Amount Raised" />
                </P>
                <P fontSize="20px" mt={2}>
                  <Span fontWeight="bold">{formatCurrency(stats.totalAmountRaised, collective.currency)}</Span>{' '}
                  <Span color="black.700">{collective.currency}</Span>
                </P>
              </Container>
            </Fragment>
          )}
        </StyledCard>
      </Flex>
    </ContainerSectionContent>
  );
};

SectionBudget.propTypes = {
  /** Collective */
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    isArchived: PropTypes.bool,
    settings: PropTypes.object,
    host: PropTypes.object,
  }),

  /** Stats */
  stats: PropTypes.shape({
    balance: PropTypes.number.isRequired,
    yearlyBudget: PropTypes.number.isRequired,
    activeRecurringContributions: PropTypes.object,
    totalAmountReceived: PropTypes.number,
    totalAmountRaised: PropTypes.number,
  }),

  LoggedInUser: PropTypes.object,
};

export default React.memo(withUser(SectionBudget));
