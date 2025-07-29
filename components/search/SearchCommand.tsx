import React, { useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { Command as CommandPrimitive } from 'cmdk';
import { SearchIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { CollectiveType } from '../../lib/constants/collectives';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useDebouncedValue from '../../lib/hooks/useDebouncedValue';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../lib/hooks/useQueryFilter';
import {
  getCollectivePageRoute,
  getCommentUrl,
  getExpensePageUrl,
  getOrderUrl,
  getUpdateUrl,
} from '../../lib/url-helpers';
import type { Comment, Expense, Order, Update } from '@/lib/graphql/types/v2/schema';

import { DashboardContext } from '../dashboard/DashboardContext';
import { getMenuItems } from '../dashboard/Menu';
import Link from '../Link';
import StyledSpinner from '../StyledSpinner';
import { CommandDialog, CommandGroup, CommandItem, CommandList } from '../ui/Command';
import { DialogTitle } from '../ui/Dialog';
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
import { SearchCommandGroup } from './SearchCommandGroup';
import { SearchCommandLegend } from './SearchCommandLegend';
import type { PageVisit } from './useRecentlyVisited';
import { useRecentlyVisited } from './useRecentlyVisited';

// TODO i18n
export const SearchCommand = ({ open, setOpen }) => {
  const router = useRouter();
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const { workspace } = useWorkspace();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { account } = React.useContext(DashboardContext);
  const defaultContext: { slug: string; type: 'account' | 'host' } | undefined = account?.isHost
    ? { slug: account.slug, type: 'host' }
    : account?.slug && account.slug !== 'root-actions'
      ? { slug: account.slug, type: 'account' }
      : undefined;

  const [input, setInput] = React.useState('');
  const queryFilter = useQueryFilter({
    schema: z.object({
      context: z
        .object({
          slug: z.string(),
          type: z.enum(['account', 'host']),
        })
        .nullable()
        .default(null),
      limit: z.number().default(5),
    }),
    filters: {},
    toVariables: {
      context: context => {
        if (context?.type === 'account') {
          return { account: { slug: context.slug }, includeTransactions: true };
        } else if (context?.type === 'host') {
          return { host: { slug: context.slug }, includeTransactions: true };
        } else if (account?.slug === 'root-actions') {
          return { includeTransactions: true };
        }
        return { includeTransactions: false };
      },
    },
    defaultFilterValues: { context: defaultContext },
    skipRouter: true,
  });

  useEffect(() => {
    if (open) {
      queryFilter.setFilter('context', defaultContext);
    }
  }, [open]);

  const [search, { data, loading }] = useLazyQuery(searchCommandQuery, {
    variables: { ...queryFilter.variables, imageHeight: 72 },
    notifyOnNetworkStatusChange: true,
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  });

  const { debouncedValue: debouncedInput, isDebouncing } = useDebouncedValue(input, 500);
  useEffect(() => {
    if (debouncedInput?.length > 0) {
      search({ variables: { searchTerm: debouncedInput } });
    }
  }, [debouncedInput, search]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (input.value === '') {
            queryFilter.setFilter('context', null);
          }
        }
      }
    },
    [queryFilter],
  );

  const { recentlyVisited, addToRecent } = useRecentlyVisited();

  const handleResultSelect = ({
    type,
    data,
  }:
    | PageVisit
    | {
        type: 'page';
        data: { section: string };
      }) => {
    switch (type) {
      case 'account':
        if (data.type !== CollectiveType.VENDOR) {
          // TODO: Fix vendor links
          router.push(getCollectivePageRoute(data as { slug: string }));
        }
        addToRecent({ key: data.slug.toString(), type, data });
        break;
      case 'expense':
        router.push(getExpensePageUrl(data as Expense));
        addToRecent({ key: data.legacyId.toString(), type, data });

        break;
      case 'transaction':
        if (account?.slug === 'root-actions' || account?.isHost) {
          router.push(`/dashboard/${account.slug}/host-transactions?openTransactionId=${data.legacyId}`);
        } else if (workspace.slug) {
          router.push(`/dashboard/${workspace.slug}/transactions?openTransactionId=${data.legacyId}`);
        }
        addToRecent({ key: data.legacyId.toString(), type, data });
        break;
      case 'comment':
        router.push(getCommentUrl(data as Comment, LoggedInUser));
        // Skip adding comments to recent
        break;
      case 'order':
        router.push(getOrderUrl(data as Order, LoggedInUser));
        addToRecent({ key: data.legacyId.toString(), type, data });
        break;
      case 'update':
        router.push(getUpdateUrl(data as Update, LoggedInUser));
        addToRecent({ key: data.legacyId.toString(), type, data });
        break;
      case 'page':
        router.push(`/dashboard/${workspace.slug}/${data.section}`);
        // Skip adding dashboard pages to recent
        break;
    }
    setOpen(false);
  };

  const isLoading = loading || isDebouncing;

  const flattenedMenuItems = React.useMemo(() => {
    const menuItems = account ? getMenuItems({ intl, account, LoggedInUser }) : [];

    return menuItems.flatMap(menuItem =>
      'subMenu' in menuItem
        ? menuItem.subMenu.map(subItem => ({
            ...subItem,
            Icon: menuItem.Icon,
            label: `${menuItem.label} / ${subItem.label}`,
          }))
        : menuItem,
    );
  }, [intl, account, LoggedInUser]);

  const filteredGoToPages = React.useMemo(() => {
    if (!queryFilter.values.context || !debouncedInput) {
      return [];
    }

    return flattenedMenuItems.filter(menuItem =>
      menuItem.label.toString().toLowerCase().includes(debouncedInput.toLowerCase()),
    );
  }, [debouncedInput, flattenedMenuItems, queryFilter.values.context]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={false}
      onKeyDown={handleKeyDown}
      description="Search for accounts, expenses, transactions, updates, comments, and more"
    >
      <DialogTitle className="hidden">
        <FormattedMessage defaultMessage="Search" id="Search" />
      </DialogTitle>
      {}
      <div className="group flex items-center gap-3 border-b px-3" cmdk-input-wrapper="">
        <SearchIcon className="shrink-0 text-muted-foreground" size={16} />
        {queryFilter.values.context && (
          <ContextPill
            slug={queryFilter.values.context.slug}
            onRemove={() => queryFilter.setFilter('context', undefined)}
          />
        )}
        <CommandPrimitive.Input
          ref={inputRef}
          onValueChange={setInput}
          value={input}
          placeholder={queryFilter.values.context ? '' : 'Search...'}
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isLoading && <StyledSpinner size={16} className="absolute right-4 text-muted-foreground" />}
      </div>

      <CommandList className="max-h-[600px] border-t-0 border-b [&_.text-xs_mark]:px-1 [&_.text-xs_mark]:py-[1px] [&_mark]:rounded-xl [&_mark]:bg-amber-100 [&_mark]:px-1 [&_mark]:py-2">
        <CommandItem value="-" className="hidden" />
        {recentlyVisited.length > 0 && debouncedInput === '' && (
          <CommandGroup heading="Recent">
            {recentlyVisited.map(recentVisit => (
              <CommandItem key={recentVisit.key} className="gap-2" onSelect={() => handleResultSelect(recentVisit)}>
                {recentVisit.type === 'account' && <AccountResult account={recentVisit.data} />}
                {recentVisit.type === 'expense' && <ExpenseResult expense={recentVisit.data} />}
                {recentVisit.type === 'order' && <OrderResult order={recentVisit.data} />}
                {recentVisit.type === 'transaction' && <TransactionResult transaction={recentVisit.data} />}
                {recentVisit.type === 'update' && <UpdateResult update={recentVisit.data} />}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {filteredGoToPages.length > 0 && (
          <CommandGroup heading="Dashboard">
            {filteredGoToPages.map(page => (
              <CommandItem key={page.section} onSelect={() => handleResultSelect({ type: 'page', data: page })}>
                <PageResult page={page} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <SearchCommandGroup
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
        />
      </CommandList>
      <SearchCommandLegend />
    </CommandDialog>
  );
};
