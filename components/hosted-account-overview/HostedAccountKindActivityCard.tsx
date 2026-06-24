import React from 'react';
import { FormattedMessage } from 'react-intl';

import { DashboardContentCard } from '@/components/dashboard/DashboardContentCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import { AmountBandHistogram } from './AmountBandHistogram';
import { ContributionTypeDonut } from './ContributionTypeDonut';
import type { ContributionTypeShare, HistogramBar, KindActivity } from './financialActivity';
import { HostedAccountKindOverTimeChart } from './HostedAccountKindOverTimeChart';

type View = 'SIZE' | 'OVERTIME' | 'TYPE';

type HostedAccountKindActivityCardProps = {
  title: React.ReactNode;
  kindLabel?: string;
  color: string;
  activity: KindActivity;
  histogram: HistogramBar[];
  /** When provided (contributions only), enables the "By type" share donut. */
  typeShares?: ContributionTypeShare[];
  loading?: boolean;
};

export function HostedAccountKindActivityCard({
  title,
  kindLabel,
  color,
  activity,
  histogram,
  typeShares,
  loading,
}: HostedAccountKindActivityCardProps) {
  const [view, setView] = React.useState<View>('SIZE');

  return (
    <DashboardContentCard className="gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <Tabs value={view} onValueChange={v => setView(v as View)}>
          <TabsList className="h-7 p-0.5">
            <TabsTrigger value="SIZE" className="h-6 px-2 text-xs">
              <FormattedMessage defaultMessage="By size" id="bSHoiI" />
            </TabsTrigger>
            <TabsTrigger value="OVERTIME" className="h-6 px-2 text-xs">
              <FormattedMessage defaultMessage="Over time" id="ruPkNJ" />
            </TabsTrigger>
            {typeShares && (
              <TabsTrigger value="TYPE" className="h-6 px-2 text-xs">
                <FormattedMessage defaultMessage="By type" id="j/wRjH" />
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      <div className="h-64 w-full">
        {loading ? null : view === 'TYPE' && typeShares ? (
          <ContributionTypeDonut shares={typeShares} currency={activity.currency} />
        ) : view === 'SIZE' ? (
          <AmountBandHistogram bars={histogram} color={color} currency={activity.currency} kindLabel={kindLabel} />
        ) : (
          <HostedAccountKindOverTimeChart timeSeries={activity.timeSeries} color={color} currency={activity.currency} />
        )}
      </div>
    </DashboardContentCard>
  );
}
