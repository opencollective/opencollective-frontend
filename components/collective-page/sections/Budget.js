import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { get, orderBy } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { isIndividualAccount } from '../../../lib/collective.lib';
import { TransactionKind } from '../../../lib/constants/transactions';
import { EMPTY_ARRAY } from '../../../lib/constants/utils';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { getCollectivePageRoute } from '../../../lib/url-helpers';

import { DebitItem } from '../../budget/DebitCreditList';
import ExpenseBudgetItem from '../../budget/ExpenseBudgetItem';
import Container from '../../Container';
import { expenseHostFields, expensesListFieldsFragment } from '../../expenses/graphql/fragments';
import { Box, Flex } from '../../Grid';
import Image from '../../Image';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledCard from '../../StyledCard';
import StyledFilters from '../../StyledFilters';
import { P } from '../../Text';
import { getDefaultKinds } from '../../transactions/filters/TransactionsKindFilter';
import { transactionsQueryCollectionFragment } from '../../transactions/graphql/fragments';
import TransactionItem from '../../transactions/TransactionItem';
import { withUser } from '../../UserProvider';
import BudgetStats from '../BudgetStats';
import ContainerSectionContent from '../ContainerSectionContent';

const budgetSectionAccountFieldsFragment = gql`
  fragment BudgetSectionAccountFields on Account {
    id
    isHost
    type
    stats {
      id
      balance {
        valueInCents
        currency
      }
      consolidatedBalance {
        valueInCents
        currency
      }
      yearlyBudget {
        valueInCents
        currency
      }
      activeRecurringContributions
      totalAmountReceived(periodInMonths: 12) {
        valueInCents
        currency
      }
      totalAmountRaised: totalAmountReceived {
        valueInCents
        currency
      }
      totalNetAmountRaised: totalNetAmountReceived {
        valueInCents
        currency
      }
    }
  }
`;

export const budgetSectionQuery = gql`
  query BudgetSection($slug: String!, $limit: Int!, $kind: [TransactionKind]) {
    transactions(
      account: { slug: $slug }
      limit: $limit
      kind: $kind
      includeIncognitoTransactions: true
      includeGiftCardTransactions: true
      includeChildrenTransactions: true
    ) {
      ...TransactionsQueryCollectionFragment
    }
    expenses(account: { slug: $slug }, limit: $limit, includeChildrenExpenses: true) {
      totalCount
      nodes {
        id
        ...ExpensesListFieldsFragment
        host {
          id
          ...ExpenseHostFields
        }
      }
    }
    account(slug: $slug) {
      id
      ...BudgetSectionAccountFields
    }
  }
  ${transactionsQueryCollectionFragment}
  ${expensesListFieldsFragment}
  ${expenseHostFields}
  ${budgetSectionAccountFieldsFragment}
`;

export const budgetSectionForIndividualQuery = gql`
  query BudgetSectionForIndividual($slug: String!, $limit: Int!, $kind: [TransactionKind]) {
    transactions(
      account: { slug: $slug }
      limit: $limit
      kind: $kind
      includeIncognitoTransactions: true
      includeGiftCardTransactions: true
    ) {
      ...TransactionsQueryCollectionFragment
    }
    expenses(createdByAccount: { slug: $slug }, limit: $limit) {
      totalCount
      nodes {
        id
        ...ExpensesListFieldsFragment
        host {
          id
          ...ExpenseHostFields
        }
      }
    }
    account(slug: $slug) {
      id
      isHost
      type
      stats {
        id
        totalAmountSpent(net: true) {
          valueInCents
          currency
        }
        totalPaidExpenses {
          valueInCents
          currency
        }
      }
    }
  }
  ${transactionsQueryCollectionFragment}
  ${expensesListFieldsFragment}
  ${expenseHostFields}
`;

// /!\ Any change here should be reflected in API's `server/graphql/cache.js`
export const budgetSectionWithHostQuery = gql`
  query BudgetSectionWithHost($slug: String!, $limit: Int!, $kind: [TransactionKind]) {
    transactions(
      account: { slug: $slug }
      limit: $limit
      kind: $kind
      includeIncognitoTransactions: true
      includeGiftCardTransactions: true
      includeChildrenTransactions: true
    ) {
      ...TransactionsQueryCollectionFragment
    }
    expenses(account: { slug: $slug }, limit: $limit, includeChildrenExpenses: true) {
      totalCount
      nodes {
        id
        ...ExpensesListFieldsFragment
      }
    }
    account(slug: $slug) {
      id
      ...BudgetSectionAccountFields
      ... on AccountWithHost {
        host {
          id
          ...ExpenseHostFields
        }
      }
    }
  }
  ${transactionsQueryCollectionFragment}
  ${expensesListFieldsFragment}
  ${expenseHostFields}
  ${budgetSectionAccountFieldsFragment}
`;

export const getBudgetSectionQuery = (hasHost, isIndividual) => {
  if (hasHost) {
    return budgetSectionWithHostQuery;
  } else if (isIndividual) {
    return budgetSectionForIndividualQuery;
  } else {
    return budgetSectionQuery;
  }
};

// Any change here should be reflected in API's `server/graphql/cache.js`
export const getBudgetSectionQueryVariables = (collectiveSlug, hostSlug, isIndividual) => {
  if (isIndividual) {
    return { slug: collectiveSlug, limit: 3, kind: getDefaultKinds().filter(kind => kind !== TransactionKind.EXPENSE) };
  } else {
    return { slug: collectiveSlug, hostSlug, limit: 3, kind: getDefaultKinds() };
  }
};

const BudgetItemContainer = styled.div`
  ${props =>
    !props.$isFirst &&
    css`
      border-top: 1px solid #e6e8eb;
    `}
`;

const FILTERS = ['all', 'expenses', 'transactions'];

const geFilterLabel = (filter, isIndividual) => {
  switch (filter) {
    case 'all':
      return <FormattedMessage id="SectionTransactions.All" defaultMessage="All" />;
    case 'expenses':
      return <FormattedMessage id="Expenses" defaultMessage="Expenses" />;
    case 'transactions':
      return isIndividual ? (
        <FormattedMessage id="Contributions" defaultMessage="Contributions" />
      ) : (
        <FormattedMessage id="menu.transactions" defaultMessage="Transactions" />
      );
    default:
      return null;
  }
};

const getBudgetItems = (transactions, expenses, filter) => {
  if (filter === 'expenses') {
    return expenses;
  } else if (filter === 'transactions') {
    return transactions;
  } else {
    const expenseIds = expenses.map(expense => expense.id);
    const transactionsWithoutMatchingExpense = transactions.filter(
      transaction => !expenseIds.includes(transaction.expense?.id),
    );
    return orderBy([...transactionsWithoutMatchingExpense, ...expenses], 'createdAt', 'desc').slice(0, 3);
  }
};

const ViewAllLink = ({ collective, filter, hasExpenses, hasTransactions, isIndividual }) => {
  const isFilterAll = filter === 'all';
  if (filter === 'expenses' || (isFilterAll && hasExpenses && !hasTransactions)) {
    return (
      <Link
        href={`${getCollectivePageRoute(collective)}/${isIndividual ? 'submitted-expenses' : 'expenses'}`}
        data-cy="view-all-expenses-link"
      >
        <span>
          <FormattedMessage id="CollectivePage.SectionBudget.ViewAllExpenses" defaultMessage="View all expenses" />
          &nbsp; &rarr;
        </span>
      </Link>
    );
  } else if (isFilterAll && isIndividual) {
    return (
      <Link href={`${getCollectivePageRoute(collective)}/transactions`} data-cy="view-all-transactions-link">
        <FormattedMessage id="transactions.viewAll" defaultMessage="View All Transactions" />
        &nbsp; &rarr;
      </Link>
    );
  } else if (filter === 'transactions' || (isFilterAll && hasTransactions && !hasExpenses)) {
    return isIndividual ? (
      <Link
        href={`${getCollectivePageRoute(collective)}/transactions?kind=ADDED_FUNDS,CONTRIBUTION,PLATFORM_TIP`}
        data-cy="view-all-transactions-link"
      >
        <FormattedMessage
          id="CollectivePage.SectionBudget.ViewAllContributions"
          defaultMessage="View all contributions"
        />
        &nbsp; &rarr;
      </Link>
    ) : (
      <Link href={`${getCollectivePageRoute(collective)}/transactions`} data-cy="view-all-transactions-link">
        <FormattedMessage id="CollectivePage.SectionBudget.ViewAll" defaultMessage="View all transactions" /> &rarr;
      </Link>
    );
  } else {
    return null;
  }
};

ViewAllLink.propTypes = {
  collective: PropTypes.object,
  hasExpenses: PropTypes.bool,
  isIndividual: PropTypes.bool,
  hasTransactions: PropTypes.bool,
  filter: PropTypes.oneOf(FILTERS),
};

/**
 * The budget section. Shows the expenses, the latest transactions and some statistics
 * abut the global budget of the collective.
 */
const SectionBudget = ({ collective, LoggedInUser }) => {
  const [filter, setFilter] = React.useState('all');
  const isIndividual = isIndividualAccount(collective) && !collective.isHost;
  const budgetQueryResult = useQuery(getBudgetSectionQuery(Boolean(collective.host), isIndividual), {
    variables: getBudgetSectionQueryVariables(collective.slug, collective.host?.slug, isIndividual),
    context: API_V2_CONTEXT,
  });
  const { data, refetch } = budgetQueryResult;

  const transactions = get(data, 'transactions.nodes') || EMPTY_ARRAY;
  const expenses = get(data, 'expenses.nodes') || EMPTY_ARRAY;
  const budgetItemsParams = [transactions, expenses, filter];
  const allItems = React.useMemo(() => getBudgetItems(...budgetItemsParams), budgetItemsParams);
  const isLoading = !allItems.length && budgetQueryResult.loading;
  const hasExpenses = Boolean(expenses.length);
  const hasTransactions = Boolean(transactions.length);

  // Refetch data when user logs in to refresh permissions
  React.useEffect(() => {
    if (LoggedInUser) {
      refetch();
    }
  }, [LoggedInUser]);

  return (
    <ContainerSectionContent pb={4}>
      {(hasExpenses || hasTransactions) && (
        <Flex
          mb={3}
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems="center"
          maxWidth={['100%', null, 'min(748px, 55vw)']}
        >
          <StyledFilters
            filters={FILTERS}
            getLabel={filter => geFilterLabel(filter, isIndividual)}
            selected={filter}
            onChange={setFilter}
          />
          <ViewAllLink
            collective={collective}
            filter={filter}
            hasExpenses={hasExpenses}
            hasTransactions={hasTransactions}
            isIndividual={isIndividual}
          />
        </Flex>
      )}
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
                          host={item.host || data.account.host}
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

        {isLoading ? (
          <LoadingPlaceholder height={300} />
        ) : (
          <BudgetStats collective={collective} stats={data?.account?.stats} />
        )}
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
    isHost: PropTypes.bool,
    settings: PropTypes.object,
    host: PropTypes.object,
  }),

  LoggedInUser: PropTypes.object,
};

export default React.memo(withUser(SectionBudget));
