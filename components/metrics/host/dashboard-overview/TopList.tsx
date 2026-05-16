import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import type { AccountHoverCardFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Link from '@/components/Link';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { Skeleton } from '../../../ui/Skeleton';

import { hostedAccountDrawerRoute, type HostedAccountType } from './helpers';

type AccountSummary = AccountHoverCardFieldsFragment & {
  imageUrl?: string | null;
};

export type TopListRow = {
  account: AccountSummary | null;
  amount: { valueInCents?: number; currency?: string } | null;
};

type TopListProps = {
  hostSlug: string;
  category: HostedAccountType;
  title: React.ReactNode;
  rows: TopListRow[] | undefined;
  loading: boolean;
};

export function TopList({ hostSlug, category, title, rows, loading }: TopListProps) {
  const router = useRouter();
  const topAmount = React.useMemo(() => {
    if (!rows?.length) {
      return 0;
    }
    return Math.max(...rows.map(r => r.amount?.valueInCents ?? 0));
  }, [rows]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="px-4 pt-4 text-base font-semibold">{title}</div>
      <div className="grid grid-cols-12 px-4 py-2 text-xs text-muted-foreground">
        <span className="col-span-7">
          {category === 'FUND' ? (
            <FormattedMessage defaultMessage="Fund Name" id="IbhtR1" />
          ) : (
            <FormattedMessage defaultMessage="Collective Name" id="Ig63Zx" />
          )}
        </span>
        <span className="col-span-4 pr-4 text-right">
          <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
        </span>
        <span className="sr-only col-span-1">
          <FormattedMessage defaultMessage="Actions" id="CollectivePage.NavBar.ActionMenu.Actions" />
        </span>
      </div>
      {loading ? (
        <div className="space-y-2 p-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows && rows.length > 0 ? (
        <ul className="divide-y">
          {rows.map((row, index) => {
            const a = row.account;
            const amount = row.amount;
            const accountId = a?.publicId ?? a?.id;
            if (!a || !accountId || !amount) {
              return null;
            }
            const drawerHref = hostedAccountDrawerRoute(hostSlug, category, accountId);
            const ratio = topAmount > 0 ? amount.valueInCents / topAmount : 0;
            return (
              <li key={a.id ?? index} className="relative">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 bg-muted"
                  style={{ width: `${(ratio * 100).toFixed(2)}%` }}
                  aria-hidden
                />
                <div className="relative grid grid-cols-12 items-center gap-2 px-4 py-2 text-sm">
                  <AccountHoverCard
                    account={a}
                    trigger={
                      <Link href={drawerHref} className="col-span-7 flex min-w-0 items-center gap-2 hover:underline">
                        <Avatar collective={a} radius={20} />
                        <span className="min-w-0 flex-1 truncate">{a.name ?? a.slug}</span>
                      </Link>
                    }
                  />
                  <span className="col-span-4 pr-4 text-right tabular-nums">
                    <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency as never} />
                  </span>
                  <span className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Actions"
                      >
                        <MoreHorizontal size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => router.push(drawerHref)}>
                          <FormattedMessage defaultMessage="View details" id="MnpUD7" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="p-4 text-center text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="No data in this period" id="E4ltHh" />
        </div>
      )}
    </div>
  );
}
