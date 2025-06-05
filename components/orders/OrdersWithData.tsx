import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { parseDateInterval } from '../../lib/date-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { usePrevious } from '../../lib/hooks/usePrevious';

import { accountHoverCardFields } from '../AccountHoverCard';
import { parseAmountRange } from '../budget/filters/AmountFilter';
import { confirmContributionFieldsFragment } from '../contributions/ConfirmContributionForm';
import { DisputedContributionsWarning } from '../dashboard/sections/collectives/DisputedContributionsWarning';
import CreatePendingOrderModal from '../dashboard/sections/contributions/CreatePendingOrderModal';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledButton from '../StyledButton';

import OrdersFilters from './OrdersFilters';
import OrdersList from './OrdersList';

const accountOrdersQuery = gql`
  query Orders(
    $accountSlug: String
    $limit: Int!
    $offset: Int!
    $status: [OrderStatus]
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
  ) {
    account(slug: $accountSlug) {
      id
      slug
      currency
      legacyId
      name
      isHost
    }
    orders(
      account: { slug: $accountSlug }
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
          isIncognito
          ... on Individual {
            isGuest
          }
          ...AccountHoverCardFields
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
          isHost
          ... on AccountWithHost {
            bankTransfersHostFeePercent: hostFeePercent(paymentMethodType: MANUAL)
          }
          ...AccountHoverCardFields
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
  ${accountHoverCardFields}
`;

const ORDERS_PER_PAGE = 15;

const isValidStatus = status => {
  return Boolean(ORDER_STATUS[status]);
};

const getVariablesFromQuery = (query, forcedStatus) => {
  const amountRange = parseAmountRange(query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(query.period);
  const searchTerm = query.searchTerm || null;
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || ORDERS_PER_PAGE,
    status: forcedStatus ? forcedStatus : isValidStatus(query.status) ? query.status : null,
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

const OrdersWithData = ({ accountSlug, title, status, showPlatformTip, canCreatePendingOrder }) => {
  const router = useRouter() || { query: {} };
  const intl = useIntl();
  const hasFilters = React.useMemo(() => hasParams(router.query), [router.query]);
  const [showCreatePendingOrderModal, setShowCreatePendingOrderModal] = React.useState(false);
  const queryVariables = { accountSlug, ...getVariablesFromQuery(router.query, status) };
  const queryParams = { variables: queryVariables, context: API_V2_CONTEXT };
  const { data, error, loading, variables, refetch } = useQuery(accountOrdersQuery, queryParams);

  const { LoggedInUser } = useLoggedInUser();
  const prevLoggedInUser = usePrevious(LoggedInUser);
  const isHostAdmin = LoggedInUser?.isAdminOfCollective(data?.account);

  // Refetch data when user logs in
  React.useEffect(() => {
    if (!prevLoggedInUser && LoggedInUser) {
      refetch();
    }
  }, [LoggedInUser]);

  return (
    <Box maxWidth={1000} width="100%" m="0 auto">
      <div className="flex flex-wrap justify-between gap-4">
        <h1 className="text-2xl leading-10 font-bold tracking-tight">
          {title || <FormattedMessage id="FinancialContributions" defaultMessage="Financial Contributions" />}
        </h1>
        <div className="w-[276px]">
          <SearchBar
            height="40px"
            defaultValue={router.query.searchTerm}
            onSubmit={searchTerm => updateQuery(router, { searchTerm, offset: null })}
            placeholder={intl.formatMessage(messages.searchPlaceholder)}
          />
        </div>
      </div>
      <hr className="my-5" />
      <Flex mb={34}>
        <Box flexGrow="1" mr="18px">
          {data?.account ? (
            <OrdersFilters
              currency={data.account.currency}
              filters={router.query}
              onChange={queryParams => updateQuery(router, { ...queryParams, offset: null })}
              hasStatus={!status}
            />
          ) : loading ? (
            <LoadingPlaceholder height={70} />
          ) : null}
        </Box>
        {isHostAdmin && canCreatePendingOrder && (
          <React.Fragment>
            <StyledButton
              onClick={() => setShowCreatePendingOrderModal(true)}
              buttonSize="small"
              buttonStyle="primary"
              height="38px"
              lineHeight="12px"
              mt="17px"
              data-cy="create-pending-contribution"
            >
              <FormattedMessage id="create" defaultMessage="Create" />
              &nbsp;+
            </StyledButton>
            {showCreatePendingOrderModal && (
              <CreatePendingOrderModal
                hostSlug={data.account.slug}
                onClose={() => setShowCreatePendingOrderModal(false)}
                onSuccess={() => refetch()}
              />
            )}
          </React.Fragment>
        )}
      </Flex>
      {Boolean(data?.account?.isHost && isHostAdmin) && <DisputedContributionsWarning hostSlug={accountSlug} />}
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
            showPlatformTip={showPlatformTip}
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

OrdersWithData.propTypes = {
  accountSlug: PropTypes.string.isRequired,
  /** If provided, only orders matching this status will be fetched */
  status: PropTypes.string,
  /** An optional title to be used instead of "Financial contributions" */
  title: PropTypes.node,
  showPlatformTip: PropTypes.bool,
  canCreatePendingOrder: PropTypes.bool,
};

export default OrdersWithData;
