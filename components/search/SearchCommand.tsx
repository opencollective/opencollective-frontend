import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { Command as CommandPrimitive } from 'cmdk';
import { pick } from 'lodash';
import {
  ArrowRightLeft,
  ChevronRight,
  Coins,
  Megaphone,
  MessageCircle,
  Receipt,
  SearchIcon,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useDebouncedValue from '../../lib/hooks/useDebouncedValue';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../lib/hooks/useQueryFilter';
import { getCommentUrl, getDashboardRoute } from '../../lib/url-helpers';
import { i18nSearchEntity } from '@/lib/i18n/search';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
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
import { useGetLinkProps } from './lib';
import { PageResult } from './PageResult';
import { searchCommandQuery } from './queries';
import { schema, SearchEntity } from './schema';
import { SearchCommandLegend } from './SearchCommandLegend';
import { useRecentlyVisited } from './useRecentlyVisited';

const entityOptions = {
  [SearchEntity.ACCOUNTS]: {
    value: SearchEntity.ACCOUNTS,
    icon: Users,
    className: 'bg-blue-50 text-blue-700',
  },
  [SearchEntity.EXPENSES]: {
    value: SearchEntity.EXPENSES,
    icon: Receipt,
    className: 'bg-green-50 text-green-700',
  },
  [SearchEntity.CONTRIBUTIONS]: {
    value: SearchEntity.CONTRIBUTIONS,
    icon: Coins,
    className: 'bg-amber-50 text-amber-700',
  },
  [SearchEntity.TRANSACTIONS]: {
    value: SearchEntity.TRANSACTIONS,
    icon: ArrowRightLeft,
    className: 'bg-purple-50 text-purple-700',
  },
  [SearchEntity.UPDATES]: {
    value: SearchEntity.UPDATES,
    icon: Megaphone,
    className: 'bg-sky-50 text-sky-700',
  },
  [SearchEntity.COMMENTS]: {
    value: SearchEntity.COMMENTS,
    icon: MessageCircle,
    className: 'bg-slate-100 text-slate-700',
  },
};

export const SearchCommand = ({ open, setOpen }) => {
  const router = useRouter();
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const { workspace } = useWorkspace();
  const isUsingSearchResultsPage = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_RESULTS_PAGE);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { account } = React.useContext(DashboardContext);
  const defaultContext = useMemo((): { slug: string; type: 'account' | 'host' } | undefined => {
    return workspace?.isHost
      ? { slug: workspace.slug, type: 'host' }
      : workspace?.slug && workspace.slug !== 'root-actions'
        ? { slug: workspace.slug, type: 'account' }
        : undefined;
  }, [workspace]);

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
      entity: val => {
        switch (val) {
          case SearchEntity.ALL:
            return {
              useTopHits: true,
              includeAccounts: true,
              includeTransactions: true,
              includeExpenses: true,
              includeOrders: true,
              includeUpdates: true,
              includeComments: true,
              limit: 5, // default is 20 according to schema
            };
          case SearchEntity.EXPENSES:
            return {
              useTopHits: false,
              includeAccounts: false,
              includeTransactions: false,
              includeExpenses: true,
              includeOrders: false,
              includeUpdates: false,
              includeComments: false,
            };
          case SearchEntity.TRANSACTIONS:
            return {
              useTopHits: false,
              includeAccounts: false,
              includeTransactions: true,
              includeExpenses: false,
              includeOrders: false,
              includeUpdates: false,
              includeComments: false,
            };
          case SearchEntity.ACCOUNTS:
            return {
              useTopHits: false,
              includeTransactions: false,
              includeExpenses: false,
              includeOrders: false,
              includeUpdates: false,
              includeComments: false,
              includeAccounts: true,
            };
          case SearchEntity.CONTRIBUTIONS:
            return {
              useTopHits: false,
              includeAccounts: false,
              includeTransactions: false,
              includeExpenses: false,
              includeOrders: true,
              includeUpdates: false,
              includeComments: false,
            };
          case SearchEntity.UPDATES:
            return {
              useTopHits: false,
              includeAccounts: false,
              includeTransactions: false,
              includeExpenses: false,
              includeOrders: false,
              includeUpdates: true,
              includeComments: false,
            };
          case SearchEntity.COMMENTS:
            return {
              useTopHits: false,
              includeAccounts: false,
              includeTransactions: false,
              includeExpenses: false,
              includeOrders: false,
              includeUpdates: false,
              includeComments: true,
            };
        }
      },
    },
    defaultFilterValues: { workspace: account?.slug },
    skipRouter: true,
  });

  useEffect(() => {
    if (open) {
      queryFilter.setFilters({ workspace: account?.slug, entity: SearchEntity.ALL });
    }
  }, [open, account?.slug]);

  const {
    data,
    loading,
    fetchMore,
    variables: usedVariables,
  } = useQuery(searchCommandQuery, {
    variables: { includeTransactions: true, ...queryFilter.variables, imageHeight: 72, __infiniteScroll: true },
    notifyOnNetworkStatusChange: true,
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
    skip: !queryFilter.values.searchTerm,
  });

  // Track if we're loading more results
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Determine if infinite scroll should be enabled
  const isInfiniteScrollEnabled = queryFilter.values.entity !== SearchEntity.ALL;

  const { debouncedValue: debouncedInput, isDebouncing } = useDebouncedValue(input, 500);
  useEffect(() => {
    if (debouncedInput?.length > 0) {
      queryFilter.setFilter('searchTerm', debouncedInput);
    } else {
      queryFilter.setFilter('searchTerm', undefined);
    }
  }, [debouncedInput]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '') {
            if (queryFilter.values.entity !== SearchEntity.ALL) {
              queryFilter.setFilter('entity', SearchEntity.ALL);
            } else {
              queryFilter.setFilter('workspace', undefined);
            }
          }
        }
      }
    },
    [queryFilter],
  );

  const { recentlyVisited, removeFromRecent } = useRecentlyVisited();
  const { getLinkProps } = useGetLinkProps();

  const isLoading = loading || isDebouncing;
  const hasSearchTerm = !!input;
  const dataMatchesCurrentSearch = data?.search?.results && input === usedVariables.searchTerm;
  const hasData = hasSearchTerm && dataMatchesCurrentSearch;
  const isInitialLoading = isLoading && !hasData && hasSearchTerm;

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

  const filteredEntityOptions = React.useMemo(() => {
    if (queryFilter.values.workspace) {
      return Object.values(
        pick(entityOptions, [
          SearchEntity.ACCOUNTS,
          SearchEntity.EXPENSES,
          SearchEntity.CONTRIBUTIONS,
          SearchEntity.TRANSACTIONS,
          SearchEntity.UPDATES,
        ]),
      );
    }
    return Object.values(pick(entityOptions, [SearchEntity.ACCOUNTS, SearchEntity.UPDATES]));
  }, [queryFilter.values.workspace]);

  const filteredGoToPages = React.useMemo(() => {
    if (!queryFilter.values.workspace || !input || queryFilter.values.entity !== SearchEntity.ALL) {
      return [];
    }

    return flattenedMenuItems
      .filter(menuItem =>
        (menuItem.group ? `${menuItem.group} ${menuItem.label}` : menuItem.label)
          .toString()
          .toLowerCase()
          .includes(input.toLowerCase()),
      )
      .slice(0, 5);
  }, [input, flattenedMenuItems, queryFilter.values]);

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

  // Handle infinite scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!isInfiniteScrollEnabled || !data || isLoadingMore || loading) {
        return;
      }

      const target = e.target as HTMLDivElement;
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

      // Trigger load more when within 100px of bottom
      if (scrollBottom < 100) {
        const results = data?.search?.results;
        if (!results) {
          return;
        }

        // Determine which entity collection to load more of
        let shouldLoadMore = false;
        let currentOffset = 0;
        let totalCount = 0;

        switch (queryFilter.values.entity) {
          case SearchEntity.ACCOUNTS:
            currentOffset = results.accounts?.collection.nodes.length || 0;
            totalCount = results.accounts?.collection.totalCount || 0;
            shouldLoadMore = currentOffset < totalCount;
            break;
          case SearchEntity.EXPENSES:
            currentOffset = results.expenses?.collection.nodes.length || 0;
            totalCount = results.expenses?.collection.totalCount || 0;
            shouldLoadMore = currentOffset < totalCount;
            break;
          case SearchEntity.CONTRIBUTIONS:
            currentOffset = results.orders?.collection.nodes.length || 0;
            totalCount = results.orders?.collection.totalCount || 0;
            shouldLoadMore = currentOffset < totalCount;
            break;
          case SearchEntity.TRANSACTIONS:
            currentOffset = results.transactions?.collection.nodes.length || 0;
            totalCount = results.transactions?.collection.totalCount || 0;
            shouldLoadMore = currentOffset < totalCount;
            break;
          case SearchEntity.UPDATES:
            currentOffset = results.updates?.collection.nodes.length || 0;
            totalCount = results.updates?.collection.totalCount || 0;
            shouldLoadMore = currentOffset < totalCount;
            break;
          case SearchEntity.COMMENTS:
            currentOffset = results.comments?.collection.nodes.length || 0;
            totalCount = results.comments?.collection.totalCount || 0;
            shouldLoadMore = currentOffset < totalCount;
            break;
        }

        if (shouldLoadMore) {
          setIsLoadingMore(true);
          fetchMore({
            variables: {
              offset: currentOffset,
            },
          }).finally(() => {
            setIsLoadingMore(false);
          });
        }
      }
    },
    [isInfiniteScrollEnabled, data, isLoadingMore, loading, fetchMore, queryFilter.values.entity],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={false}
      onKeyDown={handleKeyDown}
      description={intl.formatMessage({
        defaultMessage: 'Search for accounts, expenses, transactions, updates, comments, and more',
        id: 'wdsjMO',
      })}
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
        {queryFilter.values.entity !== SearchEntity.ALL && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            {i18nSearchEntity(intl, queryFilter.values.entity)} <ChevronRight size={10} className="!size-4" />
          </span>
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

      <CommandList
        ref={listRef}
        onScroll={handleScroll}
        className="max-h-[600px] border-t-0 border-b [&_.text-xs_mark]:px-1 [&_.text-xs_mark]:py-[1px] [&_mark]:rounded-xl [&_mark]:bg-amber-100 [&_mark]:px-1 [&_mark]:py-2"
      >
        <CommandItem value="-" className="hidden" />
        {!queryFilter.values.workspace &&
          defaultContext &&
          input.length === 0 &&
          queryFilter.values.entity === SearchEntity.ALL && (
            <CommandGroup heading="">
              <SearchCommandItem
                onSelect={() => {
                  queryFilter.setFilter('workspace', defaultContext.slug);
                  setInput('');
                }}
                actionLabel={intl.formatMessage({ defaultMessage: 'Search in workspace', id: 'idTzf7' })}
                showAction
              >
                <ContextPill slug={defaultContext.slug} />
              </SearchCommandItem>
              <hr className="separator -mx-2 my-2 h-px bg-border" />
            </CommandGroup>
          )}

        {input.length === 0 && queryFilter.values.entity === SearchEntity.ALL && (
          <CommandGroup heading="" className="[&:last-child_.separator]:hidden">
            {filteredEntityOptions.map(opt => {
              const entityLabel = i18nSearchEntity(intl, opt.value);
              return (
                <SearchCommandItem
                  key={opt.value}
                  onSelect={() => {
                    queryFilter.setFilter('entity', opt.value);
                  }}
                  value={opt.value}
                  actionLabel={`Search in ${opt.value.toLowerCase()}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('flex size-9 items-center justify-center rounded-md', opt.className)}>
                      <opt.icon />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground group-hover:text-foreground">
                        {entityLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {queryFilter.values.workspace ? (
                          <FormattedMessage
                            defaultMessage="Find {entities} in your workspace."
                            id="SnHGJH"
                            values={{ entities: entityLabel }}
                          />
                        ) : (
                          <FormattedMessage
                            defaultMessage="Find any {entities} on the platform."
                            id="HplALu"
                            values={{ entities: entityLabel }}
                          />
                        )}
                      </span>
                    </div>
                  </div>
                </SearchCommandItem>
              );
            })}
            <hr className="separator -mx-2 my-2 h-px bg-border" />
          </CommandGroup>
        )}

        {input.length > 0 && isUsingSearchResultsPage && (
          <React.Fragment>
            <CommandGroup heading="" className="[&:last-child_.separator]:hidden">
              {defaultContext && (
                <SearchCommandItem
                  onSelect={() => {
                    queryFilter.resetFilters(
                      { searchTerm: input, workspace: defaultContext.slug },
                      getDashboardRoute(workspace, ALL_SECTIONS.SEARCH),
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
                  queryFilter.resetFilters({ searchTerm: input, workspace: 'ALL' }, '/search-results');
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

        {recentlyVisited.length > 0 && input === '' && queryFilter.values.entity === SearchEntity.ALL && (
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
                  onDelete={() => removeFromRecent(recentVisit.key)}
                >
                  <Link href={href} className="block w-full">
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
                  <Link href={href} className="block w-full">
                    <PageResult page={page} />
                  </Link>
                </SearchCommandItem>
              );
            })}
            <hr className="separator -mx-2 my-2 h-px bg-border" />
          </CommandGroup>
        )}
        {isInitialLoading && input !== '' && (
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
        {hasData && (
          <React.Fragment>
            <SearchCommandGroup
              label="Accounts"
              entity={SearchEntity.ACCOUNTS}
              type="account"
              totalCount={data?.search.results.accounts?.collection.totalCount}
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              nodes={data?.search.results.accounts?.collection.nodes}
              renderNode={account => (
                <AccountResult account={account} highlights={data?.search.results.accounts?.highlights[account.id]} />
              )}
              isInfiniteScrollEnabled={isInfiniteScrollEnabled}
            />
            <SearchCommandGroup
              label="Expenses"
              entity={SearchEntity.EXPENSES}
              type="expense"
              totalCount={data?.search.results.expenses?.collection.totalCount}
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              nodes={data?.search.results.expenses?.collection.nodes}
              renderNode={expense => (
                <ExpenseResult expense={expense} highlights={data?.search.results.expenses?.highlights[expense.id]} />
              )}
              isInfiniteScrollEnabled={isInfiniteScrollEnabled}
            />
            <SearchCommandGroup
              label="Contributions"
              entity={SearchEntity.CONTRIBUTIONS}
              type="order"
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              totalCount={data?.search.results.orders?.collection.totalCount}
              nodes={data?.search.results.orders?.collection.nodes}
              renderNode={order => (
                <OrderResult order={order} highlights={data?.search.results.orders?.highlights[order.id]} />
              )}
              isInfiniteScrollEnabled={isInfiniteScrollEnabled}
            />

            <SearchCommandGroup
              label="Transactions"
              entity={SearchEntity.TRANSACTIONS}
              type="transaction"
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              totalCount={data?.search.results.transactions?.collection.totalCount}
              nodes={data?.search.results.transactions?.collection.nodes}
              renderNode={transaction => (
                <TransactionResult
                  transaction={transaction}
                  highlights={data?.search.results.transactions?.highlights[transaction.id]}
                />
              )}
              isInfiniteScrollEnabled={isInfiniteScrollEnabled}
            />

            <SearchCommandGroup
              label="Updates"
              entity={SearchEntity.UPDATES}
              type="update"
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              totalCount={data?.search.results.updates?.collection.totalCount}
              nodes={data?.search.results.updates?.collection.nodes}
              renderNode={update => (
                <UpdateResult update={update} highlights={data?.search.results.updates?.highlights[update.id]} />
              )}
              isInfiniteScrollEnabled={isInfiniteScrollEnabled}
            />
            <SearchCommandGroup
              label="Comments"
              entity={SearchEntity.COMMENTS}
              type="comment"
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              totalCount={data?.search.results.comments?.collection.totalCount}
              nodes={data?.search.results.comments?.collection.nodes.filter(comment =>
                getCommentUrl(comment, LoggedInUser),
              )} // We still have some comments on deleted entities. See https://github.com/opencollective/opencollective/issues/7734.
              renderNode={comment => (
                <CommentResult comment={comment} highlights={data?.search.results.comments?.highlights[comment.id]} />
              )}
              isInfiniteScrollEnabled={isInfiniteScrollEnabled}
            />
          </React.Fragment>
        )}

        {/* Loading indicator for infinite scroll */}
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Spinner size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading more...</span>
          </div>
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

interface SearchCommandItemProps {
  onSelect?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
  showAction?: boolean;
  className?: string;
  value?: string;
  [key: string]: any;
}

const SearchCommandItem = React.memo<SearchCommandItemProps>(
  ({ onSelect, onDelete, actionLabel = 'Jump to', children, showAction = false, className = undefined, ...props }) => {
    return (
      <CommandItem
        onSelect={onSelect}
        className={cn(
          'justify-between gap-2',
          '[&[data-selected=true]_.action]:bg-background [&[data-selected=true]_.action]:shadow-xs [&[data-selected=true]_.action]:ring [&[data-selected=true]_.action]:ring-border',
          '[&[data-selected=true]_.action]:text-foreground',
          showAction ? '' : '[&[data-selected=false]_.action]:hidden',
          '[&[data-selected=false]_.actions]:hidden',
          className,
        )}
        {...props}
      >
        {children}
        <div className={cn('actions absolute right-2 flex items-center gap-1', showAction ? '' : 'absolute right-2')}>
          <div
            className={cn(
              'action flex items-center gap-1 rounded-md p-1 whitespace-nowrap text-muted-foreground shadow-none transition-colors',
            )}
          >
            {actionLabel}
          </div>
          {onDelete && (
            <button
              className="flex size-7 items-center justify-center rounded-md p-1 ring-border transition-colors hover:bg-background hover:shadow-xs hover:ring"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
            >
              <X className="!size-4" />
            </button>
          )}
        </div>
      </CommandItem>
    );
  },
);

interface SeeMoreItemsCommandItemProps {
  onSelect: () => void;
  totalCount: number;
  limit: number;
  label: string;
}

const SeeMoreItemsCommandItem = React.memo<SeeMoreItemsCommandItemProps>(({ onSelect, totalCount, limit, label }) => {
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
  return null;
});

interface SearchCommandGroupProps {
  totalCount?: number;
  label: string;
  nodes?: any[];
  renderNode: (node: any) => React.ReactNode;
  input: string;
  queryFilter: any;
  entity: SearchEntity;
  setOpen: (open: boolean) => void;
  type: string;
  isInfiniteScrollEnabled?: boolean;
}

const SearchCommandGroup = React.memo<SearchCommandGroupProps>(
  ({
    totalCount,
    label,
    nodes,
    renderNode,
    input,
    queryFilter,
    entity,
    setOpen,
    type,
    isInfiniteScrollEnabled = false,
  }) => {
    const { LoggedInUser } = useLoggedInUser();
    const isUsingSearchResultsPage = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_RESULTS_PAGE);

    const { workspace } = useWorkspace();
    const router = useRouter();
    const { getLinkProps } = useGetLinkProps();

    if (!totalCount || input === '') {
      return null;
    }

    const showSeeMore = !isInfiniteScrollEnabled && (nodes?.length || 0) < totalCount;
    return (
      <CommandGroup heading={label} className="[&:last-child_.separator]:hidden">
        {nodes?.map(node => {
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
        {showSeeMore && (
          <SeeMoreItemsCommandItem
            onSelect={() => {
              if (isUsingSearchResultsPage) {
                queryFilter.resetFilters(
                  { ...queryFilter.values, entity },

                  queryFilter.values.workspace ? getDashboardRoute(workspace, ALL_SECTIONS.SEARCH) : '/search-results',
                );
                setOpen(false);
              } else {
                queryFilter.setFilter('entity', entity);
              }
            }}
            key={`more-${entity}`}
            totalCount={totalCount}
            limit={queryFilter.variables.limit}
            label={label}
          />
        )}
        <hr className="separator -mx-2 my-2 h-px bg-border" />
      </CommandGroup>
    );
  },
);
