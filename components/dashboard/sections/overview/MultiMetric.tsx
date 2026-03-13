import React from 'react';
import { clsx } from 'clsx';
import { isNil } from 'lodash';

import type { Amount, Currency } from '../../../../lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { InfoTooltipIcon } from '../../../InfoTooltipIcon';
import { Skeleton } from '../../../ui/Skeleton';

import MultiSeriesChart, { type MultiSeriesEntry } from './MultiSeriesChart';

export interface SubMetricProps {
  label: string;
  amount?: Amount;
  count?: number;
}

export interface MultiMetricProps {
  label?: React.ReactNode;
  helpLabel?: React.ReactNode;
  loading?: boolean;
  className?: string;
  amount?: Amount;
  count?: number;
  submetrics?: SubMetricProps[];
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
  helpLabel,
  loading,
  className,
  amount,
  count,
  submetrics,
  timeseries,
  expanded,
  children,
}: MultiMetricProps) {
  return (
    <div className={clsx('group flex flex-col gap-1 rounded-xl border transition-all', className)}>
      <div className="w-full grow space-y-1 p-3">
        <div>
          {label && (
            <div className="flex items-center gap-1">
              <span className="block text-sm font-medium tracking-tight">{label}</span>
              {helpLabel && <InfoTooltipIcon size={14}>{helpLabel}</InfoTooltipIcon>}
            </div>
          )}

          {(amount || !isNil(count)) && (
            <div className="flex items-center gap-2">
              {loading ? (
                <Skeleton className="mt-1 h-7 w-1/2" />
              ) : (
                <span className="block text-2xl font-bold">
                  {amount ? (
                    <FormattedMoneyAmount
                      amount={Math.abs(amount.valueInCents)}
                      currency={amount.currency}
                      precision={2}
                      showCurrencyCode={false}
                    />
                  ) : !isNil(count) ? (
                    count.toLocaleString()
                  ) : null}
                </span>
              )}
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

      {submetrics && submetrics.length > 0 && (
        <div className="border-t">
          {submetrics.map(sub => (
            <div
              key={sub.label}
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-muted-foreground odd:bg-muted/30"
            >
              <span className="truncate">{sub.label}</span>
              {loading ? (
                <Skeleton className="h-4 w-16" />
              ) : sub.amount ? (
                <span className="shrink-0 font-medium tabular-nums">
                  <FormattedMoneyAmount
                    amount={Math.abs(sub.amount.valueInCents)}
                    currency={sub.amount.currency}
                    precision={2}
                    showCurrencyCode={false}
                  />
                </span>
              ) : sub.count !== null && sub.count !== undefined ? (
                <span className="shrink-0 font-medium tabular-nums">{sub.count.toLocaleString()}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {children && <div className="border-t">{children}</div>}
    </div>
  );
}
