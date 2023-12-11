import React from 'react';
import PropTypes from 'prop-types';
import { gql, useLazyQuery } from '@apollo/client';
import { debounce } from 'lodash';
import { FormattedDate } from 'react-intl';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import Avatar from './Avatar';
import { Flex } from './Grid';
import StyledSelect from './StyledSelect';
import StyledTag from './StyledTag';
import { Span } from './Text';

const ordersSearchQuery = gql`
  query OrdersPickerSearchQuery(
    $account: AccountReferenceInput
    $includeIncognito: Boolean
    $filter: AccountOrdersFilter
    $searchTerm: String
  ) {
    orders(
      account: $account
      filter: $filter
      limit: 100
      includeIncognito: $includeIncognito
      searchTerm: $searchTerm
    ) {
      nodes {
        id
        legacyId
        description
        createdAt
        amount {
          valueInCents
          currency
        }
        fromAccount {
          id
          name
          slug
          isIncognito
          imageUrl(height: 48)
          ... on Individual {
            isGuest
          }
        }
        toAccount {
          id
          slug
          name
        }
        tier {
          id
          legacyId
          slug
          name
        }
      }
    }
  }
`;

const getOptionsFromOrders = orders => {
  if (!orders?.length) {
    return [];
  } else {
    return orders.map(order => ({
      value: order,
      label: `#${order.legacyId} - ${order.description}`,
    }));
  }
};

/** Throttle search function to limit invocations while typing */
const throttledSearch = debounce((searchFunc, variables) => {
  return searchFunc({ variables });
}, 750);

const getAccountInput = account => {
  if (!account) {
    return null;
  } else if (typeof account.id === 'string') {
    return { id: account.id };
  } else if (typeof account.id === 'number') {
    return { legacyId: account.id };
  } else if (typeof account.legacyId === 'number') {
    return { legacyId: account.legacyId };
  } else {
    return { slug: account.slug };
  }
};

const formatOptionLabel = option => {
  return (
    <Flex alignItems="center">
      <Avatar collective={option.value.fromAccount} size={24} />
      <StyledTag ml={2} fontSize="11px">
        #{option.value.legacyId}
      </StyledTag>
      <Span fontSize="12px" ml={2}>
        <FormattedDate value={option.value.createdAt} /> - {option.value.description}
      </Span>
    </Flex>
  );
};

/**
 * A specialization of `CollectivePicker` that fetches the data based on user search.
 */
const OrdersPickerAsync = ({ inputId, noCache, account, filter, includeIncognito, ...props }) => {
  const fetchPolicy = noCache ? 'network-only' : undefined;
  const variables = { includeIncognito, filter, account: getAccountInput(account) };
  const queryParameters = { fetchPolicy, variables, context: API_V2_CONTEXT };
  const [searchOrders, { loading, data }] = useLazyQuery(ordersSearchQuery, queryParameters);
  const [searchTerm, setSearchTerm] = React.useState('');
  const options = React.useMemo(() => getOptionsFromOrders(data?.orders?.nodes), [data?.orders?.nodes]);

  // If preload is true, trigger a first query on mount or when one of the query param changes
  React.useEffect(() => {
    if (account) {
      throttledSearch(searchOrders, { searchTerm });
    }
  }, [account, searchTerm]);

  return (
    <StyledSelect
      inputId={inputId}
      isLoading={loading}
      useSearchIcon={true}
      options={options}
      filterOption={() => true /** Filtering is done by the API */}
      onInputChange={newTerm => setSearchTerm(newTerm.trim())}
      formatOptionLabel={formatOptionLabel}
      {...props}
    />
  );
};

OrdersPickerAsync.propTypes = {
  /** The id of the search input */
  inputId: PropTypes.string.isRequired,
  /** Max number of collectives displayed at the same time */
  limit: PropTypes.number,
  /** If set, only the collectives under this host will be retrieved */
  hostCollectiveIds: PropTypes.arrayOf(PropTypes.number),
  /** If true, a query will be triggered even if search is empty */
  preload: PropTypes.bool,
  /** If true, results won't be cached (Apollo "network-only" mode) */
  noCache: PropTypes.bool,
  includeIncognito: PropTypes.bool,
  filter: PropTypes.oneOf(['OUTGOING', 'INCOMING']),
  account: PropTypes.object,
};

OrdersPickerAsync.defaultProps = {};

export default OrdersPickerAsync;
