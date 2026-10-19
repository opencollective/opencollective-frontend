import React, { useCallback, useEffect } from 'react';
import { upperFirst } from 'lodash-es';
import { FormattedMessage, useIntl } from 'react-intl';

import { SearchBackend } from '@/lib/graphql/types/v2/graphql';
import useLocalStorage from '@/lib/hooks/useLocalStorage';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { LOCAL_STORAGE_KEYS } from '@/lib/local-storage';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
import { cn } from '@/lib/utils';

import { SEARCH_ENTITY_RESULT_FIELDS, SearchEntity } from './filters';

/** Entities that the PostgreSQL backend can search. Unsupported entities must not be requested. */
const POSTGRES_SUPPORTED_ENTITIES = new Set<SearchEntity>([
  SearchEntity.ACCOUNTS,
  SearchEntity.COMMENTS,
  SearchEntity.EXPENSES,
  SearchEntity.HOST_APPLICATIONS,
  SearchEntity.ORDERS,
  SearchEntity.TRANSACTIONS,
  SearchEntity.UPDATES,
]);

type SearchBackendLimits = {
  /** Maximum number of results per page (`limit`), if any */
  maxLimit?: number;
  /** Maximum `offset`, if any: deeper results can't be browsed */
  maxOffset?: number;
};

/**
 * Pagination limits of each backend. The PostgreSQL ones mirror `PostgresSearchLimits.MAX_RESULTS_PER_PAGE` and
 * `MAX_OFFSET` in opencollective-api `server/lib/search/providers/postgres/input.ts`, which rejects requests beyond them.
 */
const SEARCH_BACKEND_LIMITS: Record<SearchBackend, SearchBackendLimits> = {
  [SearchBackend.OPENSEARCH]: {},
  [SearchBackend.POSTGRES]: { maxLimit: 50, maxOffset: 5000 },
};

export const getBackendLimits = (backend: SearchBackend): SearchBackendLimits => SEARCH_BACKEND_LIMITS[backend] || {};

export const isEntitySupportedByBackend = (entity: SearchEntity, backend: SearchBackend): boolean =>
  backend !== SearchBackend.POSTGRES || entity === SearchEntity.ALL || POSTGRES_SUPPORTED_ENTITIES.has(entity);

/** Dispatched on `window` when the user selects a search backend, so that every `useSearchBackend` follows it */
const SEARCH_BACKEND_CHANGE_EVENT = 'searchBackendChange';

/** The search filters that depend on the backend */
type SearchBackendFilters = {
  values: { entity?: SearchEntity; limit?: number };
  setFilter: (name: 'entity' | 'limit', value: SearchEntity | number) => void;
};

/**
 * The search backend selected by the user. Only team members with the preview feature can select PostgreSQL;
 * everyone else always uses the default (OpenSearch). When the selected backend doesn't support the selected entity
 * or page size, `queryFilter` falls back to all entities or to the largest supported page size.
 */
export const useSearchBackend = (queryFilter: SearchBackendFilters) => {
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const canSelectBackend = Boolean(
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_POSTGRES_BACKEND),
  );
  const [storedBackend, setStoredBackend] = useLocalStorage<SearchBackend>(
    LOCAL_STORAGE_KEYS.SEARCH_BACKEND,
    SearchBackend.OPENSEARCH,
  );

  // The search command and the results page can be mounted together: keep their selected backends in sync
  useEffect(() => {
    const onBackendChange = (event: Event) => setStoredBackend((event as CustomEvent<SearchBackend>).detail);
    window.addEventListener(SEARCH_BACKEND_CHANGE_EVENT, onBackendChange);
    return () => window.removeEventListener(SEARCH_BACKEND_CHANGE_EVENT, onBackendChange);
  }, [setStoredBackend]);
  const setBackend = useCallback((value: SearchBackend) => {
    window.dispatchEvent(new CustomEvent(SEARCH_BACKEND_CHANGE_EVENT, { detail: value }));
  }, []);
  const backend =
    canSelectBackend && Object.values(SearchBackend).includes(storedBackend) ? storedBackend : SearchBackend.OPENSEARCH;

  // Entities and page sizes that the selected backend doesn't support can't be selected
  const { entity, limit } = queryFilter.values;
  useEffect(() => {
    const { maxLimit } = getBackendLimits(backend);
    if (!isEntitySupportedByBackend(entity, backend)) {
      queryFilter.setFilter('entity', SearchEntity.ALL);
    } else if (maxLimit && limit > maxLimit) {
      queryFilter.setFilter('limit', maxLimit);
    }
  }, [backend, entity, limit]);

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
  const intl = useIntl();
  if (!canSelectBackend) {
    return null;
  }

  return (
    <div
      className={cn('flex shrink-0 items-center gap-1 rounded-md border p-0.5 text-xs', className)}
      role="radiogroup"
      aria-label={intl.formatMessage({ defaultMessage: 'Search backend', id: 'kjpVKl' })}
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
      values={{ count: getBackendLimits(SearchBackend.POSTGRES).maxOffset.toLocaleString() }}
    />
  </p>
);

/**
 * Adds the backend to the search query variables, stops requesting the entities it does not support (the PostgreSQL
 * backend returns an error for them), and caps the page sizes (`limit`, `<entity>Limit`) to the backend's maximum.
 */
export const getSearchBackendVariables = <V extends Record<string, unknown>>(variables: V, backend: SearchBackend) => {
  const result: Record<string, unknown> = { ...variables, backend };
  for (const [entity, field] of Object.entries(SEARCH_ENTITY_RESULT_FIELDS)) {
    const includeVariable = `include${upperFirst(field)}`;
    if (result[includeVariable] && !isEntitySupportedByBackend(entity as SearchEntity, backend)) {
      result[includeVariable] = false;
    }
  }

  const { maxLimit } = getBackendLimits(backend);
  if (maxLimit) {
    for (const [variable, value] of Object.entries(result)) {
      if ((variable === 'limit' || variable.endsWith('Limit')) && typeof value === 'number' && value > maxLimit) {
        result[variable] = maxLimit;
      }
    }
  }

  return result as V & { backend: SearchBackend };
};
