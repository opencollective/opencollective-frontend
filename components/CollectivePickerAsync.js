import React from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery } from '@apollo/client';
import { debounce } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { gqlV1 } from '../lib/graphql/helpers';
import formatCollectiveType from '../lib/i18n/collective-type';

import CollectivePicker from './CollectivePicker';

const collectivePickerSearchQuery = gqlV1/* GraphQL */ `
  query CollectivePickerSearch(
    $term: String!
    $types: [TypeOfCollective]
    $limit: Int
    $hostCollectiveIds: [Int]
    $parentCollectiveIds: [Int]
    $skipGuests: Boolean
    $includeArchived: Boolean
    $includeVendorsForHostId: Int
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
  },
});

/**
 * If a single type is selected, will return a label like: `Search for users`
 * Otherwise it just returns `Search`
 */
const getPlaceholder = (intl, types) => {
  const nbTypes = types ? types.length : 0;
  if (nbTypes === 0 || nbTypes > 3) {
    return intl.formatMessage(Messages.search);
  } else if (nbTypes === 1) {
    if (types[0] === CollectiveType.USER) {
      return intl.formatMessage(Messages.searchForUsers);
    } else {
      return intl.formatMessage(Messages.searchForType, { entity: formatCollectiveType(intl, types[0], 100) });
    }
  } else {
    // Format by passing a map of entities like { entity1: 'Collectives' }
    return intl.formatMessage(
      Messages[`searchForType_${nbTypes}`],
      types.reduce((i18nParams, type, index) => {
        i18nParams[`entity${index + 1}`] = formatCollectiveType(intl, type, 100);
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
  ...props
}) => {
  const fetchPolicy = noCache ? 'network-only' : undefined;
  const [searchCollectives, { loading, data }] = useLazyQuery(searchQuery, { fetchPolicy });
  const [term, setTerm] = React.useState(null);
  const intl = useIntl();
  const collectives = ((term || preload) && data?.search?.collectives) || [];
  const filteredCollectives = filterResults ? filterResults(collectives) : collectives;
  const placeholder = getPlaceholder(intl, types);

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
      });
    }
  }, [types, limit, hostCollectiveIds, parentCollectiveIds, term]);

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
      {...props}
    />
  );
};

CollectivePickerAsync.propTypes = {
  ...CollectivePicker.propTypes,
  /** The id of the search input */
  inputId: PropTypes.string.isRequired,
  /** The types of collectives to retrieve */
  types: PropTypes.arrayOf(PropTypes.oneOf(Object.values(CollectiveType))),
  /** Whether we should group collectives by type. By default, this is true when there's more than one type */
  groupByType: PropTypes.bool,
  /** Max number of collectives displayed at the same time */
  limit: PropTypes.number,
  /** If set, only the collectives under this host will be retrieved */
  hostCollectiveIds: PropTypes.arrayOf(PropTypes.number),
  /** If set, only the collectives under this parent collective will be retrieved */
  parentCollectiveIds: PropTypes.arrayOf(PropTypes.number),
  /** If true, a query will be triggered even if search is empty */
  preload: PropTypes.bool,
  /** If true, results won't be cached (Apollo "network-only" mode) */
  noCache: PropTypes.bool,
  /** Query to use for the search. Override to add custom fields */
  searchQuery: PropTypes.any,
  /** Custom options that are displayed when the field is empty */
  emptyCustomOptions: PropTypes.any,
  /** Function to filter results returned by the API */
  filterResults: PropTypes.func,
  /** If true, a permanent option to create a collective will be displayed in the select */
  creatable: PropTypes.bool,
  /** If true, a permanent option to invite a new user will be displayed in the select */
  invitable: PropTypes.bool,
  skipGuests: PropTypes.bool,
  onInvite: PropTypes.func,
  /** Include archived collectives **/
  includeArchived: PropTypes.bool,
  /** Include vendors for the given host id**/
  includeVendorsForHostId: PropTypes.number,
};

export default CollectivePickerAsync;
