import React from 'react';

const DEFAULT_OPTIONS = {
  /** Defines the percentage of items actually displayed */
  percentageDisplayed: 0.5,
};

/**
 * An helper to work with dynamic paginated lists coming from GraphQL, intended to reduce
 * the load on server by loading a bigger batches at the start and updating the list in cache manually.
 */
export const useLazyGraphQLPaginatedResults = (query, key, options = DEFAULT_OPTIONS) => {
  const allOptions = { ...DEFAULT_OPTIONS, ...options };
  const limit = query?.variables?.limit || 0;
  const results = query?.data?.[key];
  const nbItemsDisplayed = limit * allOptions.percentageDisplayed;
  const resultsCount = results?.nodes?.length || 0;

  // Refetch when the number of items go below the threshold
  React.useEffect(() => {
    if (results && !query.loading && resultsCount <= nbItemsDisplayed && resultsCount < results.totalCount) {
      query.refetch();
    }
  }, [query?.loading, resultsCount, nbItemsDisplayed]);

  if (!results) {
    return {
      nodes: [],
      totalCount: 0,
      offset: 0,
      limit: nbItemsDisplayed,
    };
  }

  return {
    offset: query.variables.offset,
    limit: nbItemsDisplayed,
    totalCount: results.totalCount,
    nodes: results.nodes.slice(0, nbItemsDisplayed),
  };
};
