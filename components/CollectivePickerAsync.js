import React from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery } from 'react-apollo';
import { throttle } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import CollectivePicker from './CollectivePicker';
import gql from 'graphql-tag';

const DEFAULT_SEARCH_QUERY = gql`
  query SearchCollective($term: String!, $types: [TypeOfCollective], $limit: Int, $hostCollectiveIds: [Int]) {
    search(term: $term, types: $types, limit: $limit, hostCollectiveIds: $hostCollectiveIds, useAlgolia: false) {
      id
      collectives {
        id
        type
        slug
        name
        currency
        imageUrl(height: 64)
        hostFeePercent
      }
    }
  }
`;

/** Throttle search function to limit invocations while typing */
const throttledSearch = throttle((searchFunc, variables) => {
  return searchFunc({ variables });
}, 500);

const getNoOptionsMessage = (term, preload) => {
  if (!term && !preload) {
    // eslint-disable-next-line react/display-name
    return () => <FormattedMessage id="TypeToStartSearch" defaultMessage="Type something to start searching" />;
  } else {
    return undefined; // Use default message
  }
};

/**
 * A specialization of `CollectivePicker` that fetches the data based on user search.
 */
const CollectivePickerAsync = ({ types, limit, hostCollectiveIds, preload, searchQuery, ...props }) => {
  const [searchCollectives, { loading, data }] = useLazyQuery(searchQuery);
  const [term, setTerm] = React.useState(null);
  const collectives = (data && data.search && data.search.collectives) || [];

  // If preload is true, trigger a first query on mount or when one of the query param changes
  React.useEffect(() => {
    if (term || preload) {
      throttledSearch(searchCollectives, { term, types, limit, hostCollectiveIds });
    }
  }, [types, limit, hostCollectiveIds, term]);

  return (
    <CollectivePicker
      isLoading={loading}
      collectives={collectives}
      groupByType={!types || types.length > 1}
      filterOption={() => true /** Filtering is done by the API */}
      sortFunc={collectives => collectives /** Already sorted by the API */}
      noOptionsMessage={getNoOptionsMessage(term, preload)}
      onInputChange={newTerm => {
        setTerm(newTerm.trim());
      }}
      {...props}
    />
  );
};

CollectivePickerAsync.propTypes = {
  /** The types of collectives to retrieve */
  types: PropTypes.arrayOf(PropTypes.oneOf(Object.values(CollectiveType))),
  /** Whether we should group collectives by type. By default, this is true when there's more than one type */
  groupByType: PropTypes.bool,
  /** Max number of collectives displayed at the same time */
  limit: PropTypes.number,
  /** If set, only the collectives under this host will be retrieved */
  hostCollectiveIds: PropTypes.arrayOf(PropTypes.number),
  /** If true, a query will be triggered even if search is empty */
  preload: PropTypes.bool,
  /** Query to use for the search. Override to add custom fields */
  searchQuery: PropTypes.any.isRequired,
};

CollectivePickerAsync.defaultProps = {
  preload: false,
  limit: 20,
  searchQuery: DEFAULT_SEARCH_QUERY,
};

export default CollectivePickerAsync;
