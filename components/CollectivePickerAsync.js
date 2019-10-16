import React from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery } from 'react-apollo';
import { throttle } from 'lodash';

import { CollectiveType } from '../lib/constants/collectives';
import CollectivePicker from './CollectivePicker';
import gql from 'graphql-tag';

const SEARCH_COLLECTIVES = gql`
  query SearchCollective($term: String!, $types: [TypeOfCollective], $limit: Int, $hostCollectiveIds: [Int]) {
    search(term: $term, types: $types, limit: $limit, hostCollectiveIds: $hostCollectiveIds, useAlgolia: false) {
      id
      collectives {
        id
        type
        slug
        name
        imageUrl(height: 64)
      }
    }
  }
`;

/** Throttle search function to limit invocations while typing */
const throttledSearch = throttle((searchFunc, variables) => {
  return searchFunc({ variables });
}, 500);

/**
 * A specialization of `CollectivePicker` that fetches the data based on user search.
 */
const CollectivePickerAsync = ({ types, limit, hostCollectiveIds, preload, ...props }) => {
  const [searchCollectives, { loading, data }] = useLazyQuery(SEARCH_COLLECTIVES);
  const collectives = (data && data.search && data.search.collectives) || [];
  const search = term => throttledSearch(searchCollectives, { term, types, limit, hostCollectiveIds });

  // If preload is true, trigger a first query on mount or when one of the query param changes
  React.useEffect(() => {
    if (preload) {
      search('');
    }
  }, [types, limit, hostCollectiveIds]);

  return (
    <CollectivePicker
      isLoading={loading}
      collectives={collectives}
      groupByType={!types || types.length > 1}
      filterOption={() => true /** Filtering is done by the API */}
      sortFunc={collectives => collectives /** Already sorted by the API */}
      onInputChange={(term, { action }) => {
        if (action === 'input-change') {
          return search(term.trim());
        }
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
};

CollectivePickerAsync.defaultProps = {
  preload: false,
  limit: 20,
};

export default CollectivePickerAsync;
