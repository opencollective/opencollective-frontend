import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { SearchIcon } from 'lucide-react';
import { useIntl } from 'react-intl';
import { z } from 'zod';

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
      limit: (limit, key, meta, values) => {
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

  const { data, loading } = useQuery(searchPageQuery, {
    variables: {
      ...queryFilter.variables,
      imageHeight: 72,
      includeAccounts: true,
      includeTransactions: true,
      includeExpenses: true,
      includeOrders: true,
      includeUpdates: true,
      includeComments: true,
      includeHostApplications: true,
    },
    notifyOnNetworkStatusChange: true,

    fetchPolicy: 'cache-and-network',
    skip: !queryFilter.values.searchTerm,
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

  let totalCount =
    data?.search.results.accounts.collection.totalCount +
    data?.search.results.expenses.collection.totalCount +
    data?.search.results.orders?.collection.totalCount +
    data?.search.results.transactions?.collection.totalCount +
    data?.search.results.comments?.collection.totalCount +
    data?.search.results.updates?.collection.totalCount;
  totalCount = isNaN(totalCount) ? undefined : totalCount;

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
        {isLoading && <Spinner size={16} className="absolute right-4 text-muted-foreground" />}
      </div>
      <div>
        <Tabs
          selectedId={queryFilter.values.entity}
          onChange={val => queryFilter.setFilter('entity', val as SearchEntity)}
          tabs={[
            {
              id: SearchEntity.ALL,
              label: i18nSearchEntity(intl, SearchEntity.ALL),
              count: totalCount,
            },
            {
              id: SearchEntity.ACCOUNTS,
              label: i18nSearchEntity(intl, SearchEntity.ACCOUNTS),
              count: data?.search.results.accounts.collection.totalCount,
            },
            {
              id: SearchEntity.EXPENSES,
              label: i18nSearchEntity(intl, SearchEntity.EXPENSES),
              count: data?.search.results.expenses.collection.totalCount,
            },
            {
              id: SearchEntity.ORDERS,
              label: i18nSearchEntity(intl, SearchEntity.ORDERS),
              count: data?.search.results.orders?.collection.totalCount,
            },
            {
              id: SearchEntity.TRANSACTIONS,
              label: i18nSearchEntity(intl, SearchEntity.TRANSACTIONS),
              count: data?.search.results.transactions?.collection.totalCount,
            },
            {
              id: SearchEntity.COMMENTS,
              label: i18nSearchEntity(intl, SearchEntity.COMMENTS),
              count: data?.search.results.comments?.collection.totalCount,
            },
            {
              id: SearchEntity.UPDATES,
              label: i18nSearchEntity(intl, SearchEntity.UPDATES),
              count: data?.search.results.updates?.collection.totalCount,
            },
          ]}
        />
      </div>
      <div className="py-1">
        <SearchResultsList data={data} queryFilter={queryFilter} totalCount={totalCount} loading={loading} />
      </div>
    </div>
  );
};

function SearchResultsList({ data, queryFilter, totalCount, loading }) {
  const { LoggedInUser } = useLoggedInUser();

  switch (queryFilter.values.entity) {
    case SearchEntity.ALL:
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
      return (
        <div className="space-y-8">
          <SearchResultsGroup
            entity={SearchEntity.ACCOUNTS}
            totalCount={data?.search.results.accounts.collection.totalCount}
            nodes={data?.search.results.accounts.collection.nodes}
            renderNode={account => (
              <AccountResult account={account} highlights={data.search.results.accounts.highlights[account.id]} />
            )}
            queryFilter={queryFilter}
          />
          <SearchResultsGroup
            entity={SearchEntity.EXPENSES}
            totalCount={data?.search.results.expenses.collection.totalCount}
            nodes={data?.search.results.expenses.collection.nodes}
            renderNode={expense => (
              <ExpenseResult expense={expense} highlights={data.search.results.expenses.highlights[expense.id]} />
            )}
            queryFilter={queryFilter}
          />

          <SearchResultsGroup
            entity={SearchEntity.ORDERS}
            totalCount={data?.search.results.orders.collection.totalCount}
            nodes={data?.search.results.orders.collection.nodes}
            renderNode={order => (
              <OrderResult order={order} highlights={data.search.results.orders.highlights[order.id]} />
            )}
            queryFilter={queryFilter}
          />

          <SearchResultsGroup
            entity={SearchEntity.TRANSACTIONS}
            totalCount={data?.search.results.transactions.collection.totalCount}
            nodes={data?.search.results.transactions.collection.nodes}
            renderNode={transaction => (
              <TransactionResult
                transaction={transaction}
                highlights={data.search.results.transactions.highlights[transaction.id]}
              />
            )}
            queryFilter={queryFilter}
          />

          <SearchResultsGroup
            entity={SearchEntity.UPDATES}
            totalCount={data?.search.results.updates.collection.totalCount}
            nodes={data?.search.results.updates.collection.nodes}
            renderNode={update => (
              <UpdateResult update={update} highlights={data.search.results.updates.highlights[update.id]} />
            )}
            queryFilter={queryFilter}
          />
          <SearchResultsGroup
            entity={SearchEntity.COMMENTS}
            totalCount={data?.search.results.comments.collection.totalCount}
            nodes={data?.search.results.comments.collection.nodes.filter(comment =>
              getCommentUrl(comment, LoggedInUser),
            )} // We still have some comments on deleted entities. See https://github.com/opencollective/opencollective/issues/7734.
            renderNode={comment => (
              <CommentResult comment={comment} highlights={data.search.results.comments.highlights[comment.id]} />
            )}
            queryFilter={queryFilter}
          />
        </div>
      );
    case SearchEntity.ACCOUNTS:
      return (
        <SearchResultsGroup
          entity={SearchEntity.ACCOUNTS}
          totalCount={data?.search.results.accounts.collection.totalCount}
          nodes={data?.search.results.accounts.collection.nodes}
          onStandaloneTab
          loading={loading}
          renderNode={account => (
            <AccountResult account={account} highlights={data.search.results.accounts.highlights[account.id]} />
          )}
          queryFilter={queryFilter}
        />
      );
    case SearchEntity.EXPENSES:
      return (
        <SearchResultsGroup
          entity={SearchEntity.EXPENSES}
          totalCount={data?.search.results.expenses.collection.totalCount}
          nodes={data?.search.results.expenses.collection.nodes}
          onStandaloneTab
          loading={loading}
          renderNode={expense => (
            <ExpenseResult expense={expense} highlights={data.search.results.expenses.highlights[expense.id]} />
          )}
          queryFilter={queryFilter}
        />
      );
    case SearchEntity.ORDERS:
      return (
        <SearchResultsGroup
          entity={SearchEntity.ORDERS}
          totalCount={data?.search.results.orders.collection.totalCount}
          nodes={data?.search.results.orders.collection.nodes}
          onStandaloneTab
          loading={loading}
          renderNode={order => (
            <OrderResult order={order} highlights={data.search.results.orders.highlights[order.id]} />
          )}
          queryFilter={queryFilter}
        />
      );
    case SearchEntity.COMMENTS:
      return (
        <SearchResultsGroup
          entity={SearchEntity.COMMENTS}
          totalCount={data?.search.results.comments.collection.totalCount}
          nodes={data?.search.results.comments.collection.nodes.filter(comment => getCommentUrl(comment, LoggedInUser))} // We still have some comments on deleted entities. See https://github.com/opencollective/opencollective/issues/7734.
          onStandaloneTab
          loading={loading}
          renderNode={comment => (
            <CommentResult comment={comment} highlights={data.search.results.comments.highlights[comment.id]} />
          )}
          queryFilter={queryFilter}
        />
      );
    case SearchEntity.TRANSACTIONS:
      return (
        <SearchResultsGroup
          entity={SearchEntity.TRANSACTIONS}
          totalCount={data?.search.results.transactions.collection.totalCount}
          nodes={data?.search.results.transactions.collection.nodes}
          onStandaloneTab
          loading={loading}
          renderNode={transaction => (
            <TransactionResult
              transaction={transaction}
              highlights={data.search.results.transactions.highlights[transaction.id]}
            />
          )}
          queryFilter={queryFilter}
        />
      );
    case SearchEntity.UPDATES:
      return (
        <SearchResultsGroup
          entity={SearchEntity.UPDATES}
          totalCount={data?.search.results.updates.collection.totalCount}
          nodes={data?.search.results.updates.collection.nodes}
          onStandaloneTab
          loading={loading}
          renderNode={update => (
            <UpdateResult update={update} highlights={data.search.results.updates.highlights[update.id]} />
          )}
          queryFilter={queryFilter}
        />
      );
    default:
      return <div>Some other results</div>;
  }
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
  queryFilter: useQueryFilterReturnType<z.ZodObject<z.ZodRawShape>, Record<string, unknown>>;
};

function SearchResultsGroup<E extends Exclude<keyof SearchEntityNodeMap, SearchEntity.DASHBOARD_TOOL>>({
  totalCount,
  nodes,
  renderNode,
  onStandaloneTab = false,
  entity,
  loading,
  queryFilter,
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
        {onStandaloneTab && <Pagination className="mt-4" total={totalCount} queryFilter={queryFilter} />}
      </div>
    </div>
  );
}
