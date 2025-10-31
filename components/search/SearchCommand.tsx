import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { Command as CommandPrimitive } from 'cmdk';
import { pick } from 'lodash';
import { ChevronRight, SearchIcon } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useDebouncedValue from '../../lib/hooks/useDebouncedValue';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../lib/hooks/useQueryFilter';
import { getCommentUrl, getDashboardRoute } from '../../lib/url-helpers';
import { i18nSearchEntity } from '@/lib/i18n/search';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import { ALL_SECTIONS } from '../dashboard/constants';
import { DashboardContext } from '../dashboard/DashboardContext';
import { getMenuItems } from '../dashboard/Menu';
import Spinner from '../Spinner';
import { CommandDialog, CommandGroup, CommandItem, CommandList } from '../ui/Command';
import { DialogTitle } from '../ui/Dialog';
import { useWorkspace } from '../WorkspaceProvider';

import { AccountResult } from './result/AccountResult';
import { CommentResult } from './result/CommentResult';
import { ExpenseResult } from './result/ExpenseResult';
import { HostApplicationResult } from './result/HostApplicationResult';
import { LoadingResult } from './result/LoadingResult';
import { OrderResult } from './result/OrderResult';
import { PageResult } from './result/PageResult';
import { TransactionResult } from './result/TransactionResult';
import { UpdateResult } from './result/UpdateResult';
import { ContextPill } from './ContextPill';
import { EntityFilterItem } from './EntityFilterItem';
import { entityFilterOptions, schema, SearchEntity } from './filters';
import { searchCommandQuery } from './queries';
import { RecentVisits } from './RecentVisits';
import { SearchCommandGroup } from './SearchCommandGroup';
import { SearchCommandItem } from './SearchCommandItem';
import { SearchCommandLegend } from './SearchCommandLegend';
import type { DashboardPage } from './types';

export const SearchCommand = ({ open, setOpen }) => {
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
            return { account: { slug: context.slug } };
          } else if (context?.type === 'host') {
            return { host: { slug: context.slug } };
          }
        }
      },
      entity: val => {
        const defaultForEntity = {
          limit: 20,
          useTopHits: false,
          includeAccounts: false,
          includeTransactions: false,
          includeExpenses: false,
          includeOrders: false,
          includeUpdates: false,
          includeComments: false,
          includeHostApplications: false,
        };

        switch (val) {
          case SearchEntity.ALL:
            return {
              limit: 5,
              useTopHits: true,
              includeAccounts: true,
              includeTransactions: true,
              includeExpenses: true,
              includeOrders: true,
              includeUpdates: true,
              includeComments: true,
              includeHostApplications: true,
            };
          case SearchEntity.EXPENSES:
            return {
              ...defaultForEntity,
              includeExpenses: true,
            };
          case SearchEntity.TRANSACTIONS:
            return {
              ...defaultForEntity,
              includeTransactions: true,
            };
          case SearchEntity.ACCOUNTS:
            return {
              ...defaultForEntity,
              includeAccounts: true,
            };
          case SearchEntity.ORDERS:
            return {
              ...defaultForEntity,
              includeOrders: true,
            };
          case SearchEntity.UPDATES:
            return {
              ...defaultForEntity,
              includeUpdates: true,
            };
          case SearchEntity.COMMENTS:
            return {
              ...defaultForEntity,
              includeComments: true,
            };
          case SearchEntity.HOST_APPLICATIONS:
            return {
              ...defaultForEntity,
              includeHostApplications: true,
            };
        }
      },
    },
    defaultFilterValues: { workspace: account?.slug, entity: SearchEntity.ALL },
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
    variables: { ...queryFilter.variables, imageHeight: 72, __infiniteScroll: true },
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

  const handleSelectWorkspace = useCallback(() => {
    queryFilter.setFilter('workspace', defaultContext.slug);
    setInput('');
  }, [queryFilter, defaultContext, setInput]);

  const handleSearchInWorkspace = useCallback(() => {
    queryFilter.resetFilters(
      { searchTerm: input, workspace: defaultContext.slug },
      getDashboardRoute(workspace, ALL_SECTIONS.SEARCH),
    );
    setOpen(false);
  }, [queryFilter, input, defaultContext, workspace, setOpen]);

  const handleSearchAll = useCallback(() => {
    queryFilter.resetFilters({ searchTerm: input, workspace: 'ALL' }, '/search-results');
    setOpen(false);
  }, [queryFilter, input, setOpen]);

  const isLoading = loading || isDebouncing;
  const hasSearchTerm = !!input;
  const dataMatchesCurrentSearch = data?.search?.results && input === usedVariables.searchTerm;
  const hasData = hasSearchTerm && dataMatchesCurrentSearch;
  const isInitialLoading = isLoading && !hasData && hasSearchTerm;

  const flattenedMenuItems: DashboardPage[] = React.useMemo(() => {
    const menuItems = account ? getMenuItems({ intl, account, LoggedInUser }) : [];
    return menuItems
      .flatMap(menuItem =>
        'subMenu' in menuItem
          ? menuItem.subMenu.map(subItem => ({
              ...subItem,
              id: subItem.section,
              Icon: menuItem.Icon,
              group: menuItem.label,
            }))
          : { ...menuItem, id: menuItem.section },
      )
      .filter(item => item.section !== ALL_SECTIONS.SEARCH);
  }, [intl, account, LoggedInUser]);

  const filteredEntityOptions = React.useMemo(() => {
    if (queryFilter.values.workspace) {
      const entities = [
        SearchEntity.ACCOUNTS,
        SearchEntity.EXPENSES,
        SearchEntity.ORDERS,
        SearchEntity.TRANSACTIONS,
        SearchEntity.UPDATES,
      ];

      if (defaultContext?.type === 'host') {
        entities.push(SearchEntity.HOST_APPLICATIONS);
      }

      return Object.values(pick(entityFilterOptions, entities));
    }
    return Object.values(pick(entityFilterOptions, [SearchEntity.ACCOUNTS, SearchEntity.UPDATES]));
  }, [queryFilter.values.workspace, defaultContext?.type]);

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
      (results.hostApplications?.collection?.totalCount || 0) > 0 ||
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

        const entityToResultKey = {
          [SearchEntity.ACCOUNTS]: 'accounts',
          [SearchEntity.EXPENSES]: 'expenses',
          [SearchEntity.ORDERS]: 'orders',
          [SearchEntity.TRANSACTIONS]: 'transactions',
          [SearchEntity.UPDATES]: 'updates',
          [SearchEntity.COMMENTS]: 'comments',
          [SearchEntity.HOST_APPLICATIONS]: 'hostApplications',
        } as const;

        const resultKey = entityToResultKey[queryFilter.values.entity];
        const collection = results[resultKey]?.collection;
        const currentOffset = collection?.nodes.length || 0;
        const totalCount = collection?.totalCount || 0;
        const shouldLoadMore = currentOffset < totalCount;

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
        {queryFilter.values.workspace && queryFilter.values.workspace !== 'root-actions' && (
          <ContextPill
            slug={queryFilter.values.workspace}
            onRemove={() => queryFilter.setFilter('workspace', undefined)}
          />
        )}
        {queryFilter.values.entity !== SearchEntity.ALL && (
          <span className="flex items-center gap-1 text-sm whitespace-nowrap text-muted-foreground">
            {i18nSearchEntity(intl, queryFilter.values.entity)} <ChevronRight size={10} className="!size-4" />
          </span>
        )}
        <CommandPrimitive.Input
          ref={inputRef}
          onValueChange={setInput}
          value={input}
          placeholder={intl.formatMessage({ defaultMessage: 'Search...', id: 'search.placeholder' })}
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
                onSelect={handleSelectWorkspace}
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
            {filteredEntityOptions.map(opt => (
              <EntityFilterItem key={opt.value} opt={opt} queryFilter={queryFilter} intl={intl} />
            ))}
            <hr className="separator -mx-2 my-2 h-px bg-border" />
          </CommandGroup>
        )}

        {input.length > 0 && isUsingSearchResultsPage && (
          <React.Fragment>
            <CommandGroup heading="" className="[&:last-child_.separator]:hidden">
              {defaultContext && (
                <SearchCommandItem
                  onSelect={handleSearchInWorkspace}
                  actionLabel={intl.formatMessage({ defaultMessage: 'Search in this workspace', id: 'qT2PNg' })}
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
                onSelect={handleSearchAll}
                actionLabel={intl.formatMessage({ defaultMessage: 'Search all of Open Collective', id: 'LoB4cg' })}
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

        <RecentVisits queryFilter={queryFilter} setOpen={setOpen} input={input} />

        {filteredGoToPages.length > 0 && (
          <SearchCommandGroup
            entity={SearchEntity.DASHBOARD_TOOL}
            totalCount={filteredGoToPages.length}
            input={input}
            queryFilter={queryFilter}
            setOpen={setOpen}
            nodes={filteredGoToPages}
            renderNode={page => <PageResult page={page} />}
          />
        )}
        {isInitialLoading && input !== '' && (
          <CommandGroup heading={intl.formatMessage({ defaultMessage: 'Loading...', id: 'Select.Loading' })}>
            {[1, 2, 3, 4, 5].map(id => (
              <LoadingResult key={`skeleton-${id}`} />
            ))}
          </CommandGroup>
        )}
        {hasData && (
          <React.Fragment>
            <SearchCommandGroup
              entity={SearchEntity.ACCOUNTS}
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
              entity={SearchEntity.EXPENSES}
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
              entity={SearchEntity.HOST_APPLICATIONS}
              totalCount={data?.search.results.hostApplications?.collection.totalCount}
              input={debouncedInput}
              queryFilter={queryFilter}
              setOpen={setOpen}
              nodes={data?.search.results.hostApplications?.collection.nodes}
              renderNode={hostApplication => (
                <HostApplicationResult
                  hostApplication={hostApplication}
                  highlights={data?.search.results.hostApplications?.highlights[hostApplication.id]}
                />
              )}
              isInfiniteScrollEnabled={isInfiniteScrollEnabled}
            />
            <SearchCommandGroup
              entity={SearchEntity.ORDERS}
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
              entity={SearchEntity.TRANSACTIONS}
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
              entity={SearchEntity.UPDATES}
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
              entity={SearchEntity.COMMENTS}
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
            <span className="text-sm text-muted-foreground">
              <FormattedMessage defaultMessage="Loading more..." id="jZ5QcA" />
            </span>
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
