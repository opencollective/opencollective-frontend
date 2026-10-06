import React from 'react';
import { useQuery } from '@apollo/client';
import { ArrowRight } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import dayjs from '@/lib/dayjs';
import type {
  HostedAccountFinancialActivityQuery,
  HostedAccountFinancialActivityQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import { DashboardContentCard } from '@/components/dashboard/DashboardContentCard';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { buildKindActivity } from '@/components/hosted-account-overview/financialActivity';
// Transitional imports: chart and financial activity helpers are copied over
// from hosted-account-overview later.
import { HostedAccountOverviewChart } from '@/components/hosted-account-overview/HostedAccountOverviewChart';
import { hostedAccountFinancialActivityQuery } from '@/components/hosted-account-overview/queries';

import type { AccountDetailData } from './queries';

const BALANCE_COLOR = '#f59e0b';
const RECEIVED_COLOR = '#14b8a6';
const SPENT_COLOR = '#dc2626';

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

type HostedAccountOverviewCardProps = {
  account?: AccountDetailData;
  hostSlug: string;
  onOpenMoneyView?: (view: 'CONTRIBUTIONS' | 'PAYOUTS') => void;
};

export function HostedAccountOverviewCard({ account, hostSlug, onOpenMoneyView }: HostedAccountOverviewCardProps) {
  const intl = useIntl();
  const currency = account?.currency;
  const stats = account?.stats;
  const isChild = Boolean(account?.parent?.id);

  const metricsDateRange = React.useMemo(
    () => ({ from: '2015-01-01T00:00:00.000Z', to: dayjs.utc().toISOString() }),
    [],
  );
  const financialActivityQuery = useQuery<
    HostedAccountFinancialActivityQuery,
    HostedAccountFinancialActivityQueryVariables
  >(hostedAccountFinancialActivityQuery, {
    variables: {
      hostSlug,
      dateRange: metricsDateRange,
      timeUnit: 'MONTH' as HostedAccountFinancialActivityQueryVariables['timeUnit'],
      accountFilter: { mainAccount: { eq: { id: account?.id } } },
      groupByAccount: false,
    },
    skip: !account?.id || !hostSlug,
    fetchPolicy: 'cache-and-network',
  });

  const metricsRows = React.useMemo(
    () => financialActivityQuery.data?.host?.metrics?.consolidated?.rows ?? [],
    [financialActivityQuery.data],
  );
  const metricsCurrency = financialActivityQuery.data?.host?.currency ?? currency;
  const receivedTimeSeries = React.useMemo(
    () =>
      buildKindActivity(metricsRows, {
        amountMeasure: 'amountReceived',
        countMeasure: 'contributionsCount',
        timeUnit: 'MONTH',
        dateFrom: metricsDateRange.from,
        dateTo: metricsDateRange.to,
        currency: metricsCurrency,
      }).timeSeries,
    [metricsRows, metricsDateRange, metricsCurrency],
  );
  const spentTimeSeries = React.useMemo(
    () =>
      buildKindActivity(metricsRows, {
        amountMeasure: 'amountSpent',
        countMeasure: 'payoutsCount',
        timeUnit: 'MONTH',
        dateFrom: metricsDateRange.from,
        dateTo: metricsDateRange.to,
        currency: metricsCurrency,
      }).timeSeries,
    [metricsRows, metricsDateRange, metricsCurrency],
  );

  return (
    <DashboardContentCard title={<FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />}>
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
      <div className="h-72 w-full">
        <HostedAccountOverviewChart
          currency={currency as any}
          series={[
            {
              name: intl.formatMessage({ defaultMessage: 'Balance', id: 'Balance' }),
              color: BALANCE_COLOR,
              data: stats?.balanceTimeSeries,
            },
            {
              name: intl.formatMessage({ defaultMessage: 'Received by account', id: 'C22hxu' }),
              color: RECEIVED_COLOR,
              data: receivedTimeSeries,
            },
            {
              name: intl.formatMessage({ defaultMessage: 'Spent by account', id: 'bXI/iJ' }),
              color: SPENT_COLOR,
              data: spentTimeSeries,
            },
          ]}
        />
      </div>
    </DashboardContentCard>
  );
}
