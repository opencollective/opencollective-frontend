import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { isEmpty, omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { parseDateInterval } from '../../lib/date-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { ExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import { useLazyGraphQLPaginatedResults } from '../../lib/hooks/useLazyGraphQLPaginatedResults';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import useQueryFilter, { BooleanFilter } from '../../lib/hooks/useQueryFilter';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

import { parseAmountRange } from '../budget/filters/AmountFilter';
import DashboardViews from '../dashboard/DashboardViews';
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
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
  ) {
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
      chargeHasReceipts: $chargeHasReceipts
      virtualCards: $virtualCards
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
`;
const hostDashboardMetaDataQuery = gql`
  query HostDashboardMetaData($hostSlug: String!, $getViewCounts: Boolean!) {
    host(slug: $hostSlug) {
      id
      ...ExpenseHostFields
      ...HostInfoCardFields
      transferwise {
        id
        availableCurrencies
        amountBatched {
          valueInCents
          currency
        }
      }
    }

    ready_to_pay: expenses(host: { slug: $hostSlug }, limit: 0, offset: 0, status: READY_TO_PAY)
      @include(if: $getViewCounts) {
      totalCount
    }
    scheduled_for_payment: expenses(
      host: { slug: $hostSlug }
      limit: 0
      offset: 0
      status: SCHEDULED_FOR_PAYMENT
      payoutMethodType: BANK_ACCOUNT
    ) @include(if: $getViewCounts) {
      totalCount
    }
    on_hold: expenses(host: { slug: $hostSlug }, limit: 0, offset: 0, status: ON_HOLD) @include(if: $getViewCounts) {
      totalCount
    }
    incomplete: expenses(host: { slug: $hostSlug }, limit: 0, offset: 0, status: INCOMPLETE)
      @include(if: $getViewCounts) {
      totalCount
    }
    error: expenses(host: { slug: $hostSlug }, limit: 0, offset: 0, status: ERROR) @include(if: $getViewCounts) {
      totalCount
    }
  }

  ${expenseHostFields}
  ${hostInfoCardFields}
`;
/**
 * Remove the expense from the query cache if we're filtering by status and the expense status has changed.
 */
const onExpenseUpdate = ({ updatedExpense, cache, variables, refetchMetaData }) => {
  refetchMetaData(); // Refetch the metadata to update the view counts
  if (variables.status && updatedExpense.status !== variables.status) {
    cache.updateQuery({ query: hostDashboardExpensesQuery, variables }, data => {
      return {
        ...data,
        expenses: {
          ...data.expenses,
          totalCount: data.expenses.totalCount - 1,
          nodes: data.expenses.nodes?.filter(expense => updatedExpense.id !== expense.id),
        },
      };
    });
  }
};

const NB_EXPENSES_DISPLAYED = 10;

const isValidStatus = status => {
  return [...Object.values(ExpenseStatus), 'READY_TO_PAY', 'ON_HOLD'].includes(status);
};

const getVariablesFromQuery = query => {
  const amountRange = parseAmountRange(query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(query.period);
  const orderBy = query.orderBy && parseChronologicalOrderInput(query.orderBy);
  return {
    offset: parseInt(query.offset) || 0,
    limit: (parseInt(query.limit) || NB_EXPENSES_DISPLAYED) * 2,
    status: query.status === 'ALL' ? null : isValidStatus(query.status) ? query.status : null,
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

const enforceDefaultParamsOnQuery = query => {
  return {
    ...query,
    status: query.status || 'READY_TO_PAY',
  };
};

const ROUTE_PARAMS = ['hostCollectiveSlug', 'view', 'slug', 'section'];

const hasParams = query => {
  return Object.entries(query).some(([key, value]) => {
    return ![...ROUTE_PARAMS, 'offset', 'limit', 'paypalApprovalError', 'orderBy'].includes(key) && value;
  });
};

const initViews = [
  { label: <FormattedMessage defaultMessage="All" />, query: {}, id: 'all' },
  {
    label: 'Ready to pay',
    query: { status: 'READY_TO_PAY', orderBy: 'CREATED_AT,ASC' },
    showCount: true,
    id: 'ready_to_pay',
  },
  {
    label: <FormattedMessage id="expense.scheduledForPayment" defaultMessage="Scheduled for payment" />,
    query: { status: 'SCHEDULED_FOR_PAYMENT', payout: 'BANK_ACCOUNT', orderBy: 'CREATED_AT,ASC' },
    showCount: true,
    id: 'scheduled_for_payment',
  },
  {
    label: <FormattedMessage defaultMessage="On hold" />,
    query: { status: 'ON_HOLD', orderBy: 'CREATED_AT,ASC' },
    showCount: true,
    id: 'on_hold',
  },
  {
    label: <FormattedMessage defaultMessage="Incomplete" />,
    query: { status: 'INCOMPLETE', orderBy: 'CREATED_AT,ASC' },
    showCount: true,
    id: 'incomplete',
  },
  {
    label: <FormattedMessage id="Error" defaultMessage="Error" />,
    query: { status: 'ERROR', orderBy: 'CREATED_AT,ASC' },
    showCount: true,
    id: 'error',
  },
  {
    label: <FormattedMessage defaultMessage="Paid" />,
    query: { status: 'PAID' },
    id: 'recently_paid',
  },
];

const HostDashboardExpenses = ({ hostSlug, isDashboard }) => {
  const router = useRouter() || {};
  const { LoggedInUser } = useLoggedInUser();
  const expensePipelineFeatureIsEnabled = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.EXPENSE_PIPELINE);
  const query = expensePipelineFeatureIsEnabled ? router.query : enforceDefaultParamsOnQuery(router.query);
  const [paypalPreApprovalError, setPaypalPreApprovalError] = React.useState(null);
  const hasFilters = React.useMemo(() => hasParams(query), [query]);
  const pageRoute = isDashboard ? `/dashboard/${hostSlug}/host-expenses` : `/${hostSlug}/admin/expenses`;
  const queryVariables = { hostSlug, ...getVariablesFromQuery(omitBy(query, isEmpty)) };

  const queryFilter = useQueryFilter({
    filters: {
      chargeHasReceipts: BooleanFilter,
      virtualCard: {
        isMulti: true,
      },
    },
  });
  const variables = {
    ...queryVariables,
    chargeHasReceipts: queryFilter.values.chargeHasReceipts,
    virtualCards: queryFilter.values.virtualCard?.map(id => ({ id })),
  };
  const expenses = useQuery(hostDashboardExpensesQuery, {
    variables,
    context: API_V2_CONTEXT,
  });

  const {
    data: metaData,
    loading: loadingMetaData,
    refetch: refetchMetaData,
  } = useQuery(hostDashboardMetaDataQuery, {
    variables: { hostSlug, getViewCounts: Boolean(expensePipelineFeatureIsEnabled) },
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

  const views = React.useMemo(() => {
    if (!metaData) {
      return initViews;
    }
    return initViews.map(view => {
      return {
        ...view,
        count: metaData[view.id]?.totalCount,
      };
    });
  }, [metaData]);

  const getQueryParams = newParams => {
    return omitBy({ ...query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  };

  return (
    <React.Fragment>
      <div className="mb-5 flex flex-wrap justify-between gap-4">
        <h1 className="text-2xl font-bold leading-10 tracking-tight">
          <FormattedMessage id="Expenses" defaultMessage="Expenses" />
        </h1>
        <SearchBar
          height="40px"
          defaultValue={query.searchTerm}
          onSubmit={searchTerm =>
            router.push({
              pathname: pageRoute,
              query: getQueryParams({ searchTerm, offset: null }),
            })
          }
        />
      </div>
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
        {!metaData?.host ? (
          <LoadingPlaceholder height={150} />
        ) : error ? (
          <MessageBoxGraphqlError error={error} />
        ) : (
          <HostInfoCard host={metaData.host} />
        )}
      </Box>
      <ScheduledExpensesBanner
        hostSlug={hostSlug}
        onSubmit={() => {
          expenses.refetch();
          refetchMetaData();
        }}
        secondButton={
          !(query.status === 'SCHEDULED_FOR_PAYMENT' && query.payout === 'BANK_ACCOUNT') ? (
            <StyledButton
              buttonSize="tiny"
              buttonStyle="successSecondary"
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
      {expensePipelineFeatureIsEnabled && (
        <DashboardViews
          query={query}
          omitMatchingParams={[...ROUTE_PARAMS, 'orderBy']}
          views={views}
          onChange={query => {
            router.push(
              {
                pathname: pageRoute,
                query,
              },
              undefined,
              { scroll: false },
            );
          }}
        />
      )}

      <Box mb={34}>
        {metaData?.host ? (
          <ExpensesFilters
            collective={metaData.host}
            filters={query}
            explicitAllForStatus
            displayOnHoldPseudoStatus
            showChargeHasReceiptFilter
            chargeHasReceiptFilter={queryFilter.values.chargeHasReceipts}
            onChargeHasReceiptFilterChange={queryFilter.setChargeHasReceipts}
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
            isLoading={loading || loadingMetaData}
            host={metaData?.host}
            nbPlaceholders={paginatedExpenses.limit}
            expenses={paginatedExpenses.nodes}
            view="admin"
            onProcess={(expense, cache) => {
              hasFilters && onExpenseUpdate({ updatedExpense: expense, cache, variables, refetchMetaData });
            }}
            useDrawer
            openExpenseLegacyId={Number(router.query.openExpenseId)}
            setOpenExpenseLegacyId={legacyId => {
              router.push(
                {
                  pathname: pageRoute,
                  query: getQueryParams({ ...query, openExpenseId: legacyId }),
                },
                undefined,
                { shallow: true },
              );
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
    </React.Fragment>
  );
};

HostDashboardExpenses.propTypes = {
  hostSlug: PropTypes.string.isRequired,
  isDashboard: PropTypes.bool,
};

export default HostDashboardExpenses;
