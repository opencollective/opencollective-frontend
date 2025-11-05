import React from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { debounce } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import formatCollectiveType from '../lib/i18n/collective-type';

import AccountPicker from './AccountPicker';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';

const accountPickerSearchQuery = gql`
  query AccountPickerSearch(
    $term: String!
    $types: [AccountType]
    $limit: Int
    $offset: Int
    $host: [AccountReferenceInput]
    $parent: [AccountReferenceInput]
    $skipGuests: Boolean
    $includeArchived: Boolean
    $includeVendorsForHost: AccountReferenceInput # $vendorVisibleToAccountIds: [Int]
  ) {
    accounts(
      searchTerm: $term
      type: $types
      limit: $limit
      offset: $offset
      host: $host
      parent: $parent
      skipGuests: $skipGuests
      includeArchived: $includeArchived
      includeVendorsForHost: $includeVendorsForHost #   vendorVisibleToAccountIds: $vendorVisibleToAccountIds
    ) {
      totalCount
      nodes {
        id
        type
        slug
        name
        currency
        location {
          id
          address
          country
        }
        imageUrl(height: 64)
        # hostFeePercent

        isActive
        isArchived
        isHost
        ... on Vendor {
          hasPayoutMethod
          visibleToAccounts {
            id
            slug
            name
          }
        }
        ... on Individual {
          hasTwoFactorAuth
        }
        # ... on Organization {
        #   isTrustedHost
        # }
      }
    }
  }
`;

/** Throttle search function to limit invocations while typing */
const throttledSearch = debounce((searchFunc, variables) => {
  return searchFunc({ variables });
}, 750);

const Messages = defineMessages({
  searchForType: {
    id: 'SearchFor',
    defaultMessage: 'Search for {entity}',
  },
  // eslint-disable-next-line camelcase
  searchForType_2: {
    id: 'SearchFor2',
    defaultMessage: 'Search for {entity1} or {entity2}',
  },
  // eslint-disable-next-line camelcase
  searchForType_3: {
    id: 'SearchFor3',
    defaultMessage: 'Search for {entity1}, {entity2} or {entity3}',
  },
  search: {
    id: 'Search',
    defaultMessage: 'Search',
  },
  searchForUsers: {
    defaultMessage: 'Search for Users by name or email',
    id: 'xLF0/9',
  },
});

/**
 * If a single type is selected, will return a label like: `Search for users`
 * Otherwise it just returns `Search`
 */
const getPlaceholder = (intl, types, options: { useBeneficiaryForVendor?: boolean } = {}) => {
  const { useBeneficiaryForVendor } = options;
  const nbTypes = types ? types.length : 0;
  if (nbTypes === 0 || nbTypes > 3) {
    return intl.formatMessage(Messages.search);
  } else if (nbTypes === 1) {
    if (types[0] === CollectiveType.USER) {
      return intl.formatMessage(Messages.searchForUsers);
    } else {
      return intl.formatMessage(Messages.searchForType, {
        entity: formatCollectiveType(intl, types[0], 100, { useBeneficiaryForVendor }),
      });
    }
  } else {
    // Format by passing a map of entities like { entity1: 'Collectives' }
    return intl.formatMessage(
      Messages[`searchForType_${nbTypes}`],
      types.reduce((i18nParams, type, index) => {
        i18nParams[`entity${index + 1}`] = formatCollectiveType(intl, type, 100, { useBeneficiaryForVendor });
        return i18nParams;
      }, {}),
    );
  }
};

/**
 * A specialization of `AccountPicker` that fetches the data based on user search.
 */
const AccountPickerAsync = ({
  inputId,
  types = undefined,
  limit = 20,
  hostCollectiveIds = undefined,
  parentCollectiveIds = undefined,
  preload = false,
  filterResults = undefined,
  searchQuery = accountPickerSearchQuery,
  invitable = false,
  emptyCustomOptions = [],
  noCache = false,
  isLoading = false,
  skipGuests = true,
  includeArchived = false,
  includeVendorsForHostId = undefined,
  defaultCollectives = undefined,
  vendorVisibleToAccountIds = undefined,
  useBeneficiaryForVendor = false,
  ...props
}) => {
  const fetchPolicy = noCache ? 'network-only' : undefined;
  const [searchCollectives, { loading, data, fetchMore }] = useLazyQuery(searchQuery, {
    fetchPolicy,
    context: API_V2_CONTEXT,
  });
  const [term, setTerm] = React.useState(null);
  const [allCollectives, setAllCollectives] = React.useState([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const intl = useIntl();

  // Filter defaultCollectives by term if provided
  const filteredDefaultCollectives = React.useMemo(() => {
    if (!defaultCollectives) {
      return [];
    }

    if (!term) {
      return defaultCollectives;
    }

    const normalizedTerm = term.toLowerCase();
    return defaultCollectives.filter(
      c => c.name?.toLowerCase().includes(normalizedTerm) || c.slug?.toLowerCase().includes(normalizedTerm),
    );
  }, [defaultCollectives, term]);

  // Update accumulated collectives when data changes
  React.useEffect(() => {
    if (data?.accounts?.nodes) {
      const totalCount = data.accounts.totalCount;
      const currentNodes = data.accounts.nodes;

      // Check if we have more data to load
      setHasMore(currentNodes.length < totalCount);
      setAllCollectives(currentNodes);
    }
  }, [data]);

  // Combine API results with defaultCollectives
  const collectives = React.useMemo(() => {
    // If we have search results, use them
    if ((term || preload) && allCollectives.length > 0) {
      const apiResults = [...allCollectives];

      // When loading is complete, we only need unique collectives
      if (!loading && !isLoadingMore && filteredDefaultCollectives.length > 0) {
        const apiResultIds = new Set(apiResults.map(c => c.id));
        // Add default collectives that aren't already in the results
        filteredDefaultCollectives.forEach(c => {
          if (!apiResultIds.has(c.id)) {
            apiResults.push(c);
          }
        });
      }

      return apiResults;
    }

    // When no search or results yet, show default collectives
    return filteredDefaultCollectives;
  }, [term, preload, allCollectives, loading, isLoadingMore, filteredDefaultCollectives]);

  const filteredCollectives = filterResults ? filterResults(collectives) : collectives;
  const placeholder = getPlaceholder(intl, types, { useBeneficiaryForVendor });

  // Function to load more results
  const loadMoreResults = React.useCallback(() => {
    if (!hasMore || isLoadingMore || loading) {
      return;
    }
    console.log('loadMoreResults');

    setIsLoadingMore(true);

    fetchMore({
      variables: {
        term: term || '',
        types,
        limit,
        offset: allCollectives.length,
        host: hostCollectiveIds?.map(id => ({ id })),
        parent: parentCollectiveIds?.map(id => ({ id })),
        skipGuests,
        includeArchived,
        includeVendorsForHost: includeVendorsForHostId ? { id: includeVendorsForHostId } : undefined,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        setIsLoadingMore(false);

        if (!fetchMoreResult) {
          return prev;
        }

        const newNodes = fetchMoreResult.accounts.nodes;
        const totalCount = fetchMoreResult.accounts.totalCount;

        // Merge previous and new results
        const mergedNodes = [...(prev.accounts?.nodes || []), ...newNodes];

        // Check if we have more data to load
        setHasMore(mergedNodes.length < totalCount);
        setAllCollectives(mergedNodes);

        return {
          accounts: {
            ...fetchMoreResult.accounts,
            nodes: mergedNodes,
          },
        };
      },
    }).catch(error => {
      console.error('Error loading more results:', error);
      setIsLoadingMore(false);
    });
  }, [
    hasMore,
    isLoadingMore,
    loading,
    fetchMore,
    term,
    types,
    limit,
    allCollectives.length,
    hostCollectiveIds,
    parentCollectiveIds,
    skipGuests,
    includeArchived,
    includeVendorsForHostId,
  ]);

  console.log({ loading, loadMoreResults, isLoadingMore });

  // If preload is true, trigger a first query on mount or when one of the query param changes
  React.useEffect(() => {
    if (term || preload) {
      // Reset state on new search
      setAllCollectives([]);
      setHasMore(true);

      throttledSearch(searchCollectives, {
        term: term || '',
        types,
        limit,
        offset: 0,
        host: hostCollectiveIds?.map(id => ({ id })),
        parent: parentCollectiveIds?.map(id => ({ id })),
        skipGuests,
        includeArchived,
        includeVendorsForHost: includeVendorsForHostId ? { id: includeVendorsForHostId } : undefined,
        // vendorVisibleToAccountIds, // Commented out as per the query
      });
    }
  }, [types, limit, hostCollectiveIds, parentCollectiveIds, vendorVisibleToAccountIds, term]);

  return (
    <AccountPicker
      inputId={inputId}
      isLoading={Boolean(loading || isLoading)}
      isLoadingMoreResults={isLoadingMore}
      collectives={filteredCollectives}
      groupByType={!types || types.length > 1}
      sortFunc={collectives => collectives /** Already sorted by the API */}
      placeholder={placeholder}
      types={types}
      isSearchable
      // Only displays the invite option if no results were found:
      invitable={invitable}
      onInputChange={newTerm => {
        setTerm(newTerm.trim());
      }}
      customOptions={!term ? emptyCustomOptions : []}
      useBeneficiaryForVendor={useBeneficiaryForVendor}
      onMenuScrollToBottom={hasMore ? loadMoreResults : undefined}
      {...props}
    />
  );
};

export default AccountPickerAsync;
