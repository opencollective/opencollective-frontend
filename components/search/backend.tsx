import React from 'react';
import { FormattedMessage } from 'react-intl';

import { SearchBackend } from '@/lib/graphql/types/v2/graphql';
import useLocalStorage from '@/lib/hooks/useLocalStorage';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { LOCAL_STORAGE_KEYS } from '@/lib/local-storage';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
import { cn } from '@/lib/utils';

import { SearchEntity } from './filters';

/** Entities that the PostgreSQL backend can search. Unsupported entities must not be requested. */
const POSTGRES_SUPPORTED_ENTITIES = new Set<SearchEntity>([
  SearchEntity.ACCOUNTS,
  SearchEntity.HOST_APPLICATIONS,
  SearchEntity.ORDERS,
  SearchEntity.UPDATES,
]);

/** Limits enforced by the PostgreSQL backend */
export const POSTGRES_SEARCH_LIMITS = { MAX_LIMIT: 50, MAX_OFFSET: 5000 } as const;

export const isEntitySupportedByBackend = (entity: SearchEntity, backend: SearchBackend): boolean =>
  backend !== SearchBackend.POSTGRES || entity === SearchEntity.ALL || POSTGRES_SUPPORTED_ENTITIES.has(entity);

/**
 * The search backend selected by the user. Only team members with the preview feature can select PostgreSQL;
 * everyone else always uses the default (OpenSearch).
 */
export const useSearchBackend = () => {
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const canSelectBackend = Boolean(
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_POSTGRES_BACKEND),
  );
  const [storedBackend, setBackend] = useLocalStorage<SearchBackend>(
    LOCAL_STORAGE_KEYS.SEARCH_BACKEND,
    SearchBackend.OPENSEARCH,
  );
  const backend =
    canSelectBackend && Object.values(SearchBackend).includes(storedBackend) ? storedBackend : SearchBackend.OPENSEARCH;

  // Don't search before knowing which backend to use
  const isBackendReady = !loadingLoggedInUser;
  return { backend, setBackend, canSelectBackend, isBackendReady };
};

const BACKEND_LABELS: Record<SearchBackend, string> = {
  [SearchBackend.OPENSEARCH]: 'OpenSearch',
  [SearchBackend.POSTGRES]: 'PostgreSQL',
};

/**
 * A compact switch between search backends, only rendered for users who can select one.
 */
export const SearchBackendSelector = ({
  backend,
  setBackend,
  canSelectBackend,
  className,
}: ReturnType<typeof useSearchBackend> & { className?: string }) => {
  if (!canSelectBackend) {
    return null;
  }

  return (
    <div
      className={cn('flex shrink-0 items-center gap-1 rounded-md border p-0.5 text-xs', className)}
      role="radiogroup"
      aria-label="Search backend"
    >
      {Object.values(SearchBackend).map(value => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={backend === value}
          onClick={() => setBackend(value)}
          className={cn(
            'rounded px-2 py-1 whitespace-nowrap transition-colors',
            backend === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {BACKEND_LABELS[value]}
        </button>
      ))}
    </div>
  );
};

/**
 * Shown when the results go beyond the depth supported by the PostgreSQL backend.
 */
export const NarrowSearchMessage = ({ className }: { className?: string }) => (
  <p className={cn('text-sm text-muted-foreground', className)}>
    <FormattedMessage
      id="search.narrowSearch"
      defaultMessage="Only the first {count} results can be browsed. Add more words or select a workspace to narrow your search."
      values={{ count: POSTGRES_SEARCH_LIMITS.MAX_OFFSET.toLocaleString() }}
    />
  </p>
);

const INCLUDE_VARIABLES_ENTITIES = {
  includeAccounts: SearchEntity.ACCOUNTS,
  includeComments: SearchEntity.COMMENTS,
  includeExpenses: SearchEntity.EXPENSES,
  includeHostApplications: SearchEntity.HOST_APPLICATIONS,
  includeOrders: SearchEntity.ORDERS,
  includeTransactions: SearchEntity.TRANSACTIONS,
  includeUpdates: SearchEntity.UPDATES,
} as const;

/**
 * Adds the backend to the search query variables, and stops requesting the entities it does not support (the
 * PostgreSQL backend returns an error for them).
 */
export const getSearchBackendVariables = <V extends Record<string, unknown>>(variables: V, backend: SearchBackend) => {
  const result: Record<string, unknown> = { ...variables, backend };
  for (const [variable, entity] of Object.entries(INCLUDE_VARIABLES_ENTITIES)) {
    if (result[variable] && !isEntitySupportedByBackend(entity, backend)) {
      result[variable] = false;
    }
  }

  return result as V & { backend: SearchBackend };
};
