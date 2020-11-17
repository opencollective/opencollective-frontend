import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { mapValues } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import { parseAmountRange } from '../budget/filters/AmountFilter';
import { getDateRangeFromPeriod } from '../budget/filters/PeriodFilter';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import OrdersFilters from '../orders/OrdersFilters';
import OrdersList from '../orders/OrdersList';
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';
import StyledHr from '../StyledHr';
import { H1 } from '../Text';

const hostDashboardOrdersQuery = gqlV2/* GraphQL */ `
  query HostDashboardOrders(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $status: OrderStatus
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: ISODateTime
    $searchTerm: String
  ) {
    host(slug: $hostSlug) {
      id
      slug
      currency
    }
    orders(
      host: { slug: $hostSlug }
      filter: INCOMING
      status: $status
      searchTerm: $searchTerm
      limit: $limit
      offset: $offset
      dateFrom: $dateFrom
      minAmount: $minAmount
      maxAmount: $maxAmount
    ) {
      totalCount
      nodes {
        id
        description
        createdAt
        status
        amount {
          valueInCents
        }
        paymentMethod {
          id
          providerType
        }
        fromAccount {
          id
          slug
          name
          imageUrl
        }
        toAccount {
          id
          slug
          name
          imageUrl
        }
        permissions {
          canMarkAsExpired
          canMarkAsPaid
        }
      }
    }
  }
`;

const ORDERS_PER_PAGE = 15;

const isValidStatus = status => {
  return Boolean(ORDER_STATUS[status]);
};

const getVariablesFromQuery = query => {
  const amountRange = parseAmountRange(query.amount);
  const [dateFrom] = getDateRangeFromPeriod(query.period);
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || ORDERS_PER_PAGE,
    status: isValidStatus(query.status) ? query.status : null,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    dateFrom,
    searchTerm: query.searchTerm,
  };
};

const hasParams = query => {
  return Object.entries(query).some(([key, value]) => {
    return !['view', 'offset', 'limit', 'hostCollectiveSlug', 'paypalApprovalError'].includes(key) && value;
  });
};

const HostDashboardOrders = ({ hostSlug }) => {
  const { query } = useRouter() || {};
  const hasFilters = React.useMemo(() => hasParams(query), [query]);
  const { data, error, loading, variables } = useQuery(hostDashboardOrdersQuery, {
    variables: { hostSlug, ...getVariablesFromQuery(query) },
    context: API_V2_CONTEXT,
  });

  return (
    <Box maxWidth={1000} m="0 auto" py={5} px={2}>
      <Flex>
        <H1 fontSize="32px" lineHeight="40px" mb={24} py={2} fontWeight="normal">
          <FormattedMessage id="Orders" defaultMessage="Orders" />
        </H1>
        <Box mx="auto" />
        <Box p={2}>
          <SearchBar
            defaultValue={query.searchTerm}
            onSubmit={searchTerm => Router.pushRoute('host.dashboard', { ...query, searchTerm, offset: null })}
          />
        </Box>
      </Flex>
      <StyledHr mb={26} borderWidth="0.5px" borderColor="black.300" />
      <Box mb={34} maxWidth={500}>
        {data?.host ? (
          <OrdersFilters
            collective={data.host}
            filters={query}
            onChange={queryParams =>
              Router.pushRoute('host.dashboard', {
                ...query,
                ...queryParams,
                offset: null,
              })
            }
          />
        ) : loading ? (
          <LoadingPlaceholder height={70} />
        ) : null}
      </Box>
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !data.orders?.nodes.length ? (
        <MessageBox type="info" withIcon data-cy="zero-order-message">
          {hasFilters ? (
            <FormattedMessage
              id="OrdersList.Empty"
              defaultMessage="No order matches the given filters, <ResetLink>reset them</ResetLink> to see all orders."
              values={{
                ResetLink(text) {
                  return (
                    <Link
                      data-cy="reset-orders-filters"
                      route="host.dashboard"
                      params={{
                        ...mapValues(query, () => null),
                        hostCollectiveSlug: data.host.slug,
                        view: 'donations',
                      }}
                    >
                      {text}
                    </Link>
                  );
                },
              }}
            />
          ) : (
            <FormattedMessage id="orders.empty" defaultMessage="No orders" />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          <OrdersList isLoading={loading} orders={data?.orders?.nodes} nbPlaceholders={variables.limit} />
          <Flex mt={5} justifyContent="center">
            <Pagination
              route="host.dashboard"
              total={data?.orders?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              scrollToTopOnChange
            />
          </Flex>
        </React.Fragment>
      )}
    </Box>
  );
};

HostDashboardOrders.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default HostDashboardOrders;
