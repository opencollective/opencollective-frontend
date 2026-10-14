import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { SearchIcon } from 'lucide-react';
import { useIntl } from 'react-intl';
import { z } from 'zod';

import { SearchBackend } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import type { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
import useQueryFilter from '../../lib/hooks/useQueryFilter';
import { getCommentUrl } from '../../lib/url-helpers';
import { i18nSearchEntity } from '@/lib/i18n/search';
import { cn } from '@/lib/utils';

import Tabs from '@/components/Tabs';

import { DashboardContext } from '../dashboard/DashboardContext';
import { EmptyResults } from '../dashboard/EmptyResults';
import { Pagination } from '../dashboard/filters/Pagination';
import Link from '../Link';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import Spinner from '../Spinner';
import { BASE_INPUT_CLASS } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';

import { AccountResult } from './result/AccountResult';
import { CommentResult } from './result/CommentResult';
import { ExpenseResult } from './result/ExpenseResult';
import { LoadingResult } from './result/LoadingResult';
import { OrderResult } from './result/OrderResult';
import { TransactionResult } from './result/TransactionResult';
import { UpdateResult } from './result/UpdateResult';
import {
  getSearchBackendVariables,
  isEntitySupportedByBackend,
  NarrowSearchMessage,
  POSTGRES_SEARCH_LIMITS,
  SearchBackendSelector,
  useSearchBackend,
} from './backend';
import { SearchEntity } from './filters';
import { useGetLinkProps } from './lib';
import { searchPageQuery } from './queries';
import type { SearchEntityNodeMap } from './types';

export const SearchResults = () => {
  const intl = useIntl();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { account } = React.useContext(DashboardContext);
  const defaultContext: { slug: string; type: 'account' | 'host' } | undefined = account?.isHost
    ? { slug: account.slug, type: 'host' }
    : account?.slug && account.slug !== 'root-actions'
      ? { slug: account.slug, type: 'account' }
      : undefined;

  const searchBackend = useSearchBackend();
  const { backend } = searchBackend;
  const queryFilter = useQueryFilter({
    schema: z.object({
      workspace: z.string().optional(),
      limit: z.coerce.number().default(10),
      offset: z.coerce.number().default(0),
      searchTerm: z.string().optional(),
      entity: z.nativeEnum(SearchEntity).default(SearchEntity.ALL),
    }),
    filters: {},
    toVariables: {
      workspace: val => {
        if (val) {
          const context = defaultContext;
          if (context?.type === 'account') {
            return { account: { slug: context.slug } };
          } else if (context?.type === 'host') {
            return { host: { slug: context.slug } };
          }
        }
      },
      limit: (requestedLimit, key, meta, values) => {
        const limit =
          backend === SearchBackend.POSTGRES
            ? Math.min(requestedLimit, POSTGRES_SEARCH_LIMITS.MAX_LIMIT)
            : requestedLimit;
        const defaultEntityLimit = {
          defaultLimit: 0, // TODO: should be enough? Seems to be a bug with defaultLimit
          accountsLimit: 0,
          expensesLimit: 0,
          transactionsLimit: 0,
          contributionsLimit: 0,
          updatesLimit: 0,
          commentsLimit: 0,
        };
        switch (values.entity) {
          case SearchEntity.ALL:
            return {
              defaultLimit: 5,
            };
          case SearchEntity.EXPENSES:
            return {
              ...defaultEntityLimit,
              expensesLimit: limit,
            };
          case SearchEntity.TRANSACTIONS:
            return {
              ...defaultEntityLimit,
              transactionsLimit: limit,
            };
          case SearchEntity.ACCOUNTS:
            return {
              ...defaultEntityLimit,
              accountsLimit: limit,
            };
          case SearchEntity.ORDERS:
            return {
              ...defaultEntityLimit,
              contributionsLimit: limit,
            };
          case SearchEntity.UPDATES:
            return {
              ...defaultEntityLimit,
              updatesLimit: limit,
            };
          case SearchEntity.COMMENTS:
            return {
              ...defaultEntityLimit,
              commentsLimit: limit,
            };
        }
      },
      entity: val => {
        switch (val) {
          case SearchEntity.ALL:
            return {
              useTopHits: true,
            };
          default:
            return {
              useTopHits: false,
            };
        }
      },
    },
    defaultFilterValues: { workspace: account?.slug },
    shallow: true,
  });

  const [input, setInput] = React.useState(queryFilter.values.searchTerm);

  // Sync input state with URL changes (e.g., from SearchCommand navigation)
  useEffect(() => {
    setInput(queryFilter.values.searchTerm || '');
  }, [queryFilter.values.searchTerm]);

  // Entities and page sizes that the selected backend doesn't support can't be selected
  useEffect(() => {
    if (!isEntitySupportedByBackend(queryFilter.values.entity, backend)) {
      queryFilter.setFilter('entity', SearchEntity.ALL);
    } else if (backend === SearchBackend.POSTGRES && queryFilter.values.limit > POSTGRES_SEARCH_LIMITS.MAX_LIMIT) {
      queryFilter.setFilter('limit', POSTGRES_SEARCH_LIMITS.MAX_LIMIT);
    }
  }, [backend, queryFilter.values.entity, queryFilter.values.limit]);

  const { data, loading, error } = useQuery(searchPageQuery, {
    variables: {
      ...getSearchBackendVariables(
        {
          ...queryFilter.variables,
          includeAccounts: true,
          includeTransactions: true,
          includeExpenses: true,
          includeOrders: true,
          includeUpdates: true,
          includeComments: true,
          includeHostApplications: true,
        },
        backend,
      ),
      imageHeight: 72,
    },
    notifyOnNetworkStatusChange: true,

    fetchPolicy: 'cache-and-network',
    skip: !queryFilter.values.searchTerm || !searchBackend.isBackendReady,
  });

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Enter') {
          queryFilter.setFilter('searchTerm', input.value);
        }
      }
    },
    [queryFilter],
  );

  const isLoading = loading;

  const results = data?.search.results;
  const totalCount = results
    ? [results.accounts, results.expenses, results.orders, results.transactions, results.comments, results.updates]
        .map(result => result?.collection.totalCount || 0)
        .reduce((total, count) => total + count, 0)
    : undefined;
  const tabs = [
    { id: SearchEntity.ALL, count: totalCount },
    { id: SearchEntity.ACCOUNTS, count: results?.accounts?.collection.totalCount },
    { id: SearchEntity.EXPENSES, count: results?.expenses?.collection.totalCount },
    { id: SearchEntity.ORDERS, count: results?.orders?.collection.totalCount },
    { id: SearchEntity.TRANSACTIONS, count: results?.transactions?.collection.totalCount },
    { id: SearchEntity.COMMENTS, count: results?.comments?.collection.totalCount },
    { id: SearchEntity.UPDATES, count: results?.updates?.collection.totalCount },
  ]
    .filter(tab => isEntitySupportedByBackend(tab.id, backend))
    .map(tab => ({ ...tab, label: i18nSearchEntity(intl, tab.id) }));

  return (
    <div className="space-y-4">
      <div className={cn(BASE_INPUT_CLASS, 'relative items-center gap-3')}>
        <SearchIcon className="shrink-0 text-muted-foreground" size={16} />

        <input
          ref={inputRef}
          onChange={e => setInput(e.target.value)}
          value={input}
          placeholder={intl.formatMessage({ id: 'search.placeholder', defaultMessage: 'Search...' })}
          className="flex-1 focus:outline-none"
          autoFocus
          onKeyDown={handleKeyDown}
        />
        {isLoading && <Spinner size={16} className="shrink-0 text-muted-foreground" />}
        <SearchBackendSelector {...searchBackend} />
      </div>
      <div>
        <Tabs
          selectedId={queryFilter.values.entity}
          onChange={val => queryFilter.setFilter('entity', val as SearchEntity)}
          tabs={tabs}
        />
      </div>
      {error && <MessageBoxGraphqlError error={error} />}
      <div className="py-1">
        <SearchResultsList
          data={data}
          queryFilter={queryFilter}
          totalCount={totalCount}
          loading={loading}
          backend={backend}
        />
      </div>
    </div>
  );
};
type SearchResultsListGroup = {
  entity: Exclude<SearchEntity, SearchEntity.ALL | SearchEntity.DASHBOARD_TOOL>;
  result?: { maxScore?: number; collection: { totalCount: number; nodes: any[] } }; // eslint-disable-line @typescript-eslint/no-explicit-any
  renderNode: (node) => React.ReactNode;
  filterNodes?: (nodes) => any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
};

function SearchResultsList({ data, queryFilter, totalCount, loading, backend }) {
  const { LoggedInUser } = useLoggedInUser();
  const results = data?.search.results;
  const allGroups: SearchResultsListGroup[] = [
    {
      entity: SearchEntity.ACCOUNTS,
      result: results?.accounts,
      renderNode: account => <AccountResult account={account} highlights={results.accounts.highlights?.[account.id]} />,
    },
    {
      entity: SearchEntity.EXPENSES,
      result: results?.expenses,
      renderNode: expense => <ExpenseResult expense={expense} highlights={results.expenses.highlights?.[expense.id]} />,
    },
    {
      entity: SearchEntity.ORDERS,
      result: results?.orders,
      renderNode: order => <OrderResult order={order} highlights={results.orders.highlights?.[order.id]} />,
    },
    {
      entity: SearchEntity.TRANSACTIONS,
      result: results?.transactions,
      renderNode: transaction => (
        <TransactionResult transaction={transaction} highlights={results.transactions.highlights?.[transaction.id]} />
      ),
    },
    {
      entity: SearchEntity.UPDATES,
      result: results?.updates,
      renderNode: update => <UpdateResult update={update} highlights={results.updates.highlights?.[update.id]} />,
    },
    {
      entity: SearchEntity.COMMENTS,
      result: results?.comments,
      // We still have some comments on deleted entities. See https://github.com/opencollective/opencollective/issues/7734.
      filterNodes: nodes => nodes?.filter(comment => getCommentUrl(comment, LoggedInUser)),
      renderNode: comment => <CommentResult comment={comment} highlights={results.comments.highlights?.[comment.id]} />,
    },
  ];
  const groups = allGroups.filter(group => isEntitySupportedByBackend(group.entity, backend));

  if (queryFilter.values.entity === SearchEntity.ALL) {
    if (loading) {
      return (
        <div className="space-y-3 text-sm">
          <p className="font-medium text-muted-foreground"> </p>
          <div className="flex flex-col gap-2">
            {Array.from({ length: queryFilter.values.limit }, (_, i) => i + 1).map(id => (
              <div key={`skeleton-${id}`} className="flex items-center gap-2 py-2">
                <Skeleton className="size-9 shrink-0 rounded-md" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (!totalCount) {
      return <EmptyResults isEmptySearch={totalCount !== 0} hasFilters={false} />;
    }

    // With PostgreSQL, scores are comparable across entities: show the best matches first
    const sortedGroups =
      backend === SearchBackend.POSTGRES
        ? [...groups].sort((a, b) => (b.result?.maxScore || 0) - (a.result?.maxScore || 0))
        : groups;

    return (
      <div className="space-y-8">
        {sortedGroups.map(group => (
          <SearchResultsGroup
            key={group.entity}
            entity={group.entity}
            totalCount={group.result?.collection.totalCount}
            nodes={
              group.filterNodes ? group.filterNodes(group.result?.collection.nodes) : group.result?.collection.nodes
            }
            renderNode={group.renderNode}
            queryFilter={queryFilter}
          />
        ))}
      </div>
    );
  }

  const group = groups.find(group => group.entity === queryFilter.values.entity);
  if (!group) {
    return null;
  }

  return (
    <SearchResultsGroup
      entity={group.entity}
      totalCount={group.result?.collection.totalCount}
      nodes={group.filterNodes ? group.filterNodes(group.result?.collection.nodes) : group.result?.collection.nodes}
      onStandaloneTab
      loading={loading}
      renderNode={group.renderNode}
      queryFilter={queryFilter}
      backend={backend}
    />
  );
}

type SearchResultsGroupProps<
  E extends Exclude<keyof SearchEntityNodeMap, SearchEntity.DASHBOARD_TOOL> = Exclude<
    keyof SearchEntityNodeMap,
    SearchEntity.DASHBOARD_TOOL
  >,
> = {
  totalCount?: number;
  nodes?: SearchEntityNodeMap[E][];
  renderNode: (node: SearchEntityNodeMap[E]) => React.ReactNode;
  onStandaloneTab?: boolean;
  entity: E;
  loading?: boolean;
  queryFilter: useQueryFilterReturnType<any, any>;
  backend?: SearchBackend;
};

function SearchResultsGroup<E extends Exclude<keyof SearchEntityNodeMap, SearchEntity.DASHBOARD_TOOL>>({
  totalCount,
  nodes,
  renderNode,
  onStandaloneTab = false,
  entity,
  loading,
  queryFilter,
  backend,
}: SearchResultsGroupProps<E>) {
  const intl = useIntl();
  const { getLinkProps } = useGetLinkProps();
  const label = i18nSearchEntity(intl, entity);

  if (onStandaloneTab && !totalCount && !loading) {
    return <EmptyResults hasFilters={false} isEmptySearch={totalCount !== 0} />;
  } else if (!totalCount && !loading) {
    return null;
  }
  const moreCount = totalCount - nodes?.length;
  return (
    <div className="space-y-3 text-sm">
      {label && <p className="font-medium text-muted-foreground">{label}</p>}
      <div className="flex flex-col gap-2">
        {loading
          ? Array.from({ length: queryFilter.values.limit }, (_, i) => i + 1).map(id => (
              <LoadingResult key={`skeleton-${id}`} />
            ))
          : nodes.map(node => {
              const { href, onClick } = getLinkProps({ entity, data: node });

              return (
                <Link
                  key={node.id}
                  href={href}
                  onClick={onClick}
                  className="-mx-2 block w-full rounded-sm px-2 py-1.5 hover:bg-muted"
                >
                  {renderNode(node)}
                </Link>
              );
            })}
        {!onStandaloneTab && moreCount > 0 && (
          <button
            onClick={() => queryFilter.setFilter('entity', entity)}
            className="-mx-2 flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
          >
            <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <SearchIcon />
            </div>
            <span>
              {intl.formatMessage(
                { id: 'SearchResults.SeeMore', defaultMessage: 'See {count} more {label}' },
                {
                  count: moreCount.toLocaleString(),
                  label: label.toLowerCase(),
                },
              )}
            </span>
          </button>
        )}
        {onStandaloneTab &&
          (backend === SearchBackend.POSTGRES ? (
            <React.Fragment>
              {/* Exact totals, but pages are only available up to the maximum offset */}
              <Pagination
                className="mt-4"
                total={Math.min(totalCount, POSTGRES_SEARCH_LIMITS.MAX_OFFSET + queryFilter.values.limit)}
                maxLimit={POSTGRES_SEARCH_LIMITS.MAX_LIMIT}
                queryFilter={queryFilter}
              />
              {totalCount > POSTGRES_SEARCH_LIMITS.MAX_OFFSET + queryFilter.values.limit && <NarrowSearchMessage />}
            </React.Fragment>
          ) : (
            <Pagination className="mt-4" total={totalCount} queryFilter={queryFilter} />
          ))}
      </div>
    </div>
  );
}
