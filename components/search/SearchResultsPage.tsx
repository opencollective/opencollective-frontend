import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Search, SearchIcon } from 'lucide-react';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import useQueryFilter, { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
import { getCommentUrl } from '../../lib/url-helpers';
import { cn } from '@/lib/utils';

import Tabs from '@/components/Tabs';

import { DashboardContext } from '../dashboard/DashboardContext';
import { EmptyResults } from '../dashboard/EmptyResults';
import Link from '../Link';
import Spinner from '../Spinner';
import { BASE_INPUT_CLASS } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';

import { AccountResult } from './result/AccountResult';
import { CommentResult } from './result/CommentResult';
import { ExpenseResult } from './result/ExpenseResult';
import { OrderResult } from './result/OrderResult';
import { TransactionResult } from './result/TransactionResult';
import { UpdateResult } from './result/UpdateResult';
import { useGetLinkProps } from './lib';
import { searchCommandQuery } from './queries';
import { SearchEntity } from './schema';
import type { PageVisit } from './useRecentlyVisited';
// TODO i18n

export const SearchResults = () => {
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
      limit: z.number().default(5),
      searchTerm: z.string().optional(),
      entity: z.nativeEnum(SearchEntity).default(SearchEntity.ALL),
    }),
    filters: {},
    toVariables: {
      workspace: val => {
        if (val) {
          const context = defaultContext;
          if (context?.type === 'account') {
            return { account: { slug: context.slug }, includeTransactions: true };
          } else if (context?.type === 'host') {
            return { host: { slug: context.slug }, includeTransactions: true };
          } else if (account?.slug === 'root-actions') {
            return { includeTransactions: true };
          }
          return { includeTransactions: false };
        } else {
          return { includeTransactions: true };
        }
      },
      entity: value => {
        if (value !== SearchEntity.ALL) {
          return { limit: 20 };
        } else {
          return { limit: 5 };
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

  const { data, loading } = useQuery(searchCommandQuery, {
    variables: { ...queryFilter.variables, imageHeight: 72 },
    notifyOnNetworkStatusChange: true,
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
    skip: !queryFilter.values.searchTerm,
  });

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        // if (e.key === 'Delete' || e.key === 'Backspace') {
        //   if (input.value === '') {
        //     queryFilter.setFilter('workspace', undefined);
        //   }
        // }
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
          placeholder={queryFilter.values.workspace ? '' : 'Search...'}
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
              label: 'All',
              count: totalCount,
            },
            {
              id: SearchEntity.ACCOUNTS,
              label: 'Accounts',
              count: data?.search.results.accounts.collection.totalCount,
            },
            {
              id: SearchEntity.EXPENSES,
              label: 'Expenses',
              count: data?.search.results.expenses.collection.totalCount,
            },
            {
              id: SearchEntity.CONTRIBUTIONS,
              label: 'Contributions',
              count: data?.search.results.orders?.collection.totalCount,
            },
            {
              id: SearchEntity.TRANSACTIONS,
              label: 'Transactions',
              count: data?.search.results.transactions?.collection.totalCount,
            },
            {
              id: SearchEntity.COMMENTS,
              label: 'Comments',
              count: data?.search.results.comments?.collection.totalCount,
            },
            {
              id: SearchEntity.UPDATES,
              label: 'Updates',
              count: data?.search.results.updates?.collection.totalCount,
            },
          ]}
        />
      </div>
      <div className="py-1 [&_.text-xs_mark]:px-1 [&_.text-xs_mark]:py-[1px] [&_mark]:rounded-xl [&_mark]:bg-amber-100 [&_mark]:px-1 [&_mark]:py-2">
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
              {[1, 2, 3, 4, 5].map(id => (
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
            label="Accounts"
            type="account"
            entity={SearchEntity.ACCOUNTS}
            totalCount={data?.search.results.accounts.collection.totalCount}
            nodes={data?.search.results.accounts.collection.nodes}
            renderNode={account => (
              <AccountResult account={account} highlights={data.search.results.accounts.highlights[account.id]} />
            )}
            queryFilter={queryFilter}
          />
          <SearchResultsGroup
            type="expense"
            label="Expenses"
            entity={SearchEntity.EXPENSES}
            totalCount={data?.search.results.expenses.collection.totalCount}
            nodes={data?.search.results.expenses.collection.nodes}
            renderNode={expense => (
              <ExpenseResult expense={expense} highlights={data.search.results.expenses.highlights[expense.id]} />
            )}
            queryFilter={queryFilter}
          />

          <SearchResultsGroup
            type="order"
            label="Contributions"
            entity={SearchEntity.CONTRIBUTIONS}
            totalCount={data?.search.results.orders.collection.totalCount}
            nodes={data?.search.results.orders.collection.nodes}
            renderNode={order => (
              <OrderResult order={order} highlights={data.search.results.orders.highlights[order.id]} />
            )}
            queryFilter={queryFilter}
          />

          <SearchResultsGroup
            type="transaction"
            label="Transactions"
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
            label="Updates"
            type="update"
            entity={SearchEntity.UPDATES}
            totalCount={data?.search.results.updates.collection.totalCount}
            nodes={data?.search.results.updates.collection.nodes}
            renderNode={update => (
              <UpdateResult update={update} highlights={data.search.results.updates.highlights[update.id]} />
            )}
            queryFilter={queryFilter}
          />
          <SearchResultsGroup
            type="comment"
            entity={SearchEntity.COMMENTS}
            label="Comments"
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
          type="account"
          totalCount={data?.search.results.accounts.collection.totalCount}
          nodes={data?.search.results.accounts.collection.nodes}
          showEmpty
          loading={loading}
          renderNode={account => (
            <AccountResult account={account} highlights={data.search.results.accounts.highlights[account.id]} />
          )}
        />
      );
    case SearchEntity.EXPENSES:
      return (
        <SearchResultsGroup
          type="expense"
          totalCount={data?.search.results.expenses.collection.totalCount}
          nodes={data?.search.results.expenses.collection.nodes}
          showEmpty
          loading={loading}
          renderNode={expense => (
            <ExpenseResult expense={expense} highlights={data.search.results.expenses.highlights[expense.id]} />
          )}
        />
      );
    case SearchEntity.CONTRIBUTIONS:
      return (
        <SearchResultsGroup
          type="order"
          totalCount={data?.search.results.orders.collection.totalCount}
          nodes={data?.search.results.orders.collection.nodes}
          showEmpty
          loading={loading}
          renderNode={order => (
            <OrderResult order={order} highlights={data.search.results.orders.highlights[order.id]} />
          )}
        />
      );
    case SearchEntity.COMMENTS:
      return (
        <SearchResultsGroup
          type="comment"
          totalCount={data?.search.results.comments.collection.totalCount}
          nodes={data?.search.results.comments.collection.nodes.filter(comment => getCommentUrl(comment, LoggedInUser))} // We still have some comments on deleted entities. See https://github.com/opencollective/opencollective/issues/7734.
          showEmpty
          loading={loading}
          renderNode={comment => (
            <CommentResult comment={comment} highlights={data.search.results.comments.highlights[comment.id]} />
          )}
        />
      );
    case SearchEntity.TRANSACTIONS:
      return (
        <SearchResultsGroup
          type="transaction"
          totalCount={data?.search.results.transactions.collection.totalCount}
          nodes={data?.search.results.transactions.collection.nodes}
          showEmpty
          loading={loading}
          renderNode={transaction => (
            <TransactionResult
              transaction={transaction}
              highlights={data.search.results.transactions.highlights[transaction.id]}
            />
          )}
        />
      );
    case SearchEntity.UPDATES:
      return (
        <SearchResultsGroup
          type="account"
          totalCount={data?.search.results.updates.collection.totalCount}
          nodes={data?.search.results.updates.collection.nodes}
          showEmpty
          loading={loading}
          renderNode={update => (
            <UpdateResult update={update} highlights={data.search.results.updates.highlights[update.id]} />
          )}
        />
      );
    default:
      return <div>Some other results</div>;
  }
}

function SearchResultsGroup({
  label,
  totalCount,
  nodes,
  renderNode,
  showEmpty = false,
  type,
  entity,
  loading,
  queryFilter,
}: {
  label?: string;
  totalCount?: number;
  nodes: unknown[];
  renderNode: (node: unknown) => React.ReactNode;
  showEmpty?: boolean;
  type: PageVisit['type'];
  entity?: SearchEntity;
  loading?: boolean;
  queryFilter?: useQueryFilterReturnType<any, any>;
}) {
  const { getLinkProps } = useGetLinkProps();

  if (showEmpty && !totalCount && !loading) {
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
          ? [1, 2, 3, 4, 5].map(id => (
              <div key={`skeleton-${id}`} className="flex items-center gap-2 py-2">
                <Skeleton className="size-9 shrink-0 rounded-md" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : nodes.map(node => {
              const { href, onClick } = getLinkProps({ type, data: node });

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
        {moreCount > 0 && entity && (
          <button
            onClick={() => queryFilter.setFilter('entity', entity)}
            className="-mx-2 flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
          >
            <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <SearchIcon />
            </div>
            <span>
              See {moreCount.toLocaleString()} more {label}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
