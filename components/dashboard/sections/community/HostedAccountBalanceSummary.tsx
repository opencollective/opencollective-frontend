import React from 'react';
import { useQuery } from '@apollo/client';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { gql } from '@/lib/graphql/helpers';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { DashboardContentCard } from '@/components/dashboard/DashboardContentCard';
import { Filterbar } from '@/components/dashboard/filters/Filterbar';
import { periodFilter } from '@/components/dashboard/filters/PeriodFilter';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';

import ComparisonChart from '../overview/ComparisonChart';

import type { AccountDetailData } from './queries';
import { PeriodFilterType } from '../../filters/PeriodCompareFilter/schema';

const BALANCE_COLOR = '#16a34a';

// Balance time series for the picked date range: the range from the filter is
// injected into this query, which feeds the chart.
const accountDetailBalanceTimeSeriesQuery = gql`
  query AccountDetailBalanceTimeSeries($accountId: String!, $dateFrom: DateTime, $dateTo: DateTime) {
    account(id: $accountId) {
      id
      stats {
        balanceTimeSeries(dateFrom: $dateFrom, dateTo: $dateTo, includeChildren: true) {
          timeUnit
          dateFrom
          dateTo
          nodes {
            date
            amount {
              valueInCents
              currency
            }
          }
        }
      }
    }
  }
`;

const balanceFilterSchema = z.object({ period: periodFilter.schema });

type AmountLike = { valueInCents?: number | null; currency?: string | null } | null | undefined;

const Metric = ({
  label,
  amount,
  currency,
  onClick,
}: {
  label: React.ReactNode;
  amount?: AmountLike;
  currency?: string;
  onClick?: () => void;
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
          amount={Math.abs(amount.valueInCents)}
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
  account?: AccountDetailData;
  onOpenMoneyView?: (view: 'CONTRIBUTIONS' | 'PAYOUTS') => void;
};

export function HostedAccountBalanceSummary({ account, onOpenMoneyView }: HostedAccountBalanceSummaryProps) {
  const currency = account?.currency;
  const stats = account?.stats;
  const isChild = Boolean(account?.parent?.id);

  const queryFilter = useQueryFilter({
    schema: balanceFilterSchema,
    toVariables: { period: periodFilter.toVariables },
    defaultFilterValues: {
      period: { type: PeriodFilterType.ALL_TIME },
    },
    filters: { period: periodFilter.filter },
    skipRouter: true,
  });

  const balanceSeriesQuery = useQuery(accountDetailBalanceTimeSeriesQuery, {
    variables: { accountId: account?.id, ...queryFilter.variables },
    skip: !account?.id,
    fetchPolicy: 'cache-and-network',
  });

  const balanceSeries = balanceSeriesQuery.data?.account?.stats?.balanceTimeSeries;

  return (
    <DashboardContentCard
      title={<FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />}
      action={<Filterbar hideSeparator {...queryFilter} />}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric
          label={<FormattedMessage defaultMessage="Current Balance" id="PkACGs" />}
          amount={isChild ? stats?.balance : stats?.consolidatedBalance}
          currency={currency}
        />
        <Metric
          label={<FormattedMessage defaultMessage="Received by Account (all-time)" id="26sbkf" />}
          amount={stats?.consolidatedTotalNetAmountRaised}
          currency={currency}
          onClick={() => onOpenMoneyView?.('CONTRIBUTIONS')}
        />
        <Metric
          label={<FormattedMessage defaultMessage="Disbursed by account (all-time)" id="3wX8nB" />}
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
