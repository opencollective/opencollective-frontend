import React from 'react';
import { FormattedMessage } from 'react-intl';

import { cn } from '@/lib/utils';

/**
 * Pagination limits of the search. They mirror `PostgresSearchLimits.MAX_RESULTS_PER_PAGE` and `MAX_OFFSET` in
 * opencollective-api `server/lib/search/providers/postgres/input.ts`, which rejects requests beyond them.
 */
export const SEARCH_LIMITS = {
  /** Maximum number of results per page (`limit`) */
  maxLimit: 50,
  /** Maximum `offset`: deeper results can't be browsed */
  maxOffset: 5000,
} as const;

/**
 * Shown when the results go beyond the depth supported by the search.
 */
export const NarrowSearchMessage = ({ className }: { className?: string }) => (
  <p className={cn('text-sm text-muted-foreground', className)}>
    <FormattedMessage
      id="search.narrowSearch"
      defaultMessage="Only the first {count} results can be browsed. Add more words or select a workspace to narrow your search."
      values={{ count: SEARCH_LIMITS.maxOffset.toLocaleString() }}
    />
  </p>
);

/**
 * Caps the page sizes of the search query variables (`limit`, `<entity>Limit`) to the maximum supported by the API.
 */
export const getSearchVariables = <V extends Record<string, unknown>>(variables: V): V => {
  const result: Record<string, unknown> = { ...variables };
  for (const [variable, value] of Object.entries(result)) {
    if (
      (variable === 'limit' || variable.endsWith('Limit')) &&
      typeof value === 'number' &&
      value > SEARCH_LIMITS.maxLimit
    ) {
      result[variable] = SEARCH_LIMITS.maxLimit;
    }
  }

  return result as V;
};
