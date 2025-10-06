import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { SearchIcon } from 'lucide-react';
import { z } from 'zod';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../lib/hooks/useQueryFilter';
import {
  getCollectivePageRoute,
  getCommentUrl,
  getExpensePageUrl,
  getOrderUrl,
  getUpdateUrl,
} from '../../lib/url-helpers';

import { DashboardContext } from '../dashboard/DashboardContext';
import Link from '../Link';
import Spinner from '../Spinner';

import { AccountResult } from './result/AccountResult';
import { CommentResult } from './result/CommentResult';
import { ExpenseResult } from './result/ExpenseResult';
import { OrderResult } from './result/OrderResult';
import { TransactionResult } from './result/TransactionResult';
import { UpdateResult } from './result/UpdateResult';
import { ContextPill } from './ContextPill';
import { searchCommandQuery } from './queries';
import { BASE_INPUT_CLASS } from '../ui/Input';
import Tabs from '@/components/Tabs';
import { cn } from '@/lib/utils';
import { EmptyResults } from '../dashboard/EmptyResults';
import { Skeleton } from '../ui/Skeleton';
import { SearchEntity } from './schema';
// TODO i18n

type EntityFilter = 'ALL' | 'ACCOUNTS' | 'EXPENSES' | 'TRANSACTIONS' | 'CONTRIBUTIONS' | 'UPDATES' | 'COMMENTS';
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
      // context: context => {
      //   if (context?.type === 'account') {
      //     return { account: { slug: context.slug }, includeTransactions: true };
      //   } else if (context?.type === 'host') {
      //     return { host: { slug: context.slug }, includeTransactions: true };
      //   } else if (account?.slug === 'root-actions') {
      //     return { includeTransactions: true };
      //   }
      //   return { includeTransactions: false };
      // },
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
    defaultFilterValues: { workspace: account.slug },
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
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '') {
            queryFilter.setFilter('workspace', undefined);
          }
        }
        if (e.key === 'Enter') {
          queryFilter.setFilter('searchTerm', input.value);
        }
      }
    },
    [queryFilter],
  );

  const isLoading = loading;

  let totalCount =
    (data?.search.results.accounts.collection.totalCount || 0) +
    (data?.search.results.expenses.collection.totalCount || 0) +
    (data?.search.results.orders?.collection.totalCount || 0) +
    (data?.search.results.transactions?.collection.totalCount || 0) +
    (data?.search.results.comments?.collection.totalCount || 0) +
    (data?.search.results.updates?.collection.totalCount || 0);
  totalCount = totalCount === 0 ? undefined : totalCount;
  return (
    <div className="space-y-4">
      <div className={cn(BASE_INPUT_CLASS, 'relative items-center gap-3')}>
        <SearchIcon className="shrink-0 text-muted-foreground" size={16} />
        {queryFilter.values.workspace && (
          <ContextPill
            slug={queryFilter.values.workspace}
            onRemove={() => queryFilter.setFilter('workspace', undefined)}
          />
        )}
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
        {/* <TabsList>
            <TabsTrigger value={'ALL'}>All</TabsTrigger>
            <TabsTrigger value={'ACCOUNTS'}>Accounts</TabsTrigger>
            <TabsTrigger value={'EXPENSES'}>Expenses</TabsTrigger>
            <TabsTrigger value={'CONTRIBUTIONS'}>Contributions</TabsTrigger>
            <TabsTrigger value={'TRANSACTIONS'}>Transactions</TabsTrigger>
            <TabsTrigger value={'COMMENTS'}>Comments</TabsTrigger>
            <TabsTrigger value={'UPDATES'}>Updates</TabsTrigger>
          </TabsList> */}
      </div>
      <div className="py-4 [&_.text-xs_mark]:px-1 [&_.text-xs_mark]:py-[1px] [&_mark]:rounded-xl [&_mark]:bg-amber-100 [&_mark]:px-1 [&_mark]:py-2">
        <SearchResultsList data={data} queryFilter={queryFilter} totalCount={totalCount} loading={loading} />
        {/* {recentlyVisited.length > 0 && debouncedInput === '' && (
          <div>

            {recentlyVisited.map(recentVisit => (
              <CommandItem key={recentVisit.key} className="gap-2" onSelect={() => handleResultSelect(recentVisit)}>
                {recentVisit.type === 'account' && <AccountResult account={recentVisit.data} />}
                {recentVisit.type === 'expense' && <ExpenseResult expense={recentVisit.data} />}
                {recentVisit.type === 'order' && <OrderResult order={recentVisit.data} />}
                {recentVisit.type === 'transaction' && <TransactionResult transaction={recentVisit.data} />}
                {recentVisit.type === 'update' && <UpdateResult update={recentVisit.data} />}
              </CommandItem>
            ))}
          </div>
        )} */}

        {/* <SearchCommandGroup
          label="Accounts"
          totalCount={data?.search.results.accounts.collection.totalCount}
          input={debouncedInput}
          nodes={data?.search.results.accounts.collection.nodes}
          renderNode={account => (
            <CommandItem key={account.id} onSelect={() => handleResultSelect({ type: 'account', data: account })}>
              <Link className="block w-full" href={getCollectivePageRoute(account)} onClick={e => e.preventDefault()}>
                <AccountResult account={account} highlights={data.search.results.accounts.highlights[account.id]} />
              </Link>
            </CommandItem>
          )}
        />
        <SearchCommandGroup
          label="Expenses"
          totalCount={data?.search.results.expenses.collection.totalCount}
          nodes={data?.search.results.expenses.collection.nodes}
          input={debouncedInput}
          renderNode={expense => (
            <CommandItem key={expense.id} onSelect={() => handleResultSelect({ type: 'expense', data: expense })}>
              <Link className="block w-full" href={getExpensePageUrl(expense)} onClick={e => e.preventDefault()}>
                <ExpenseResult expense={expense} highlights={data.search.results.expenses.highlights[expense.id]} />
              </Link>
            </CommandItem>
          )}
        />
        {data?.search.results.orders && (
          <SearchCommandGroup
            label="Contributions"
            input={debouncedInput}
            totalCount={data?.search.results.orders.collection.totalCount}
            nodes={data?.search.results.orders.collection.nodes}
            renderNode={order => (
              <CommandItem key={order.id} onSelect={() => handleResultSelect({ type: 'order', data: order })}>
                <Link
                  className="block w-full"
                  href={getOrderUrl(order, LoggedInUser)}
                  onClick={e => e.preventDefault()}
                >
                  <OrderResult order={order} highlights={data.search.results.orders.highlights[order.id]} />
                </Link>
              </CommandItem>
            )}
          />
        )}
        {data?.search.results.transactions && (
          <SearchCommandGroup
            label="Transactions"
            input={debouncedInput}
            totalCount={data?.search.results.transactions.collection.totalCount}
            nodes={data?.search.results.transactions.collection.nodes}
            renderNode={transaction => (
              <CommandItem
                key={transaction.id}
                onSelect={() => handleResultSelect({ type: 'transaction', data: transaction })}
              >
                <TransactionResult
                  transaction={transaction}
                  highlights={data.search.results.transactions.highlights[transaction.id]}
                />
              </CommandItem>
            )}
          />
        )}
        <SearchCommandGroup
          label="Updates"
          input={debouncedInput}
          totalCount={data?.search.results.updates.collection.totalCount}
          nodes={data?.search.results.updates.collection.nodes}
          renderNode={update => (
            <CommandItem key={update.id} onSelect={() => handleResultSelect({ type: 'update', data: update })}>
              <Link
                className="block w-full"
                href={getUpdateUrl(update, LoggedInUser)}
                onClick={e => e.preventDefault()}
              >
                <UpdateResult update={update} highlights={data.search.results.updates.highlights[update.id]} />
              </Link>
            </CommandItem>
          )}
        />
        <SearchCommandGroup
          label="Comments"
          input={debouncedInput}
          totalCount={data?.search.results.comments.collection.totalCount}
          nodes={data?.search.results.comments.collection.nodes.filter(comment => getCommentUrl(comment, LoggedInUser))} // We still have some comments on deleted entities. See https://github.com/opencollective/opencollective/issues/7734.
          renderNode={comment => (
            <CommandItem key={comment.id} onSelect={() => handleResultSelect({ type: 'comment', data: comment })}>
              <Link
                className="block w-full"
                href={getCommentUrl(comment, LoggedInUser)}
                onClick={e => e.preventDefault()}
              >
                <CommentResult comment={comment} highlights={data.search.results.comments.highlights[comment.id]} />
              </Link>
            </CommandItem>
          )}
        /> */}
      </div>
    </div>
  );
};

function SearchResultsList({ data, queryFilter, totalCount, loading }) {
  const { LoggedInUser } = useLoggedInUser();

  //   const handleResultSelect = ({
  //     type,
  //     data,
  //   }:
  //     | PageVisit
  //     | {
  //         type: 'page';
  //         data: { section: string };
  //       }) => {
  //     switch (type) {
  //       case 'account':
  //         if (data.type !== CollectiveType.VENDOR) {
  //           // TODO: Fix vendor links
  //           router.push(getCollectivePageRoute(data as { slug: string }));
  //         }
  //         addToRecent({ key: data.slug.toString(), type, data });
  //         break;
  //       case 'expense':
  //         router.push(getExpensePageUrl(data as Expense));
  //         addToRecent({ key: data.legacyId.toString(), type, data });

  //         break;
  //       case 'transaction':
  //         if (account?.slug === 'root-actions' || account?.isHost) {
  //           router.push(`/dashboard/${account.slug}/host-transactions?openTransactionId=${data.legacyId}`);
  //         } else if (workspace.slug) {
  //           router.push(`/dashboard/${workspace.slug}/transactions?openTransactionId=${data.legacyId}`);
  //         }
  //         addToRecent({ key: data.legacyId.toString(), type, data });
  //         break;
  //       case 'comment':
  //         router.push(getCommentUrl(data as Comment, LoggedInUser));
  //         // Skip adding comments to recent
  //         break;
  //       case 'order':
  //         router.push(getOrderUrl(data as Order, LoggedInUser));
  //         addToRecent({ key: data.legacyId.toString(), type, data });
  //         break;
  //       case 'update':
  //         router.push(getUpdateUrl(data as Update, LoggedInUser));
  //         addToRecent({ key: data.legacyId.toString(), type, data });
  //         break;
  //       case 'page':
  //         router.push(`/dashboard/${workspace.slug}/${data.section}`);
  //         // Skip adding dashboard pages to recent
  //         break;
  //     }
  //   };

  switch (queryFilter.values.entity) {
    case SearchEntity.ALL:
      if (loading) {
        return (
          <div>
            <Skeleton className="h-12" />
          </div>
        );
      }
      if (!totalCount) {
        return <EmptyResults hasFilters={false} />;
      }
      return (
        <div className="space-y-8">
          <SearchResultsGroup
            label="Accounts"
            totalCount={data?.search.results.accounts.collection.totalCount}
            nodes={data?.search.results.accounts.collection.nodes}
            renderNode={account => (
              <Link
                key={account.id}
                className="block w-full"
                href={getCollectivePageRoute(account)}
                // onClick={e => e.preventDefault()}
              >
                <AccountResult account={account} highlights={data.search.results.accounts.highlights[account.id]} />
              </Link>
            )}
          />
          <SearchResultsGroup
            label="Expenses"
            totalCount={data?.search.results.expenses.collection.totalCount}
            nodes={data?.search.results.expenses.collection.nodes}
            renderNode={expense => (
              <Link
                key={expense.id}
                className="block w-full"
                href={getExpensePageUrl(expense)}
                // onClick={e => e.preventDefault()}
              >
                <ExpenseResult expense={expense} highlights={data.search.results.expenses.highlights[expense.id]} />
              </Link>
            )}
          />

          <SearchResultsGroup
            label="Contributions"
            totalCount={data?.search.results.orders.collection.totalCount}
            nodes={data?.search.results.orders.collection.nodes}
            renderNode={order => (
              <Link
                key={order.id}
                className="block w-full"
                href={getOrderUrl(order, LoggedInUser)}
                //   onClick={e => e.preventDefault()}
              >
                <OrderResult order={order} highlights={data.search.results.orders.highlights[order.id]} />
              </Link>
            )}
          />

          <SearchResultsGroup
            label="Transactions"
            totalCount={data?.search.results.transactions.collection.totalCount}
            nodes={data?.search.results.transactions.collection.nodes}
            renderNode={transaction => (
              <TransactionResult
                key={transaction.id}
                transaction={transaction}
                highlights={data.search.results.transactions.highlights[transaction.id]}
              />
            )}
          />

          <SearchResultsGroup
            label="Updates"
            totalCount={data?.search.results.updates.collection.totalCount}
            nodes={data?.search.results.updates.collection.nodes}
            renderNode={update => (
              <Link
                key={update.id}
                className="block w-full"
                href={getUpdateUrl(update, LoggedInUser)}
                // onClick={e => e.preventDefault()}
              >
                <UpdateResult update={update} highlights={data.search.results.updates.highlights[update.id]} />
              </Link>
            )}
          />
          <SearchResultsGroup
            label="Comments"
            totalCount={data?.search.results.comments.collection.totalCount}
            nodes={data?.search.results.comments.collection.nodes.filter(comment =>
              getCommentUrl(comment, LoggedInUser),
            )} // We still have some comments on deleted entities. See https://github.com/opencollective/opencollective/issues/7734.
            renderNode={comment => (
              <Link
                key={comment.id}
                className="block w-full"
                href={getCommentUrl(comment, LoggedInUser)}
                onClick={e => e.preventDefault()}
              >
                <CommentResult comment={comment} highlights={data.search.results.comments.highlights[comment.id]} />
              </Link>
            )}
          />
        </div>
      );
    case SearchEntity.ACCOUNTS:
      return (
        <SearchResultsGroup
          //   label="Accounts"
          totalCount={data?.search.results.accounts.collection.totalCount}
          nodes={data?.search.results.accounts.collection.nodes}
          showEmpty
          renderNode={account => (
            <Link
              key={account.id}
              className="block w-full"
              href={getCollectivePageRoute(account)}
              //   onClick={e => e.preventDefault()}
            >
              <AccountResult account={account} highlights={data.search.results.accounts.highlights[account.id]} />
            </Link>
          )}
        />
      );
    case SearchEntity.EXPENSES:
      return (
        <SearchResultsGroup
          //   label="Expenses"
          totalCount={data?.search.results.expenses.collection.totalCount}
          nodes={data?.search.results.expenses.collection.nodes}
          showEmpty
          renderNode={expense => (
            <Link
              key={expense.id}
              className="block w-full"
              href={getExpensePageUrl(expense)}
              // onClick={e => e.preventDefault()}
            >
              <ExpenseResult expense={expense} highlights={data.search.results.expenses.highlights[expense.id]} />
            </Link>
          )}
        />
      );
    case SearchEntity.CONTRIBUTIONS:
      return (
        <SearchResultsGroup
          totalCount={data?.search.results.orders.collection.totalCount}
          nodes={data?.search.results.orders.collection.nodes}
          showEmpty
          renderNode={order => (
            <Link
              key={order.id}
              className="block w-full"
              href={getOrderUrl(order, LoggedInUser)}
              //   onClick={e => e.preventDefault()}
            >
              <OrderResult order={order} highlights={data.search.results.orders.highlights[order.id]} />
            </Link>
          )}
        />
      );
    case SearchEntity.COMMENTS:
      return (
        <SearchResultsGroup
          totalCount={data?.search.results.comments.collection.totalCount}
          nodes={data?.search.results.comments.collection.nodes.filter(comment => getCommentUrl(comment, LoggedInUser))} // We still have some comments on deleted entities. See https://github.com/opencollective/opencollective/issues/7734.
          showEmpty
          renderNode={comment => (
            <Link
              key={comment.id}
              className="block w-full"
              href={getCommentUrl(comment, LoggedInUser)}
              onClick={e => e.preventDefault()}
            >
              <CommentResult comment={comment} highlights={data.search.results.comments.highlights[comment.id]} />
            </Link>
          )}
        />
      );
    case SearchEntity.TRANSACTIONS:
      return (
        <SearchResultsGroup
          label="Transactions"
          totalCount={data?.search.results.transactions.collection.totalCount}
          nodes={data?.search.results.transactions.collection.nodes}
          showEmpty
          renderNode={transaction => (
            <TransactionResult
              key={transaction.id}
              transaction={transaction}
              highlights={data.search.results.transactions.highlights[transaction.id]}
            />
          )}
        />
      );
    case SearchEntity.UPDATES:
      return (
        <SearchResultsGroup
          label="Updates"
          totalCount={data?.search.results.updates.collection.totalCount}
          nodes={data?.search.results.updates.collection.nodes}
          showEmpty
          renderNode={update => (
            <Link
              key={update.id}
              className="block w-full"
              href={getUpdateUrl(update, LoggedInUser)}
              // onClick={e => e.preventDefault()}
            >
              <UpdateResult update={update} highlights={data.search.results.updates.highlights[update.id]} />
            </Link>
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
}: {
  label?: string;
  totalCount?: number;
  nodes: unknown[];
  renderNode: (node: unknown) => React.ReactNode;
  showEmpty?: boolean;
}) {
  if (showEmpty && totalCount === 0) {
    return <EmptyResults hasFilters />;
  } else if (!totalCount) {
    return null;
  }
  const moreCount = totalCount - nodes.length;
  return (
    <div className="space-y-2 text-sm">
      <p>{label}</p>
      <div className="space-y-4">{nodes.map(renderNode)}</div>
      {moreCount > 0 && <button>See {moreCount} more results</button>}
    </div>
  );
}
