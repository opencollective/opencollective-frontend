import React from 'react';

type PaginatedResults<TNode> = { nodes?: TNode[]; totalCount?: number };

type LazyPaginatedQuery = {
  variables?: { limit?: number; offset?: number };
  data?: Record<string, unknown>;
  loading?: boolean;
  refetch?: () => void;
};

const DEFAULT_OPTIONS = {
  /** Defines the percentage of items actually displayed */
  percentageDisplayed: 0.5,
};

/**
 * An helper to work with dynamic paginated lists coming from GraphQL, intended to reduce
 * the load on server by loading a bigger batches at the start and updating the list in cache manually.
 */
export const useLazyGraphQLPaginatedResults = <TNode = never>(
  query: LazyPaginatedQuery,
  key: string,
  options: { percentageDisplayed?: number } = DEFAULT_OPTIONS,
) => {
  const allOptions = { ...DEFAULT_OPTIONS, ...options };
  const limit = query?.variables?.limit || 0;
  const results: PaginatedResults<TNode> = query?.data?.[key] as PaginatedResults<TNode>;
  const nbItemsDisplayed = limit * allOptions.percentageDisplayed;
  const resultsCount = results?.nodes?.length || 0;
  const nodes = React.useMemo(() => results?.nodes?.slice(0, nbItemsDisplayed) || [], [results, nbItemsDisplayed]);

  // Refetch when the number of items go below the threshold
  React.useEffect(() => {
    if (results && !query.loading && resultsCount <= nbItemsDisplayed && resultsCount < results.totalCount) {
      query.refetch();
    }
  }, [query?.loading, resultsCount, nbItemsDisplayed]);

  if (!results) {
    return {
      nodes,
      totalCount: 0,
      offset: 0,
      limit: nbItemsDisplayed,
    };
  }

  return {
    offset: query.variables.offset,
    limit: nbItemsDisplayed,
    totalCount: results.totalCount,
    nodes,
  };
};
