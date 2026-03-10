import React from 'react';
import { clsx } from 'clsx';

import type { Currency } from '../../../../lib/graphql/types/v2/graphql';

import { InfoTooltipIcon } from '../../../InfoTooltipIcon';
import { Skeleton } from '../../../ui/Skeleton';

import MultiSeriesChart, { type MultiSeriesEntry } from './MultiSeriesChart';

export interface MultiMetricProps {
  label?: React.ReactNode;
  loading?: boolean;
  className?: string;
  helpLabel?: React.ReactNode;
  timeseries?: {
    series: MultiSeriesEntry[];
    colors?: string[];
    currency?: Currency;
  };
  expanded?: boolean;
  children?: React.ReactNode;
}

export function MultiMetric({
  label,
  loading,
  className,
  helpLabel,
  timeseries,
  expanded,
  children,
}: MultiMetricProps) {
  return (
    <div className={clsx('group flex flex-col gap-1 rounded-xl border transition-all', className)}>
      <div className="w-full space-y-1 p-3">
        <div>
          {label && (
            <div className="flex items-center gap-1">
              <span className="block text-sm font-medium tracking-tight">{label}</span>
              {helpLabel && <InfoTooltipIcon size={14}>{helpLabel}</InfoTooltipIcon>}
            </div>
          )}
        </div>

        {loading ? (
          <Skeleton className="mt-1 h-[110px] w-full" />
        ) : (
          timeseries &&
          timeseries.series &&
          timeseries.series.length > 0 && (
            <div className={clsx('relative', expanded ? 'h-[220px]' : 'h-[110px]')}>
              <MultiSeriesChart
                series={timeseries.series}
                colors={timeseries.colors}
                currency={timeseries.currency}
                expanded={expanded}
              />
            </div>
          )
        )}
      </div>

      {children && <div className="border-t">{children}</div>}
    </div>
  );
}
