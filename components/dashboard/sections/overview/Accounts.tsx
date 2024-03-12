import React from 'react';
import { useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import Link from 'next/link'; // eslint-disable-line no-restricted-imports
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { getCollectivePageRoute, getDashboardRoute } from '../../../../lib/url-helpers';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/Collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { Skeleton } from '../../../ui/Skeleton';

import { collectiveBalanceQuery } from './queries';

function CollapsibleAccountsList({ accounts, label }) {
  const totalBalance = accounts.reduce((acc, child) => acc + child.stats.balance.valueInCents, 0);
  return (
    <div className="rounded-xl border bg-background">
      <Collapsible>
        <CollapsibleTrigger className="group flex w-full flex-1 items-center justify-between p-3 text-sm [&_svg]:data-[state=open]:rotate-180">
          <div className="flex w-full flex-1 justify-between">
            <div className="flex items-center gap-2">
              <div className="font-medium">{label}</div>
              <Badge size="sm" type="neutral">
                {accounts.length}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium">
              <FormattedMoneyAmount
                amount={totalBalance}
                currency={accounts[0].stats.balance.currency}
                amountStyles={{ letterSpacing: 0 }}
                showCurrencyCode={false}
              />
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="-my-1 -mr-1 text-muted-foreground group-hover:bg-muted"
              asChild
            >
              <div>
                <ChevronDown size={18} className="transition-transform" />
              </div>
            </Button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 border-t p-3">
            {accounts.length > 0 &&
              accounts.map(child => <AccountBalanceRow className="" key={child.slug} account={child} />)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function Accounts({ accountSlug }) {
  const { data, loading, error } = useQuery(collectiveBalanceQuery, {
    variables: { slug: accountSlug },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  });

  const activeChildAccounts = data?.account.childrenAccounts?.nodes.filter(child => !child.isArchived);

  const events = activeChildAccounts?.filter(
    child => child.type === 'EVENT' && (dayjs(child.endsAt).isAfter(dayjs()) || child.stats.balance.valueInCents > 0),
  );
  const projects = activeChildAccounts?.filter(child => child.type === 'PROJECT');
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-lg font-bold">
          <FormattedMessage defaultMessage="Accounts" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="xs" variant="outline" className="gap-1">
              <FormattedMessage id="order.new" defaultMessage="New" />
              <ChevronDown className="text-muted-foreground" size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/${accountSlug}/projects/create`}>
                <FormattedMessage defaultMessage="New project" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${accountSlug}/events/create`}>
                <FormattedMessage defaultMessage="New event" />
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-4">
        <div className="space-y-2 rounded-xl border bg-background p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              <FormattedMessage defaultMessage="Main account" />
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-6" />
          ) : error ? (
            <MessageBoxGraphqlError error={error} />
          ) : (
            data && <AccountBalanceRow account={data?.account} showDashboardLink={false} />
          )}
        </div>

        {projects?.length > 0 && (
          <CollapsibleAccountsList
            accounts={projects}
            label={<FormattedMessage id="Projects" defaultMessage="Projects" />}
          />
        )}
        {events?.length > 0 && (
          <CollapsibleAccountsList accounts={events} label={<FormattedMessage id="Events" defaultMessage="Events" />} />
        )}
      </div>
    </div>
  );
}

const AccountBalanceRow = ({ account, className = undefined, showDashboardLink = true }) => {
  return (
    <div className={`group flex items-center justify-between gap-2 text-sm ${className}`}>
      <AccountHoverCard
        account={account}
        trigger={
          <Link
            className="flex items-center gap-2 overflow-hidden text-muted-foreground hover:underline"
            href={getCollectivePageRoute(account)}
          >
            <Avatar radius={24} collective={account} />

            <span className="truncate">{account.name}</span>
          </Link>
        }
      />

      <div className="flex items-center gap-1.5">
        <span className="font-medium">
          <FormattedMoneyAmount
            amount={account.stats.balance?.valueInCents}
            currency={account.stats.balance?.currency}
            amountStyles={{ letterSpacing: 0 }}
            showCurrencyCode={false}
          />
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="-my-1 -mr-1 text-muted-foreground group-hover:border data-[state=open]:border"
            >
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-xs" align="end">
            {showDashboardLink && (
              <DropdownMenuItem asChild>
                <Link href={getDashboardRoute(account)}>
                  <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href={getCollectivePageRoute(account)}>
                <FormattedMessage id="PublicProfile" defaultMessage="Public profile" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={getDashboardRoute(account, 'info')}>
                <FormattedMessage id="Settings" defaultMessage="Settings" />
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
