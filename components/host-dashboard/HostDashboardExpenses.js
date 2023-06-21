import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { isEmpty, omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { useToasts } from '../ToastProvider';
import { cx } from 'class-variance-authority';
import EXPENSE_STATUS from '../../lib/constants/expense-status';
import { parseDateInterval } from '../../lib/date-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { useLazyGraphQLPaginatedResults } from '../../lib/hooks/useLazyGraphQLPaginatedResults';
import { BarsArrowUpIcon, FunnelIcon } from '@heroicons/react/20/solid';
import { parseAmountRange } from '../budget/filters/AmountFilter';
import DismissibleMessage from '../DismissibleMessage';
import ExpensesFilters from '../expenses/ExpensesFilters';
import ExpensesList from '../expenses/ExpensesList';
import Tabs from '../ui/tabs-updated';
import Alert from '../ui/alert';
import DashboardHeader from '../DashboardHeader';
import { SettingsContext } from '../../lib/SettingsContext';
import { parseChronologicalOrderInput } from '../OrderFilter';
import ConfirmationModal from '../ConfirmationModal';
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
import { H1 } from '../Text';

import HostInfoCard, { hostInfoCardFields } from './HostInfoCard';
import ScheduledExpensesBanner from './ScheduledExpensesBanner';
import HeaderFilters from '../Filters';
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

    countReadyToPay: expenses(host: { slug: $hostSlug }, limit: 1, offset: 0, status: READY_TO_PAY) {
      totalCount
    }
    countScheduledForPayment: expenses(
      host: { slug: $hostSlug }
      limit: 1
      offset: 0
      status: SCHEDULED_FOR_PAYMENT
      payoutMethodType: BANK_ACCOUNT
    ) {
      totalCount
    }
    countOnHold: expenses(host: { slug: $hostSlug }, limit: 1, offset: 0, status: ON_HOLD) {
      totalCount
    }
    countIncomplete: expenses(host: { slug: $hostSlug }, limit: 1, offset: 0, status: INCOMPLETE) {
      totalCount
    }
  }

  ${expensesListFieldsFragment}
  ${expensesListAdminFieldsFragment}
  ${expenseHostFields}
  # ${hostInfoCardFields}
`;

const createHostDashboardExpensesQuery = views => {
  return gql`
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

    ${views.map((view, i) => {
      if (!view.showCount) return '';

      return `
      view${i}: expenses(
      host: { slug: $hostSlug }
      limit: 1
      offset: 0
      ${view.query.type ? `type: ${view.query.type}` : ''}
      ${view.query.status ? `status: ${view.query.status}` : ''}
    ){
      totalCount
    }`;
    })}

  }

  ${expensesListFieldsFragment}
  ${expensesListAdminFieldsFragment}
  ${expenseHostFields}
  # ${hostInfoCardFields}
`;
};

/**
 * Remove the expense from the query cache if we're filtering by status and the expense status has changed.
 */
const onExpenseUpdate = (updatedExpense, cache, filteredStatus) => {
  if (filteredStatus && filteredStatus !== 'ALL' && updatedExpense.status !== filteredStatus) {
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

const NB_EXPENSES_DISPLAYED = 20;

const isValidStatus = status => {
  return Boolean(status === 'READY_TO_PAY' || EXPENSE_STATUS[status]);
};

const getFilterFromQuery = query => {
  return {
    status: query.status === 'ALL' ? null : isValidStatus(query.status) ? query.status : undefined,
    type: query.type,
    tag: query.tag ? (Array.isArray(query.tag) ? query.tag : [query.tag]) : undefined,
    amount: query.amount,
    payout: query.payout,
    searchTerm: query.searchTerm,
    hasMissingReceipts: query.hasMissingReceipts,
  };
};

const getVariablesFromQuery = query => {
  const amountRange = parseAmountRange(query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(query.period);
  const orderBy = query.orderBy && parseChronologicalOrderInput(query.orderBy);
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || NB_EXPENSES_DISPLAYED,
    status: isValidStatus(query.status) ? query.status : undefined,
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
    // status: query.status || 'READY_TO_PAY',
  };
};

const ROUTE_PARAMS = ['hostCollectiveSlug', 'view', 'slug', 'section'];

const hasParams = query => {
  return Object.entries(query).some(([key, value]) => {
    return ![...ROUTE_PARAMS, 'offset', 'limit', 'paypalApprovalError', 'orderBy'].includes(key) && value;
  });
};

const filterOptions = [
  {
    key: 'type',
    label: 'Type',
    options: ['CHARGE', 'GRANT', 'INVOICE', 'REIMBURSEMENT', 'SETTLEMENT', 'UNCLASSIFIED'],
  },
  {
    key: 'payout',
    label: 'Payout method',
    options: ['BANK_ACCOUNT', 'PAYPAL', 'ACCOUNT_BALANCE', 'CREDIT_CARD', 'OTHER'],
  },
  {
    key: 'status',
    label: 'Status',
    // noFilter: 'ALL',
    options: [
      'APPROVED',
      'REJECTED',
      'PENDING',
      'READY_TO_PAY',
      'PAID',
      'ERROR',
      'DRAFT',
      'PROCESSING',
      'INCOMPLETE',
      'ON_HOLD',
      'REJECTED',
      'SCHEDULED_FOR_PAYMENT',
      'SPAM',
    ],
  },
  {
    key: 'amount',
    label: 'Amount',
    options: ['0-50', '50-500', '500-5000', '5000+'],
  },
  {
    key: 'searchTerm',
    label: 'Text search',
  },
];

const HostDashboardExpenses = ({ hostSlug, isDashboard }) => {
  const router = useRouter() || {};
  const intl = useIntl();
  const query = enforceDefaultParamsOnQuery(router.query);
  const [paypalPreApprovalError, setPaypalPreApprovalError] = React.useState(null);
  const hasFilters = React.useMemo(() => hasParams(query), [query]);
  const pageRoute = isDashboard ? `/dashboard/${hostSlug}/host-expenses` : `/${hostSlug}/admin/expenses`;
  const queryVariables = { hostSlug, ...getVariablesFromQuery(omitBy(query, isEmpty)) };
  const filters = getFilterFromQuery(omitBy(query, isEmpty));
  const [showConfirmationModal, setConfirmationModalDisplay] = React.useState(false);
  const initViews = [
    { label: 'All', query: {} },
    {
      label: 'Ready to pay',
      query: { status: 'READY_TO_PAY' },
      showCount: true,
    },
    {
      label: 'Scheduled for payment',
      query: { status: 'SCHEDULED_FOR_PAYMENT', payout: 'BANK_ACCOUNT' },
      actions: [
        {
          onClick: () => setConfirmationModalDisplay(true),
          label: <FormattedMessage id="expenses.scheduled.paybatch" defaultMessage="Pay Batch" />,
        },
      ],
      showCount: true,
    },
    { label: 'On hold', query: { status: 'ON_HOLD' }, showCount: true },
    {
      label: 'Incomplete',
      query: { status: 'INCOMPLETE' },
      showCount: true,
    },
    {
      label: 'Recently paid',
      query: { status: 'PAID' },
      showCount: false,
    },
  ];
  const queryWithViews = createHostDashboardExpensesQuery(initViews);
  const { data, loading, error } = useQuery(queryWithViews, { variables: queryVariables, context: API_V2_CONTEXT });
  // const paginatedExpenses = useLazyGraphQLPaginatedResults(expenses, 'expenses');
  React.useEffect(() => {
    if (query.paypalApprovalError && !paypalPreApprovalError) {
      setPaypalPreApprovalError(query.paypalApprovalError);
      router.replace(pageRoute, omit(query, 'paypalApprovalError'), { shallow: true });
    }
  }, [query.paypalApprovalError]);

  const [views, setViews] = React.useState(initViews);

  React.useEffect(() => {
    if (data) {
      const viewsUpToDate = views.map((view, i) => {
        return {
          ...view,
          count: data[`view${i}`]?.totalCount,
        };
      });
      setViews(viewsUpToDate);
    }
  }, [data]);

  const { settings } = React.useContext(SettingsContext);
  const resetFilter = {
    // status: 'ALL'
  };
  return (
    <div className="w-full max-w-screen-xl">
      <HeaderFilters
        title={<FormattedMessage id="Expenses" defaultMessage="Expenses" />}
        views={views}
        filter={filters}
        query={omitBy(query, (value, key) => !value || ROUTE_PARAMS.includes(key))}
        filterOptions={filterOptions}
        orderByOptions={[
          {
            label: intl.formatMessage({ id: 'ExpensesOrder.NewestFirst', defaultMessage: 'Newest first' }),
            value: 'CREATED_AT,DESC',
          },
          {
            label: intl.formatMessage({ id: 'ExpensesOrder.OldestFirst', defaultMessage: 'Oldest first' }),
            value: 'CREATED_AT,ASC',
          },
        ]}
        onChange={queryParams =>
          router.push({
            pathname: pageRoute,
            query: { ...resetFilter, ...queryParams },
          })
        }
        showDisplayAs
      />

      {showConfirmationModal && (
        <ConfirmationModal
          zindex={1000}
          header={<FormattedMessage id="expenses.scheduled.confirmation.title" defaultMessage="Pay Expenses Batch" />}
          body={
            <FormattedMessage
              id="expenses.scheduled.confirmation.body"
              defaultMessage="Are you sure you want to batch and pay {count, plural, one {# expense} other {# expenses}} scheduled for payment?"
              values={{ count: data?.countScheduledForPayment?.totalCount }}
            />
          }
          onClose={() => setConfirmationModalDisplay(false)}
          continueLabel={
            <FormattedMessage
              id="expense.pay.btn"
              defaultMessage="Pay with {paymentMethod}"
              values={{ paymentMethod: 'Wise' }}
            />
          }
          continueHandler={() => setConfirmationModalDisplay(false)}
        />
      )}

      {/* <Box mb={4}>
        {loading ? (
          <LoadingPlaceholder height={150} />
        ) : error ? (
          <MessageBoxGraphqlError error={error} />
        ) : (
          <HostInfoCard host={data.host} />
        )}
      </Box> */}
      {/* <ScheduledExpensesBanner
        hostSlug={hostSlug}
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
      /> */}
      {/* <Box mb={34}>
        {data?.host ? (
          <ExpensesFilters
            collective={data.host}
            filters={query}
            explicitAllForStatus
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
      </Box> */}

      {!loading && data?.expenses?.nodes?.length === 0 ? (
        <div className="w-full text-xl text-gray-400 h-36 flex justify-center items-center text-center">
          <span>
            No expenses match the given filters.{' '}
            <button
              className="underline"
              onClick={() =>
                router.push({
                  pathname: pageRoute,
                  query: { status: 'ALL' },
                })
              }
            >
              Reset
            </button>{' '}
            to see all.
          </span>
        </div>
      ) : (
        <div className={''}>
          <ExpensesList
            settings={settings}
            isLoading={loading}
            loadingCount={10}
            host={data?.host}
            nbPlaceholders={data?.expenses.limit}
            expenses={data?.expenses?.nodes || []}
            view="admin"
            onProcess={(expense, cache) => {
              hasFilters && onExpenseUpdate(expense, cache, query.status);
            }}
          />

          <Flex mt={5} justifyContent="center">
            <Pagination
              route={pageRoute}
              total={data?.expenses.totalCount}
              limit={data?.expenses.limit}
              offset={data?.expenses.offset}
              ignoredQueryParams={ROUTE_PARAMS}
            />
          </Flex>
        </div>
      )}
    </div>
  );
};

HostDashboardExpenses.propTypes = {
  hostSlug: PropTypes.string.isRequired,
  isDashboard: PropTypes.bool,
};

export default HostDashboardExpenses;
