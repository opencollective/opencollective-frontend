import React from 'react';
import dayjs from 'dayjs';
import { Globe2, LayoutDashboard, MoreHorizontal, Settings } from 'lucide-react';
import Link from 'next/link'; // eslint-disable-line no-restricted-imports
import { FormattedMessage } from 'react-intl';

import { getCollectivePageRoute, getDashboardRoute } from '../../../../lib/url-helpers';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Button } from '../../../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../ui/DropdownMenu';
import { Skeleton } from '../../../ui/Skeleton';

export function Balance({ childrenAccounts, mainAccount, loading }) {
  const activeChildAccounts = childrenAccounts?.filter(child => !child.isArchived);

  const events = activeChildAccounts?.filter(
    child => child.type === 'EVENT' && (dayjs(child.endsAt).isAfter(dayjs()) || child.stats.balance.valueInCents > 0),
  );
  const projects = activeChildAccounts?.filter(child => child.type === 'PROJECT');

  return (
    <div className="flex flex-col rounded-xl border">
      <div className="flex flex-col gap-1 p-3">
        <div className="text-sm font-medium tracking-tight">
          <FormattedMessage defaultMessage="Total Balance" />
        </div>

        <div className="text-2xl font-bold">
          {loading ? (
            <Skeleton className="h-7 w-1/2" />
          ) : (
            <FormattedMoneyAmount
              amount={mainAccount.stats.totalBalance.valueInCents}
              currency={mainAccount.stats.totalBalance.currency}
              precision={2}
              amountStyles={{ letterSpacing: 0 }}
            />
          )}
        </div>
      </div>
      {activeChildAccounts?.length > 0 && (
        <div className="flex flex-col gap-2 border-t p-3">
          <span className="text-xs font-medium ">
            <FormattedMessage defaultMessage="Main account" />
          </span>
          <AccountBalanceRow account={mainAccount} />

          {events?.length > 0 && (
            <React.Fragment>
              <span className="mt-2 text-xs font-medium">
                <FormattedMessage id="Events" defaultMessage="Events" />
              </span>
              {events.map(child => (
                <AccountBalanceRow key={child.slug} account={child} />
              ))}
            </React.Fragment>
          )}
          {projects?.length > 0 && (
            <React.Fragment>
              <span className="mt-2 text-xs font-medium ">
                <FormattedMessage id="Projects" defaultMessage="Projects" />
              </span>
              {projects.map(child => (
                <AccountBalanceRow key={child.slug} account={child} />
              ))}
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
}

const AccountBalanceRow = ({ account }) => {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <AccountHoverCard
        account={account}
        trigger={
          <Link
            className="flex items-center gap-2 overflow-hidden text-muted-foreground hover:underline"
            href={getDashboardRoute(account)}
          >
            <Avatar radius={20} collective={account} />

            <span className="truncate">{account.name}</span>
          </Link>
        }
      />

      <div className="flex items-center gap-2">
        <div>
          <FormattedMoneyAmount
            amount={account.stats.balance.valueInCents}
            currency={account.stats.balance.currency}
            amountStyles={{ letterSpacing: 0 }}
            showCurrencyCode={false}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-xs" className="h-6 w-6">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{account.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href={getDashboardRoute(account)}>
                <LayoutDashboard size={14} /> <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={getCollectivePageRoute(account)}>
                <Globe2 size={14} /> <FormattedMessage id="PublicProfile" defaultMessage="Public profile" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={getDashboardRoute(account, 'info')}>
                <Settings size={14} /> <FormattedMessage id="Settings" defaultMessage="Settings" />
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
