import React from 'react';
import { useIntl } from 'react-intl';

import dayjs from '@/lib/dayjs';

import { type MonthPeriod, monthPeriodFor } from './helpers';
import { HostMetricsOverviewSection } from './Section';

type HostMetricsOverviewProps = {
  hostSlug: string;
};

export function HostMetricsOverview({ hostSlug }: HostMetricsOverviewProps) {
  const intl = useIntl();
  const initial = React.useMemo(() => monthPeriodFor(dayjs.utc(), intl, true), [intl]);
  const [collectivesPeriod, setCollectivesPeriod] = React.useState<MonthPeriod>(initial);
  const [fundsPeriod, setFundsPeriod] = React.useState<MonthPeriod>(initial);

  return (
    <div className="space-y-4">
      <HostMetricsOverviewSection
        hostSlug={hostSlug}
        category="COLLECTIVE"
        period={collectivesPeriod}
        onPeriodChange={setCollectivesPeriod}
      />
      <HostMetricsOverviewSection
        hostSlug={hostSlug}
        category="FUND"
        period={fundsPeriod}
        onPeriodChange={setFundsPeriod}
      />
    </div>
  );
}
