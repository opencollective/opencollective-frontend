import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { isEmpty, omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import EXPENSE_STATUS from '../../lib/constants/expense-status';
import { parseDateInterval } from '../../lib/date-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { useLazyGraphQLPaginatedResults } from '../../lib/hooks/useLazyGraphQLPaginatedResults';

import { parseAmountRange } from '../budget/filters/AmountFilter';
import DismissibleMessage from '../DismissibleMessage';
import ExpensesFilters from '../expenses/ExpensesFilters';
import ExpensesList from '../expenses/ExpensesList';
import { parseChronologicalOrderInput } from '../expenses/filters/ExpensesOrder';
import {
  expenseHostFields,
  expensesListAdminFieldsFragment,
  expensesListFieldsFragment,
} from '../expenses/graphql/fragments';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { H1, P } from '../Text';

import HostInfoCard, { hostInfoCardFields } from './HostInfoCard';
import ScheduledExpensesBanner from './ScheduledExpensesBanner';

const hostDashboardExpensesQuery = gql`
  query HostDashboardExpenses(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $tags: [String]
    $status: ExpenseStatusFilter
    $minAmount: Int
    $maxAmount: Int
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $orderBy: ChronologicalOrderInput
  ) {
    host(slug: $hostSlug) {
      id
      ...ExpenseHostFields
      ...HostInfoCardFields
      transferwise {
        id
        availableCurrencies
      }
    }
    expenses(
      host: { slug: $hostSlug }
      limit: $limit
      offset: $offset
      type: $type
      tag: $tags
      status: $status
      minAmount: $minAmount
      maxAmount: $maxAmount
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $orderBy
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        ...ExpensesListFieldsFragment
        ...ExpensesListAdminFieldsFragment
      }
    }
  }

  ${expensesListFieldsFragment}
  ${expensesListAdminFieldsFragment}
  ${expenseHostFields}
  ${hostInfoCardFields}
`;

const onExpenseUpdate = (updatedExpense, cache, filteredStatus) => {
  if (updatedExpense.status !== filteredStatus) {
    cache.modify({
      fields: {
        expenses(existingExpenses, { readField }) {
          if (!existingExpenses?.nodes) {
            return existingExpenses;
          } else {
            return {
              ...existingExpenses,
              totalCount: existingExpenses.totalCount - 1,
              nodes: existingExpenses.nodes.filter(expense => updatedExpense.id !== readField('id', expense)),
            };
          }
        },
      },
    });
  }
};

const NB_EXPENSES_DISPLAYED = 10;

const isValidStatus = status => {
  return Boolean(status === 'READY_TO_PAY' || EXPENSE_STATUS[status]);
};

const getVariablesFromQuery = query => {
  const amountRange = parseAmountRange(query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(query.period);
  const orderBy = query.orderBy && parseChronologicalOrderInput(query.orderBy);
  return {
    offset: parseInt(query.offset) || 0,
    limit: (parseInt(query.limit) || NB_EXPENSES_DISPLAYED) * 2,
    status: isValidStatus(query.status) ? query.status : null,
    type: query.type,
    tags: query.tag ? [query.tag] : undefined,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    payoutMethodType: query.payout,
    dateFrom,
    dateTo,
    orderBy,
    searchTerm: query.searchTerm,
  };
};

const ROUTE_PARAMS = ['hostCollectiveSlug', 'view', 'slug', 'section'];

const hasParams = query => {
  return Object.entries(query).some(([key, value]) => {
    return ![...ROUTE_PARAMS, 'offset', 'limit', 'paypalApprovalError', 'orderBy'].includes(key) && value;
  });
};

const HostDashboardExpenses = ({ hostSlug }) => {
  const router = useRouter() || {};
  const query = router.query;
  const [paypalPreApprovalError, setPaypalPreApprovalError] = React.useState(null);
  const hasFilters = React.useMemo(() => hasParams(query), [query]);
  const pageRoute = `/${hostSlug}/admin/expenses`;
  const expenses = useQuery(hostDashboardExpensesQuery, {
    variables: { hostSlug, ...getVariablesFromQuery(omitBy(query, isEmpty)) },
    context: API_V2_CONTEXT,
  });
  const paginatedExpenses = useLazyGraphQLPaginatedResults(expenses, 'expenses');
  React.useEffect(() => {
    if (query.paypalApprovalError && !paypalPreApprovalError) {
      setPaypalPreApprovalError(query.paypalApprovalError);
      router.replace(pageRoute, omit(query, 'paypalApprovalError'), { shallow: true });
    }
  }, [query.paypalApprovalError]);

  const { data, error, loading } = expenses;
  const { hasDisputedOrders, hasInReviewOrders } = data?.host || {};
  const getQueryParams = newParams => {
    return omitBy({ ...router.query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  };

  return (
    <Box maxWidth={1000} m="0 auto" px={2}>
      {!loading && (hasDisputedOrders || hasInReviewOrders) && (
        <MessageBox type="warning" withIcon mb={3}>
          <Flex
            flexDirection={hasDisputedOrders && hasInReviewOrders ? 'column' : 'row'}
            gridGap={'8px'}
            flexWrap={'wrap'}
          >
            <P fontWeight={700}>
              <FormattedMessage id="host.fraudProtectionWarning" defaultMessage="Fraud Protection Warning" />
            </P>
            {hasDisputedOrders && (
              <P>
                <FormattedMessage
                  id="host.disputes.warning"
                  defaultMessage="There are disputed charges that need review."
                />{' '}
                <Link href={`/${hostSlug}/admin/orders?status=DISPUTED`}>Disputed Orders</Link>{' '}
              </P>
            )}
            {hasInReviewOrders && (
              <P>
                <FormattedMessage
                  id="host.in_review.warning"
                  defaultMessage="There are charges under review that need attention."
                />{' '}
                <Link href={`/${hostSlug}/admin/orders?status=IN_REVIEW`}>In Review Orders</Link>{' '}
              </P>
            )}
          </Flex>
        </MessageBox>
      )}

      <Flex mb={24} alignItems="center" flexWrap="wrap">
        <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal">
          <FormattedMessage id="Expenses" defaultMessage="Expenses" />
        </H1>
        <Box mx="auto" />
        <Box p={2}>
          <SearchBar
            defaultValue={query.searchTerm}
            onSubmit={searchTerm =>
              router.push({
                pathname: pageRoute,
                query: getQueryParams({ searchTerm, offset: null }),
              })
            }
          />
        </Box>
      </Flex>
      <StyledHr mb={26} borderWidth="0.5px" borderColor="black.300" />
      {paypalPreApprovalError && (
        <DismissibleMessage>
          {({ dismiss }) => (
            <MessageBox type="warning" mb={3} withIcon onClose={dismiss}>
              {paypalPreApprovalError === 'PRE_APPROVAL_EMAIL_CHANGED' ? (
                <FormattedMessage
                  id="paypal.preApproval.emailWarning"
                  defaultMessage="Warning: the associated PayPal email was changed from {oldEmail} to {newEmail}. If this was not intentional, click {refillBalance} and use the correct account."
                  values={{
                    oldEmail: <strong>{query.oldPaypalEmail}</strong>,
                    newEmail: <strong>{query.newPaypalEmail}</strong>,
                    refillBalance: (
                      <q>
                        <FormattedMessage id="ConnectPaypal.refill" defaultMessage="Refill balance" />
                      </q>
                    ),
                  }}
                />
              ) : (
                paypalPreApprovalError
              )}
            </MessageBox>
          )}
        </DismissibleMessage>
      )}
      <Box mb={4}>
        {loading ? (
          <LoadingPlaceholder height={150} />
        ) : error ? (
          <MessageBoxGraphqlError error={error} />
        ) : (
          <HostInfoCard host={data.host} />
        )}
      </Box>
      {!expenses.loading && data?.host && (
        <ScheduledExpensesBanner
          host={data.host}
          expenses={paginatedExpenses.nodes}
          onSubmit={() => {
            expenses.refetch();
          }}
          secondButton={
            !(query.status === 'SCHEDULED_FOR_PAYMENT' && query.payout === 'BANK_ACCOUNT') ? (
              <StyledButton
                buttonSize="tiny"
                buttonStyle="successSecondary"
                mr={1}
                onClick={() => {
                  router.push({
                    pathname: pageRoute,
                    query: getQueryParams({ status: 'SCHEDULED_FOR_PAYMENT', payout: 'BANK_ACCOUNT', offset: null }),
                  });
                }}
              >
                <FormattedMessage id="expenses.list" defaultMessage="List Expenses" />
              </StyledButton>
            ) : null
          }
        />
      )}
      <Box mb={34}>
        {data?.host ? (
          <ExpensesFilters
            collective={data.host}
            filters={query}
            onChange={queryParams =>
              router.push({
                pathname: pageRoute,
                query: getQueryParams({ ...queryParams, offset: null }),
              })
            }
          />
        ) : loading ? (
          <LoadingPlaceholder height={70} />
        ) : null}
      </Box>
      {error ? null : !loading && !data.expenses?.nodes.length ? (
        <MessageBox type="info" withIcon data-cy="zero-expense-message">
          {hasFilters ? (
            <FormattedMessage
              id="ExpensesList.Empty"
              defaultMessage="No expense matches the given filters, <ResetLink>reset them</ResetLink> to see all expenses."
              values={{
                ResetLink(text) {
                  return (
                    <Link data-cy="reset-expenses-filters" href={{ pathname: pageRoute }}>
                      {text}
                    </Link>
                  );
                },
              }}
            />
          ) : (
            <FormattedMessage id="expenses.empty" defaultMessage="No expenses" />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          <ExpensesList
            isLoading={loading}
            host={data?.host}
            nbPlaceholders={paginatedExpenses.limit}
            expenses={paginatedExpenses.nodes}
            view="admin"
            onProcess={(expense, cache) => {
              hasFilters && onExpenseUpdate(expense, cache, query.status);
            }}
          />
          <Flex mt={5} justifyContent="center">
            <Pagination
              route={pageRoute}
              total={paginatedExpenses.totalCount}
              limit={paginatedExpenses.limit}
              offset={paginatedExpenses.offset}
              ignoredQueryParams={ROUTE_PARAMS}
            />
          </Flex>
        </React.Fragment>
      )}
    </Box>
  );
};

HostDashboardExpenses.propTypes = {
  hostSlug: PropTypes.string.isRequired,
  isNewAdmin: PropTypes.bool,
};

export default HostDashboardExpenses;
