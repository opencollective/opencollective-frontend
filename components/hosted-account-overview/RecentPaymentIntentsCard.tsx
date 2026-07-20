import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { useDrawer } from '@/lib/hooks/useDrawer';

import Avatar from '@/components/Avatar';
import { PaymentIntentDrawer } from '@/components/dashboard/sections/payment-intents/PaymentIntentDrawer';
import { PaymentIntentStatusBadge } from '@/components/dashboard/sections/payment-intents/PaymentIntentStatusBadge';
import DateTime from '@/components/DateTime';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { Skeleton } from '@/components/ui/Skeleton';

type AccountLike = { id: string; slug: string; name?: string | null; imageUrl?: string | null; type?: string } | null;

export type RecentPaymentIntentRow = {
  id: string;
  date: string;
  from?: AccountLike;
  to?: AccountLike;
  status: string;
  amount?: { valueInCents: number; currency: string } | null;
};

const AccountFlowItem = ({ account }: { account?: AccountLike }) => {
  if (!account) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1 truncate">
      <Avatar collective={account} radius={18} />
      <span className="truncate">{account.name || account.slug}</span>
    </span>
  );
};

export const RecentPaymentIntentsCard = ({
  title,
  rows,
  loading,
  nbPlaceholders = 5,
  onViewAll,
}: {
  title: React.ReactNode;
  rows: RecentPaymentIntentRow[];
  loading?: boolean;
  nbPlaceholders?: number;
  onViewAll: () => void;
}) => {
  const [openPaymentIntentId, setOpenPaymentIntentId] = React.useState<string | undefined>();
  const { openDrawer, drawerProps } = useDrawer({
    open: Boolean(openPaymentIntentId),
    onOpen: (id: string) => setOpenPaymentIntentId(id),
    onClose: () => setOpenPaymentIntentId(undefined),
  });

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-slate-800">{title}</h3>
      <div className="overflow-hidden rounded-xl border text-sm">
        {loading && !rows.length ? (
          <div className="divide-y">
            {Array.from({ length: nbPlaceholders }).map((_, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key -- static skeleton placeholders, never reordered
                key={i}
                className={`grid grid-cols-[5.75rem_minmax(0,1fr)_1.25rem_minmax(0,1fr)_6rem_5.5rem] items-center gap-2 px-3 py-2.5`}
              >
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-full" />
                <span />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-full justify-self-end" />
              </div>
            ))}
          </div>
        ) : !rows.length ? (
          <div className="px-3 py-8 text-center text-muted-foreground">
            <FormattedMessage defaultMessage="No recent activity." id="PaymentIntent.RecentEmpty" />
          </div>
        ) : (
          <div className="divide-y">
            {rows.map(row => (
              <button
                key={row.id}
                type="button"
                onClick={e => openDrawer(row.id, { current: e.currentTarget })}
                className={`grid w-full grid-cols-[5.75rem_minmax(0,1fr)_1.25rem_minmax(0,1fr)_6rem_5.5rem] items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30`}
              >
                <span className="truncate text-xs whitespace-nowrap text-muted-foreground">
                  <DateTime dateStyle="medium" value={row.date} />
                </span>
                <AccountFlowItem account={row.from} />
                <ArrowRight size={14} className="justify-self-center text-muted-foreground" />
                <AccountFlowItem account={row.to} />
                <PaymentIntentStatusBadge status={row.status} className="justify-self-start" />
                <span className="justify-self-end truncate text-right font-medium">
                  {row.amount ? (
                    <FormattedMoneyAmount
                      amount={row.amount.valueInCents}
                      currency={row.amount.currency}
                      showCurrencyCode={false}
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
        {!(loading && !rows.length) && (
          <div className="flex min-h-[49px] w-full items-center justify-center border-t">
            <button
              type="button"
              onClick={onViewAll}
              className="font-normal text-muted-foreground hover:text-foreground hover:underline"
            >
              <FormattedMessage defaultMessage="View all" id="pFK6bJ" />
            </button>
          </div>
        )}
      </div>

      <PaymentIntentDrawer {...drawerProps} publicId={openPaymentIntentId} />
    </div>
  );
};
