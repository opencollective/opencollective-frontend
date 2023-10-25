import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { ORDER_STATUS } from '../../../lib/constants/order-status';
import { parseDateInterval } from '../../../lib/date-utils';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import useLoggedInUser from '../../../lib/hooks/useLoggedInUser';
import { usePrevious } from '../../../lib/hooks/usePrevious';

import { parseAmountRange } from '../../budget/filters/AmountFilter';
import { confirmContributionFieldsFragment } from '../../ContributionConfirmationModal';
import { Box, Flex } from '../../Grid';
import CreatePendingOrderModal from '../../host-dashboard/CreatePendingOrderModal';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import OrdersFilters from '../../orders/OrdersFilters';
import OrdersList from '../../orders/OrdersList';
import Pagination from '../../Pagination';
import SearchBar from '../../SearchBar';
import StyledButton from '../../StyledButton';
import DashboardHeader from '../DashboardHeader';
import DashboardViews from '../DashboardViews';
import { DashboardSectionProps } from '../types';

const accountOrdersQuery = gql`
  query Orders(
    $hostSlug: String
    $limit: Int!
    $offset: Int!
    $status: [OrderStatus]
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
  ) {
    orders(
      account: { slug: $hostSlug }
      includeHostedAccounts: true
      filter: INCOMING
      status: $status
      searchTerm: $searchTerm
      limit: $limit
      offset: $offset
      dateFrom: $dateFrom
      dateTo: $dateTo
      minAmount: $minAmount
      maxAmount: $maxAmount
    ) {
      totalCount
      nodes {
        id
        legacyId
        description
        createdAt
        status
        ...ConfirmContributionFields
        paymentMethod {
          id
          providerType
        }
        fromAccount {
          id
          slug
          name
          imageUrl
          type
        }
        pendingContributionData {
          expectedAt
          paymentMethod
          ponumber
          memo
          fromAccountInfo {
            name
            email
          }
        }
        toAccount {
          id
          slug
          name
          imageUrl
          type
          isHost
          ... on AccountWithHost {
            bankTransfersHostFeePercent: hostFeePercent(paymentMethodType: MANUAL)
          }
        }
        permissions {
          id
          canMarkAsExpired
          canMarkAsPaid
        }
      }
    }
  }
  ${confirmContributionFieldsFragment}
`;

const accountOrdersMetaDataQuery = gql`
  query OrdersMetaData($hostSlug: String) {
    account(slug: $hostSlug) {
      id
      slug
      currency
      legacyId
      name
      isHost
    }
    all: orders(account: { slug: $hostSlug }, includeHostedAccounts: true, filter: INCOMING, limit: 0) {
      totalCount
    }
    pending: orders(
      account: { slug: $hostSlug }
      includeHostedAccounts: true
      filter: INCOMING
      status: PENDING
      limit: 0
    ) {
      totalCount
    }
    disputed: orders(
      account: { slug: $hostSlug }
      includeHostedAccounts: true
      filter: INCOMING
      status: DISPUTED
      limit: 0
    ) {
      totalCount
    }
    in_review: orders(
      account: { slug: $hostSlug }
      includeHostedAccounts: true
      filter: INCOMING
      status: IN_REVIEW
      limit: 0
    ) {
      totalCount
    }
  }
`;

const ORDERS_PER_PAGE = 15;

const isValidStatus = status => {
  return Boolean(ORDER_STATUS[status]);
};

const getVariablesFromQuery = query => {
  const amountRange = parseAmountRange(query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(query.period);
  const searchTerm = query.searchTerm || null;
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || ORDERS_PER_PAGE,
    status: isValidStatus(query.status) ? query.status : null,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    dateFrom,
    dateTo,
    searchTerm,
  };
};

const messages = defineMessages({
  searchPlaceholder: {
    id: 'Orders.Search.Placeholder',
    defaultMessage: 'Search all contributions...',
  },
});

const hasParams = query => {
  return Object.entries(query).some(([key, value]) => {
    return (
      ![
        'collectiveSlug',
        'hostCollectiveSlug',
        'limit',
        'offset',
        'paypalApprovalError',
        'section',
        'slug',
        'view',
      ].includes(key) && value
    );
  });
};

const ROUTE_PARAMS = ['hostCollectiveSlug', 'collectiveSlug', 'view', 'slug', 'section'];

const updateQuery = (router, newParams) => {
  const query = omitBy({ ...router.query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  const pathname = router.asPath.split('?')[0];
  return router.push({ pathname, query });
};

const HostFinancialContributions = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const hasFilters = React.useMemo(() => hasParams(router.query), [router.query]);
  const [showCreatePendingOrderModal, setShowCreatePendingOrderModal] = React.useState(false);
  const queryVariables = { hostSlug, ...getVariablesFromQuery(router.query) };
  const queryParams = { variables: queryVariables, context: API_V2_CONTEXT };
  const { data, error, loading, variables, refetch } = useQuery(accountOrdersQuery, queryParams);
  const pageRoute = `/dashboard/${hostSlug}/orders`;

  const { data: metaData, refetch: refetchMetaData } = useQuery(accountOrdersMetaDataQuery, {
    variables: { hostSlug },
    context: API_V2_CONTEXT,
  });

  const views = [
    {
      label: intl.formatMessage({ defaultMessage: 'All' }),
      query: {},
      id: 'all',
      count: metaData?.all?.totalCount,
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Pending' }),
      query: { status: 'PENDING' },
      count: metaData?.pending?.totalCount,
      id: 'pending',
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Disputed' }),
      query: { status: 'DISPUTED' },
      count: metaData?.disputed?.totalCount,
      id: 'disputed',
    },
    {
      label: intl.formatMessage({ id: 'order.in_review', defaultMessage: 'In Review' }),
      query: { status: 'IN_REVIEW' },
      count: metaData?.in_review?.totalCount,
      id: 'in_review',
    },
  ];

  const { LoggedInUser } = useLoggedInUser();
  const prevLoggedInUser = usePrevious(LoggedInUser);

  // Refetch data when user logs in
  React.useEffect(() => {
    if (!prevLoggedInUser && LoggedInUser) {
      refetch();
    }
  }, [LoggedInUser]);

  return (
    <Box maxWidth={1000} width="100%" m="0 auto">
      <DashboardHeader
        title={<FormattedMessage id="FinancialContributions" defaultMessage="Financial Contributions" />}
        description={<FormattedMessage defaultMessage="Contributions for Collectives you host." />}
        actions={
          <React.Fragment>
            <SearchBar
              height="40px"
              defaultValue={queryVariables.searchTerm}
              onSubmit={searchTerm => updateQuery(router, { searchTerm, offset: null })}
              placeholder={intl.formatMessage(messages.searchPlaceholder)}
            />
            <React.Fragment>
              <StyledButton
                onClick={() => setShowCreatePendingOrderModal(true)}
                buttonSize="small"
                buttonStyle="primary"
                height="38px"
                lineHeight="12px"
                data-cy="create-pending-contribution"
              >
                <FormattedMessage defaultMessage="Create pending" />
              </StyledButton>
              {showCreatePendingOrderModal && (
                <CreatePendingOrderModal
                  hostSlug={hostSlug}
                  onClose={() => setShowCreatePendingOrderModal(false)}
                  onSuccess={() => {
                    refetch();
                    refetchMetaData();
                  }}
                />
              )}
            </React.Fragment>
          </React.Fragment>
        }
      />

      <DashboardViews
        query={router.query}
        omitMatchingParams={ROUTE_PARAMS}
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
      <Flex mb={34}>
        <Box flexGrow="1" mr="18px">
          {metaData?.account ? (
            <OrdersFilters
              currency={metaData.account.currency}
              filters={router.query}
              onChange={queryParams => updateQuery(router, { ...queryParams, offset: null })}
              hasStatus={!status}
            />
          ) : loading ? (
            <LoadingPlaceholder height={70} />
          ) : null}
        </Box>
      </Flex>
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !data.orders?.nodes.length ? (
        <MessageBox type="info" withIcon data-cy="zero-order-message">
          {hasFilters ? (
            <FormattedMessage
              id="OrdersList.Empty"
              defaultMessage="No contributions match the given filters. <ResetLink>Reset</ResetLink> to see all."
              values={{
                ResetLink(text) {
                  return (
                    <Link data-cy="reset-orders-filters" href={{ pathname: router.asPath.split('?')[0], query: {} }}>
                      {text}
                    </Link>
                  );
                },
              }}
            />
          ) : (
            <FormattedMessage id="orders.empty" defaultMessage="No contribution" />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          <OrdersList
            isLoading={loading}
            orders={data?.orders?.nodes}
            nbPlaceholders={variables.limit}
            showPlatformTip
          />
          <Flex mt={5} justifyContent="center">
            <Pagination
              total={data?.orders?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              ignoredQueryParams={ROUTE_PARAMS}
            />
          </Flex>
        </React.Fragment>
      )}
    </Box>
  );
};

export default HostFinancialContributions;
