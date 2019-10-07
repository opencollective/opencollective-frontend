import React from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery } from 'react-apollo';
import { throttle } from 'lodash';

import { CollectiveType } from '../lib/constants/collectives';
import CollectivePicker from './CollectivePicker';
import gql from 'graphql-tag';

const SEARCH_COLLECTIVES = gql`
  query SearchCollective($term: String!, $types: [TypeOfCollective], $limit: Int) {
    search(term: $term, types: $types, limit: $limit, useAlgolia: false) {
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
const CollectivePickerAsync = ({ types, limit, ...props }) => {
  const [searchCollectives, { loading, data }] = useLazyQuery(SEARCH_COLLECTIVES);
  const collectives = (data && data.search && data.search.collectives) || [];
  return (
    <CollectivePicker
      isLoading={loading}
      collectives={collectives}
      groupByType={!types || types.length > 1}
      filterOption={() => true /** Filtering is done by the API */}
      sortFunc={collectives => collectives /** Already sorted by the API */}
      onInputChange={(term, { action }) => {
        if (action === 'input-change') {
          return throttledSearch(searchCollectives, { term: term.trim(), types, limit });
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
};

CollectivePickerAsync.defaultProps = {
  cacheOptions: true,
  limit: 20,
};

export default CollectivePickerAsync;
