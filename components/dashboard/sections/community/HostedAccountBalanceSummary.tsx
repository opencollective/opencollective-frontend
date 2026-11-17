import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { useQueryFilterReturnType } from '@/lib/hooks/useQueryFilter';

import { DashboardContentCard } from '@/components/dashboard/DashboardContentCard';
import { Filterbar } from '@/components/dashboard/filters/Filterbar';
import { periodFilter } from '@/components/dashboard/filters/PeriodFilter';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';

import ComparisonChart from '../overview/ComparisonChart';

import type { HostedAccountDetailData, HostedAccountFinancialStats } from './queries';

const BALANCE_COLOR = '#16a34a';

/**
 * The period filter is owned by `HostedFinancialSummaryCard` so that it can scope the
 * received/disbursed charts as well; this card only renders it.
 */
export const hostedAccountOverviewFilterSchema = z.object({ period: periodFilter.schema });

export type HostedAccountOverviewFilter = useQueryFilterReturnType<
  typeof hostedAccountOverviewFilterSchema,
  { dateFrom?: string; dateTo?: string }
>;

type AmountLike = { valueInCents?: number | null; currency?: string | null } | null | undefined;

const Metric = ({
  label,
  amount,
  currency,
  onClick,
  signed = false,
}: {
  label: React.ReactNode;
  amount?: AmountLike;
  currency?: string;
  onClick?: () => void;
  /** Render the raw signed value (e.g. balances can be negative) instead of its absolute value. */
  signed?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <button
      type="button"
      className={`flex items-center gap-1 text-left text-sm text-muted-foreground ${onClick ? 'hover:text-foreground' : 'cursor-default'}`}
      onClick={onClick}
      disabled={!onClick}
    >
      {label}
      {onClick && <ArrowRight size={14} />}
    </button>
    <span className="text-2xl font-semibold text-foreground">
      {amount && typeof amount.valueInCents === 'number' ? (
        <FormattedMoneyAmount
          amount={signed ? amount.valueInCents : Math.abs(amount.valueInCents)}
          currency={(amount.currency || currency) as any}
          showCurrencyCode
          precision={2}
        />
      ) : (
        '—'
      )}
    </span>
  </div>
);

type HostedAccountBalanceSummaryProps = {
  account?: HostedAccountDetailData;
  stats?: HostedAccountFinancialStats;
  queryFilter: HostedAccountOverviewFilter;
  onOpenMoneyView?: (view: 'CONTRIBUTIONS' | 'PAYOUTS') => void;
};

export function HostedAccountBalanceSummary({
  account,
  stats,
  queryFilter,
  onOpenMoneyView,
}: HostedAccountBalanceSummaryProps) {
  const currency = account?.currency;
  // `parent` only exists on projects and events (the `AccountWithParent` facet).
  const isChild = Boolean(account && 'parent' in account && account.parent?.id);
  const balanceSeries = stats?.balanceTimeSeries;
  const isAllTime = queryFilter.variables?.['dateTo'] === undefined;

  return (
    <DashboardContentCard
      title={<FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />}
      action={<Filterbar hideSeparator {...queryFilter} />}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric
          label={
            isAllTime ? (
              <FormattedMessage defaultMessage="Current balance" id="kuYpoI" />
            ) : (
              <FormattedMessage defaultMessage="Estimated balance at the end of this period" id="WwO4zc" />
            )
          }
          amount={isChild ? stats?.balance : stats?.consolidatedBalance}
          currency={currency}
          signed
        />
        <Metric
          label={<FormattedMessage defaultMessage="Total amount received this period" id="2kY5p5" />}
          amount={stats?.consolidatedTotalNetAmountRaised}
          currency={currency}
          signed
          onClick={() => onOpenMoneyView?.('CONTRIBUTIONS')}
        />
        <Metric
          label={<FormattedMessage defaultMessage="Total amount spent this period" id="6ctWuQ" />}
          amount={stats?.consolidatedTotalAmountSpent}
          currency={currency}
          onClick={() => onOpenMoneyView?.('PAYOUTS')}
        />
      </div>
      {balanceSeries?.nodes?.length ? (
        <div className="relative h-[220px]">
          <ComparisonChart current={balanceSeries} color={BALANCE_COLOR} currency={currency} expanded />
        </div>
      ) : null}
    </DashboardContentCard>
  );
}
