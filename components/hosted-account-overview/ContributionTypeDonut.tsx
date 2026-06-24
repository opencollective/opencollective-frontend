import React from 'react';
import { ErrorBoundary } from '@sentry/nextjs';
import type { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { useIntl } from 'react-intl';

import { formatAmountForLegend } from '@/lib/charts';
import type { Currency } from '@/lib/graphql/types/v2/graphql';

import MessageBox from '@/components/MessageBox';

import type { ContributionTypeShare, FrequencyKey } from './financialActivity';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

type ContributionTypeDonutProps = {
  shares: ContributionTypeShare[];
  currency?: Currency;
};

function Chart({ shares, currency }: ContributionTypeDonutProps) {
  const intl = useIntl();
  const labels: Record<FrequencyKey, string> = {
    ONE_TIME: intl.formatMessage({ defaultMessage: 'One time', id: 'Frequency.OneTime' }),
    RECURRING: intl.formatMessage({ defaultMessage: 'Recurring', id: 'v84fNv' }),
    ADDED_FUNDS: intl.formatMessage({ defaultMessage: 'Added funds', id: 'Transaction.kind.ADDED_FUNDS' }),
  };

  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Inter, sans-serif', foreColor: 'hsl(var(--muted-foreground))' },
    labels: shares.map(s => labels[s.key]),
    colors: shares.map(s => s.color),
    legend: { position: 'bottom' },
    dataLabels: { enabled: true, formatter: (pct: number) => `${Math.round(pct)}%` },
    stroke: { width: 0 },
    tooltip: {
      y: { formatter: value => (currency ? formatAmountForLegend(value, currency, intl.locale) : String(value)) },
    },
  };

  return <ApexChart type="donut" width="100%" height="100%" options={options} series={shares.map(s => s.amount)} />;
}

export function ContributionTypeDonut(props: ContributionTypeDonutProps) {
  if (!props.shares.some(s => s.amount > 0)) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <NoData />
      </div>
    );
  }
  return (
    <ErrorBoundary fallback={({ error }) => <MessageBox type="error">{error['message']}</MessageBox>}>
      <Chart {...props} />
    </ErrorBoundary>
  );
}

function NoData() {
  const { formatMessage } = useIntl();
  return <span>{formatMessage({ defaultMessage: 'No data', id: 'UG5qoS' })}</span>;
}
