import React from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { debounce } from 'lodash';
import { defineMessages, useIntl } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { CollectivePickerV2SearchQueryQueryVariables } from '../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../lib/i18n/collective-type';

import CollectivePicker from './CollectivePicker';

const collectivePickerSearchQuery = gql`
  query CollectivePickerV2SearchQuery(
    $term: String!
    $types: [AccountType]
    $limit: Int
    $hosts: [AccountReferenceInput]
    $parents: [AccountReferenceInput]
    $skipGuests: Boolean
    $includeArchived: Boolean
    $includeVendorsForHost: AccountReferenceInput
  ) {
    accounts(
      searchTerm: $term
      type: $types
      limit: $limit
      host: $hosts
      parent: $parents
      skipGuests: $skipGuests
      includeArchived: $includeArchived
      includeVendorsForHost: $includeVendorsForHost
    ) {
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
        isActive
        isArchived
        isHost
        ... on Individual {
          hasTwoFactorAuth
        }
        ... on Host {
          isTrustedHost
          hostFeePercent
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

type CollectivePickerAsyncProps = CollectivePickerV2SearchQueryQueryVariables & {
  inputId?: string;
  limit?: number;
  preload?: boolean;
  filterResults?: (collectives: any[]) => any[];
  searchQuery?: any;
  invitable?: boolean;
  emptyCustomOptions?: any[];
  noCache?: boolean;
  isLoading?: boolean;
  skipGuests?: boolean;
  includeArchived?: boolean;
};

/**
 * A specialization of `CollectivePicker` that fetches the data based on user search.
 */
const CollectivePickerAsync = ({
  inputId,
  types = undefined,
  limit = 20,
  hosts = undefined,
  parents = undefined,
  preload = false,
  filterResults = undefined,
  searchQuery = collectivePickerSearchQuery,
  invitable = false,
  emptyCustomOptions = [],
  noCache = false,
  isLoading = false,
  skipGuests = true,
  includeArchived = false,
  includeVendorsForHost = undefined,
  ...props
}: CollectivePickerAsyncProps) => {
  const fetchPolicy = noCache ? 'network-only' : undefined;
  const [search, { loading, data }] = useLazyQuery(searchQuery, { fetchPolicy, context: API_V2_CONTEXT });
  const [term, setTerm] = React.useState(null);
  const intl = useIntl();
  const accounts = ((term || preload) && data?.accounts?.nodes) || [];
  const filteredAccounts = filterResults ? filterResults(accounts) : accounts;
  const placeholder = getPlaceholder(intl, types);

  // If preload is true, trigger a first query on mount or when one of the query param changes
  React.useEffect(() => {
    if (term || preload) {
      throttledSearch(search, {
        term: term || '',
        types,
        limit,
        hosts,
        parents,
        skipGuests,
        includeArchived,
        includeVendorsForHost,
      });
    }
  }, [types, limit, hosts, parents, term]);

  return (
    <CollectivePicker
      inputId={inputId}
      isLoading={Boolean(loading || isLoading)}
      collectives={filteredAccounts}
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

export default CollectivePickerAsync;
