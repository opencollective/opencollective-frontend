import React from 'react';
import { useLazyQuery } from '@apollo/client';
import { debounce } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { API_V1_CONTEXT, gqlV1 } from '../lib/graphql/helpers';
import formatCollectiveType from '../lib/i18n/collective-type';

import CollectivePicker from './CollectivePicker';

const collectivePickerSearchQuery = gqlV1 /* GraphQL */ `
  query CollectivePickerSearch(
    $term: String!
    $types: [TypeOfCollective]
    $limit: Int
    $hostCollectiveIds: [Int]
    $parentCollectiveIds: [Int]
    $skipGuests: Boolean
    $includeArchived: Boolean
    $includeVendorsForHostId: Int
    $vendorVisibleToAccountIds: [Int]
  ) {
    search(
      term: $term
      types: $types
      limit: $limit
      hostCollectiveIds: $hostCollectiveIds
      parentCollectiveIds: $parentCollectiveIds
      skipGuests: $skipGuests
      includeArchived: $includeArchived
      includeVendorsForHostId: $includeVendorsForHostId
      vendorVisibleToAccountIds: $vendorVisibleToAccountIds
    ) {
      id
      collectives {
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
        hostFeePercent
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
        ... on User {
          isTwoFactorAuthEnabled
        }
        ... on Organization {
          isTrustedHost
        }
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
const getPlaceholder = (intl, types, { useBeneficiaryForVendor } = {}) => {
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
 * A specialization of `CollectivePicker` that fetches the data based on user search.
 */
const CollectivePickerAsync = ({
  inputId,
  types = undefined,
  limit = 20,
  hostCollectiveIds = undefined,
  parentCollectiveIds = undefined,
  preload = false,
  filterResults = undefined,
  searchQuery = collectivePickerSearchQuery,
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
  const [searchCollectives, { loading, data }] = useLazyQuery(searchQuery, { context: API_V1_CONTEXT, fetchPolicy });
  const [term, setTerm] = React.useState(null);
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

  // Combine API results with defaultCollectives
  const collectives = React.useMemo(() => {
    // If we have search results, use them
    if ((term || preload) && data?.search?.collectives) {
      const apiResults = [...data.search.collectives];

      // When loading is complete, we only need unique collectives
      if (!loading && filteredDefaultCollectives.length > 0) {
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
  }, [term, preload, data, loading, filteredDefaultCollectives]);

  const filteredCollectives = filterResults ? filterResults(collectives) : collectives;
  const placeholder = getPlaceholder(intl, types, { useBeneficiaryForVendor });

  // If preload is true, trigger a first query on mount or when one of the query param changes
  React.useEffect(() => {
    if (term || preload) {
      throttledSearch(searchCollectives, {
        term: term || '',
        types,
        limit,
        hostCollectiveIds,
        parentCollectiveIds,
        skipGuests,
        includeArchived,
        includeVendorsForHostId,
        vendorVisibleToAccountIds,
      });
    }
  }, [types, limit, hostCollectiveIds, parentCollectiveIds, vendorVisibleToAccountIds, term]);

  return (
    <CollectivePicker
      inputId={inputId}
      isLoading={Boolean(loading || isLoading)}
      collectives={filteredCollectives}
      groupByType={!types || types.length > 1}
      filterOption={() => true /** Filtering is done by the API */}
      sortFunc={collectives => collectives /** Already sorted by the API */}
      placeholder={placeholder}
      types={types}
      useSearchIcon={true}
      isSearchable
      // Only displays the invite option if no results were found:
      invitable={invitable}
      onInputChange={newTerm => {
        setTerm(newTerm.trim());
      }}
      customOptions={!term ? emptyCustomOptions : []}
      useBeneficiaryForVendor={useBeneficiaryForVendor}
      {...props}
    />
  );
};

export default CollectivePickerAsync;
