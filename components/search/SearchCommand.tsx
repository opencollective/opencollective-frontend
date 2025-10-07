import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Command as CommandPrimitive } from 'cmdk';
import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useDebouncedValue from '../../lib/hooks/useDebouncedValue';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../lib/hooks/useQueryFilter';
import {
  getCollectivePageRoute,
  getCommentUrl,
  getDashboardRoute,
  getExpensePageUrl,
  getOrderUrl,
  getUpdateUrl,
} from '../../lib/url-helpers';
import type { Comment, Expense, Order, Update } from '@/lib/graphql/types/v2/schema';
import { cn } from '@/lib/utils';

import { ALL_SECTIONS } from '../dashboard/constants';
import { DashboardContext } from '../dashboard/DashboardContext';
import { getMenuItems } from '../dashboard/Menu';
import Link from '../Link';
import Spinner from '../Spinner';
import { CommandDialog, CommandGroup, CommandItem, CommandList } from '../ui/Command';
import { DialogTitle } from '../ui/Dialog';
import { Skeleton } from '../ui/Skeleton';
import { useWorkspace } from '../WorkspaceProvider';

import { AccountResult } from './result/AccountResult';
import { CommentResult } from './result/CommentResult';
import { ExpenseResult } from './result/ExpenseResult';
import { OrderResult } from './result/OrderResult';
import { TransactionResult } from './result/TransactionResult';
import { UpdateResult } from './result/UpdateResult';
import { ContextPill } from './ContextPill';
import { PageResult } from './PageResult';
import { searchCommandQuery } from './queries';
import { schema, SearchEntity } from './schema';
import { SearchCommandLegend } from './SearchCommandLegend';
import type { PageVisit } from './useRecentlyVisited';
import { useRecentlyVisited } from './useRecentlyVisited';
import { useGetLinkProps } from './lib';
// TODO i18n
export const SearchCommand = ({ open, setOpen }) => {
  const router = useRouter();
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const { workspace } = useWorkspace();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { account } = React.useContext(DashboardContext);
  const defaultContext = useMemo((): { slug: string; type: 'account' | 'host' } | undefined => {
    return account?.isHost
      ? { slug: account.slug, type: 'host' }
      : account?.slug && account.slug !== 'root-actions'
        ? { slug: account.slug, type: 'account' }
        : undefined;
  }, [account?.isHost, account?.slug]);

  const [input, setInput] = React.useState('');
  const queryFilter = useQueryFilter({
    schema,
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
    },
    defaultFilterValues: { workspace: account?.slug },
    skipRouter: true,
  });

  // useEffect(() => {
  //   if (open) {
  //     queryFilter.setFilter('workspace', account?.slug);
  //     queryFilter.setFilter('searchTerm', undefined);
  //     setInput('');
  //   }
  // }, [open]);

  const { data, loading } = useQuery(searchCommandQuery, {
    variables: { includeTransactions: true, ...queryFilter.variables, imageHeight: 72 },
    notifyOnNetworkStatusChange: true,
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
    skip: !queryFilter.values.searchTerm,
  });

  const { debouncedValue: debouncedInput, isDebouncing } = useDebouncedValue(input, 500);
  useEffect(() => {
    if (debouncedInput?.length > 0) {
      queryFilter.setFilter('searchTerm', debouncedInput);
    }
  }, [debouncedInput]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '') {
            queryFilter.setFilter('workspace', undefined);
          }
        }
      }
    },
    [queryFilter],
  );

  const { recentlyVisited } = useRecentlyVisited();
  const { getLinkProps } = useGetLinkProps();

  const isLoading = loading || isDebouncing;

  const flattenedMenuItems = React.useMemo(() => {
    const menuItems = account ? getMenuItems({ intl, account, LoggedInUser }) : [];

    return menuItems
      .flatMap(menuItem =>
        'subMenu' in menuItem
          ? menuItem.subMenu.map(subItem => ({
              ...subItem,
              Icon: menuItem.Icon,
              group: menuItem.label,
            }))
          : menuItem,
      )
      .filter(item => item.section !== ALL_SECTIONS.SEARCH);
  }, [intl, account, LoggedInUser]);

  const filteredGoToPages = React.useMemo(() => {
    if (!queryFilter.values.workspace || !debouncedInput) {
      return [];
    }

    return flattenedMenuItems.filter(menuItem =>
      (menuItem.group ? `${menuItem.group} ${menuItem.label}` : menuItem.label)
        .toString()
        .toLowerCase()
        .includes(debouncedInput.toLowerCase()),
    );
  }, [debouncedInput, flattenedMenuItems, queryFilter.values.workspace]);

  const hasSearchResults = React.useMemo(() => {
    if (!data?.search?.results) {
      return false;
    }
    const results = data.search.results;
    return (
      (results.accounts?.collection?.totalCount || 0) > 0 ||
      (results.expenses?.collection?.totalCount || 0) > 0 ||
      (results.orders?.collection?.totalCount || 0) > 0 ||
      (results.transactions?.collection?.totalCount || 0) > 0 ||
      (results.updates?.collection?.totalCount || 0) > 0 ||
      (results.comments?.collection?.totalCount || 0) > 0
    );
  }, [data]);

  const showNoResults = debouncedInput !== '' && !isLoading && filteredGoToPages.length === 0 && !hasSearchResults;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={false}
      onKeyDown={handleKeyDown}
      description="Search for accounts, expenses, transactions, updates, comments, and more"
      className="sm:max-w-2xl"
    >
      <DialogTitle className="hidden">
        <FormattedMessage defaultMessage="Search" id="Search" />
      </DialogTitle>
      <div className="group flex items-center gap-3 border-b px-3" cmdk-input-wrapper="">
        <SearchIcon className="shrink-0 text-muted-foreground" size={16} />
        {queryFilter.values.workspace && (
          <ContextPill
            slug={queryFilter.values.workspace}
            onRemove={() => queryFilter.setFilter('workspace', undefined)}
          />
        )}
        <CommandPrimitive.Input
          ref={inputRef}
          onValueChange={setInput}
          value={input}
          placeholder="Search..."
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isLoading && <Spinner size={16} className="absolute right-4 text-muted-foreground" />}
      </div>

      <CommandList className="max-h-[600px] border-t-0 border-b [&_.text-xs_mark]:px-1 [&_.text-xs_mark]:py-[1px] [&_mark]:rounded-xl [&_mark]:bg-amber-100 [&_mark]:px-1 [&_mark]:py-2">
        <CommandItem value="-" className="hidden" />

        {!queryFilter.values.workspace && defaultContext && input.length === 0 && (
          <CommandGroup heading="">
            <SearchCommandItem
              onSelect={() => {
                queryFilter.setFilter('workspace', defaultContext.slug);
                setInput('');
              }}
              actionLabel={'Add workspace'}
              showAction
            >
              <ContextPill slug={defaultContext.slug} />
            </SearchCommandItem>
          </CommandGroup>
        )}
        {input.length > 0 && (
          <React.Fragment>
            <CommandGroup heading="" className="[&:last-child_.separator]:hidden">
              {defaultContext && (
                <SearchCommandItem
                  onSelect={() => {
                    queryFilter.resetFilters(
                      { searchTerm: input, workspace: defaultContext.slug },
                      getDashboardRoute(account, ALL_SECTIONS.SEARCH),
                    );
                    setOpen(false);
                  }}
                  actionLabel={'Search in this workspace'}
                  showAction
                >
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <SearchIcon />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-sm">
                        <ContextPill slug={defaultContext.slug} /> {input}
                      </div>
                    </div>
                  </div>
                </SearchCommandItem>
              )}

              <SearchCommandItem
                onSelect={() => {
                  queryFilter.resetFilters(
                    { searchTerm: input, workspace: 'ALL' },
                    getDashboardRoute(account, ALL_SECTIONS.SEARCH),
                  );
                  setOpen(false);
                }}
                actionLabel={'Search all of Open Collective'}
                showAction
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <SearchIcon />
                  </div>
                  <div className="flex flex-col">
                    <div className="">{input}</div>
                  </div>
                </div>
              </SearchCommandItem>
              <hr className="separator -mx-2 my-2 h-px bg-border" />
            </CommandGroup>
          </React.Fragment>
        )}

        {recentlyVisited.length > 0 && input === '' && (
          <CommandGroup heading="Recent">
            {recentlyVisited.map(recentVisit => {
              const { href, onClick } = getLinkProps(recentVisit);
              return (
                <SearchCommandItem
                  key={recentVisit.key}
                  onSelect={() => {
                    router.push(href);
                    setOpen(false);
                    onClick?.();
                  }}
                >
                  <Link href={href}>
                    {recentVisit.type === 'account' && <AccountResult account={recentVisit.data} />}
                    {recentVisit.type === 'expense' && <ExpenseResult expense={recentVisit.data} />}
                    {recentVisit.type === 'order' && <OrderResult order={recentVisit.data} />}
                    {recentVisit.type === 'transaction' && <TransactionResult transaction={recentVisit.data} />}
                    {recentVisit.type === 'update' && <UpdateResult update={recentVisit.data} />}
                  </Link>
                </SearchCommandItem>
              );
            })}
          </CommandGroup>
        )}

        {filteredGoToPages.length > 0 && (
          <CommandGroup heading="Go to" className="[&:last-child_.separator]:hidden">
            {filteredGoToPages.map(page => {
              const { href, onClick } = getLinkProps({ type: 'page', data: page });
              return (
                <SearchCommandItem
                  key={page.section}
                  onSelect={() => {
                    router.push(href);
                    setOpen(false);
                    onClick?.();
                  }}
                >
                  <Link href={href}>
                    <PageResult page={page} />
                  </Link>
                </SearchCommandItem>
              );
            })}
            <hr className="separator -mx-2 my-2 h-px bg-border" />
          </CommandGroup>
        )}
        {isLoading && input !== '' && (
          <CommandGroup heading="Loading...">
            {[1, 2, 3, 4, 5].map(id => (
              <div key={`skeleton-${id}`} className="flex items-center gap-2 px-2 py-3">
                <Skeleton className="size-9 shrink-0 rounded-md" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CommandGroup>
        )}
        {!isLoading && (
          <React.Fragment>
            <SearchCommandGroup
              label="Accounts"
              entity={SearchEntity.ACCOUNTS}
              type="account"
              totalCount={data?.search.results.accounts.collection.totalCount}
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              nodes={data?.search.results.accounts.collection.nodes}
              renderNode={account => (
                <AccountResult account={account} highlights={data.search.results.accounts.highlights[account.id]} />
              )}
            />
            <SearchCommandGroup
              label="Expenses"
              entity={SearchEntity.EXPENSES}
              type="expense"
              totalCount={data?.search.results.expenses.collection.totalCount}
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              nodes={data?.search.results.expenses.collection.nodes}
              renderNode={expense => (
                <ExpenseResult expense={expense} highlights={data.search.results.expenses.highlights[expense.id]} />
              )}
            />
            <SearchCommandGroup
              label="Contributions"
              entity={SearchEntity.CONTRIBUTIONS}
              type="order"
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              totalCount={data?.search.results.orders.collection.totalCount}
              nodes={data?.search.results.orders.collection.nodes}
              renderNode={order => (
                <OrderResult order={order} highlights={data.search.results.orders.highlights[order.id]} />
              )}
            />

            <SearchCommandGroup
              label="Transactions"
              entity={SearchEntity.TRANSACTIONS}
              type="transaction"
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              totalCount={data?.search.results.transactions.collection.totalCount}
              nodes={data?.search.results.transactions.collection.nodes}
              renderNode={transaction => (
                <TransactionResult
                  transaction={transaction}
                  highlights={data.search.results.transactions.highlights[transaction.id]}
                />
              )}
            />

            <SearchCommandGroup
              label="Updates"
              entity={SearchEntity.UPDATES}
              type="update"
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              totalCount={data?.search.results.updates.collection.totalCount}
              nodes={data?.search.results.updates.collection.nodes}
              renderNode={update => (
                <UpdateResult update={update} highlights={data.search.results.updates.highlights[update.id]} />
              )}
            />
            <SearchCommandGroup
              label="Comments"
              entity={SearchEntity.COMMENTS}
              type="comment"
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              totalCount={data?.search.results.comments.collection.totalCount}
              nodes={data?.search.results.comments.collection.nodes.filter(comment =>
                getCommentUrl(comment, LoggedInUser),
              )} // We still have some comments on deleted entities. See https://github.com/opencollective/opencollective/issues/7734.
              renderNode={comment => (
                <CommentResult comment={comment} highlights={data.search.results.comments.highlights[comment.id]} />
              )}
            />
          </React.Fragment>
        )}
        {showNoResults && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="No results" id="search.noResults" />
          </div>
        )}
      </CommandList>
      <SearchCommandLegend />
    </CommandDialog>
  );
};

function SearchCommandItem({ onSelect, actionLabel = 'Jump to', children, showAction = false, className = undefined }) {
  return (
    <CommandItem
      onSelect={onSelect}
      className={cn(
        'justify-between gap-2',
        '[&[data-selected=true]_.action]:bg-background [&[data-selected=true]_.action]:shadow-xs [&[data-selected=true]_.action]:ring [&[data-selected=true]_.action]:ring-border',
        '[&[data-selected=true]_.action]:text-foreground',
        showAction ? '' : '[&[data-selected=false]_.action]:hidden',
        className,
      )}
    >
      {children}
      <div
        className={cn(
          'action flex items-center gap-1 rounded-md p-1 whitespace-nowrap text-muted-foreground shadow-none transition-colors',
          showAction ? '' : 'absolute right-2',
        )}
      >
        {actionLabel}
      </div>
    </CommandItem>
  );
}

function SeeMoreItemsCommandItem({ onSelect, totalCount, limit, label }) {
  if (totalCount > limit) {
    return (
      <SearchCommandItem onSelect={onSelect} className="items-center justify-start">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <SearchIcon />
        </div>
        <span>
          See {Number(totalCount - limit).toLocaleString()} more {label}
        </span>
      </SearchCommandItem>
    );
  }
}

function SearchCommandGroup({ totalCount, label, nodes, renderNode, input, queryFilter, entity, setOpen, type }) {
  const { account } = React.useContext(DashboardContext);
  const router = useRouter();
  const { getLinkProps } = useGetLinkProps();
  if (!totalCount || input === '') {
    return null;
  }

  return (
    <CommandGroup heading={label} className="[&:last-child_.separator]:hidden">
      {nodes.map(node => {
        const { href, onClick } = getLinkProps({ type, data: node });
        return (
          <SearchCommandItem
            key={node.id}
            onSelect={() => {
              router.push(href);
              setOpen(false);
              onClick?.();
            }}
          >
            <Link href={href} className="block w-full">
              {renderNode(node)}
            </Link>
          </SearchCommandItem>
        );
      })}
      <SeeMoreItemsCommandItem
        onSelect={() => {
          queryFilter.resetFilters({ ...queryFilter.values, entity }, getDashboardRoute(account, ALL_SECTIONS.SEARCH));
          setOpen(false);
        }}
        key={`more-${entity}`}
        totalCount={totalCount}
        limit={queryFilter.values.limit}
        label={label}
      />
      <hr className="separator -mx-2 my-2 h-px bg-border" />
    </CommandGroup>
  );
}
