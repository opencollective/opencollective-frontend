import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { isNil } from 'lodash-es';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { Amount, Currency, TimeSeriesAmount } from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import Image from '@/components/Image';
import { InfoTooltipIcon } from '@/components/InfoTooltipIcon';
import type { BadgeProps } from '@/components/ui/Badge';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import ComparisonChart from './ComparisonChart';

export function getPercentageDifference(current: number, previous?: number) {
  if (isNil(previous)) {
    return undefined;
  }
  if (previous === 0 && current === 0) {
    return 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export type MetricViewMode = 'amount' | 'count';

export type MetricChartView = {
  id: string;
  label: React.ReactNode;
  chart: React.ReactNode | ((mode: MetricViewMode) => React.ReactNode);
};

const TIMESERIES_VIEW_ID = 'timeseries';

export interface BaseMetricProps {
  count?: {
    current: number;
    comparison?: number;
  };
  amount?: {
    current: Amount;
    comparison?: Amount;
  };
  label?: React.ReactNode;
  loading?: boolean;
  onExpand?: () => void;
  timeseries?: {
    current: TimeSeriesAmount;
    comparison?: TimeSeriesAmount;
    currency?: Currency;
  };
  helpLabel?: React.ReactNode;
  noTimeseriesLabel?: React.ReactNode;
  showCurrencyCode?: boolean;
  showTimeSeries?: boolean;
  expanded?: boolean;
  currency?: Currency;
  isSnapshot?: boolean;
  hide?: boolean;
  /** When true, amounts are shown as magnitude (e.g. spent). Default is signed values. */
  useAbsoluteAmount?: boolean;
  color?: string;
  /** Extra chart tabs. The amount/count toggle is passed into function charts. */
  chartViews?: MetricChartView[];
  defaultChartView?: string;
}

type MetricDivProps = BaseMetricProps & Omit<React.ComponentPropsWithoutRef<'div'>, 'onClick'>;
type MetricButtonProps = BaseMetricProps &
  React.ComponentPropsWithoutRef<'button'> & {
    onClick: () => void;
  };

export type MetricProps = MetricDivProps | MetricButtonProps;

export function Metric({
  count,
  amount,
  label,
  loading,
  timeseries,
  className,
  expanded,
  children,
  showCurrencyCode = false,
  showTimeSeries = false,
  helpLabel,
  noTimeseriesLabel,
  isSnapshot = false,
  useAbsoluteAmount = false,
  color,
  chartViews,
  defaultChartView,
  ...props
}: MetricProps) {
  const [view, setView] = useState<MetricViewMode>('amount');
  const showViewToggle = !!amount && !!count;
  const effectiveAmount = showViewToggle && view === 'count' ? undefined : amount;
  const effectiveCount = showViewToggle && view === 'amount' ? undefined : count;

  const resolvedChartViews = useMemo(() => {
    const extraViews = chartViews ?? [];
    if (showTimeSeries && timeseries && !extraViews.some(v => v.id === TIMESERIES_VIEW_ID)) {
      return [
        {
          id: TIMESERIES_VIEW_ID,
          label: <FormattedMessage defaultMessage="Over time" id="ruPkNJ" />,
          chart: null,
        },
        ...extraViews,
      ];
    }
    return extraViews;
  }, [chartViews, showTimeSeries, timeseries]);

  const [selectedChartView, setSelectedChartView] = useState(
    defaultChartView ?? resolvedChartViews[0]?.id ?? TIMESERIES_VIEW_ID,
  );
  const activeChartView = resolvedChartViews.find(v => v.id === selectedChartView) ?? resolvedChartViews[0];
  const showChartViewTabs = resolvedChartViews.length > 1;

  const countTimeseries = useMemo(() => {
    if (!timeseries?.current) {
      return undefined;
    }
    const transformNodes = (ts: typeof timeseries.current) => ({
      ...ts,
      nodes: ts.nodes.map(node => ({
        ...node,
        amount: undefined,
        count: node.count ?? 0,
      })),
    });
    return {
      current: transformNodes(timeseries.current),
      comparison: timeseries.comparison ? transformNodes(timeseries.comparison) : undefined,
      currency: undefined as Currency | undefined,
    };
  }, [timeseries]);

  const effectiveTimeseries = showViewToggle && view === 'count' ? countTimeseries : timeseries;
  const effectiveTimeseriesHasNonZeroNodes =
    effectiveTimeseries?.current?.nodes?.length > 0 &&
    effectiveTimeseries.current.nodes.some(n => (n.count ?? n.amount?.valueInCents ?? n.amount?.value ?? 0) > 0);

  const showDefaultTimeseries =
    (showTimeSeries && !chartViews?.length) || activeChartView?.id === TIMESERIES_VIEW_ID || !activeChartView;

  let value, comparisonValue;
  if (effectiveAmount?.current) {
    value = effectiveAmount.current.valueInCents;
    comparisonValue = effectiveAmount.comparison?.valueInCents;
  } else if (effectiveCount?.current) {
    value = effectiveCount.current;
    comparisonValue = effectiveCount.comparison;
  }
  const percentageDiff = getPercentageDifference(value, comparisonValue);
  const isButton = 'onClick' in props;
  const Comp = isButton ? 'button' : 'div';

  const renderActiveChart = () => {
    if (showDefaultTimeseries && effectiveTimeseries) {
      if (effectiveTimeseriesHasNonZeroNodes) {
        return (
          <div className={clsx('relative', expanded || chartViews?.length ? 'h-[220px]' : 'h-[110px]')}>
            <ComparisonChart expanded={expanded || Boolean(chartViews?.length)} color={color} {...effectiveTimeseries} />
          </div>
        );
      }
      return (
        <div className="flex grow flex-col items-center justify-center">
          <Image
            alt="No results found illustration with a magnifying glass."
            className="z-10 sm:h-40 sm:w-40"
            src="/static/images/no-results.png"
            height={128}
            width={128}
            style={{ height: 128, width: 128 }}
          />
          <div className="mb-4 text-center text-sm text-muted-foreground">
            {noTimeseriesLabel ?? (
              <FormattedMessage id="Metric.NoTimeseries" defaultMessage="No time series data available" />
            )}
          </div>
        </div>
      );
    }

    if (!activeChartView || activeChartView.id === TIMESERIES_VIEW_ID) {
      return null;
    }

    const chart =
      typeof activeChartView.chart === 'function' ? activeChartView.chart(view) : activeChartView.chart;
    return <div className="relative h-64 w-full">{chart}</div>;
  };

  return (
    <Comp
      className={clsx(
        'group flex flex-col gap-1 rounded-xl border transition-all',
        isButton &&
          'cursor-pointer text-left ring-ring ring-offset-2 hover:shadow-lg focus:outline-hidden focus-visible:ring-2',
        className,
      )}
      {...(isButton && { onClick: props.onClick })}
    >
      <div className="flex h-full w-full flex-col space-y-1 p-3">
        <div>
          {(label || showViewToggle) && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {label && <span className="block text-sm font-medium tracking-tight">{label}</span>}
                {helpLabel && <InfoTooltipIcon size={14}>{helpLabel}</InfoTooltipIcon>}
              </div>
              {showViewToggle && (
                <Tabs value={view} onValueChange={v => setView(v as MetricViewMode)}>
                  <TabsList className="h-7 p-0.5">
                    <TabsTrigger value="amount" className="h-6 px-2 text-xs">
                      <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
                    </TabsTrigger>
                    <TabsTrigger value="count" className="h-6 px-2 text-xs">
                      <FormattedMessage defaultMessage="Count" id="Count" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
          )}

          {loading ? (
            <Skeleton className="mt-1 h-7 w-1/2" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="block text-2xl font-bold">
                {effectiveAmount?.current ? (
                  <FormattedMoneyAmount
                    amount={
                      useAbsoluteAmount
                        ? Math.abs(effectiveAmount.current.valueInCents)
                        : effectiveAmount.current.valueInCents
                    }
                    currency={effectiveAmount.current.currency}
                    precision={2}
                    showCurrencyCode={showCurrencyCode}
                  />
                ) : (
                  effectiveCount?.current?.toLocaleString()
                )}
              </span>

              <ChangeBadge percentageDiff={percentageDiff} />
            </div>
          )}
          {loading ? (
            <Skeleton className="mt-1 h-4 w-1/3" />
          ) : !isNil(comparisonValue) ? (
            <div className="text-sm text-muted-foreground">
              {isSnapshot ? (
                <FormattedMessage
                  defaultMessage="{countOrAmount} at start of period"
                  id="Pa4OAa"
                  values={{
                    countOrAmount: effectiveAmount ? (
                      <FormattedMoneyAmount
                        amount={
                          useAbsoluteAmount
                            ? Math.abs(effectiveAmount.comparison.valueInCents)
                            : effectiveAmount.comparison.valueInCents
                        }
                        currency={effectiveAmount.comparison.currency}
                        precision={2}
                        showCurrencyCode={false}
                      />
                    ) : (
                      effectiveCount.comparison?.toLocaleString()
                    ),
                  }}
                />
              ) : (
                <FormattedMessage
                  defaultMessage="{countOrAmount} previous period"
                  id="T5nXXx"
                  values={{
                    countOrAmount: effectiveAmount ? (
                      <FormattedMoneyAmount
                        amount={
                          useAbsoluteAmount
                            ? Math.abs(effectiveAmount.comparison.valueInCents)
                            : effectiveAmount.comparison.valueInCents
                        }
                        currency={effectiveAmount.comparison.currency}
                        precision={2}
                        showCurrencyCode={false}
                      />
                    ) : (
                      effectiveCount.comparison.toLocaleString()
                    ),
                  }}
                />
              )}
            </div>
          ) : (
            <div className="h-5" />
          )}
        </div>

        {showChartViewTabs && (
          <Tabs value={activeChartView?.id} onValueChange={setSelectedChartView}>
            <TabsList className="h-7 w-fit p-0.5">
              {resolvedChartViews.map(chartView => (
                <TabsTrigger key={chartView.id} value={chartView.id} className="h-6 px-2 text-xs">
                  {chartView.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {(showTimeSeries || chartViews?.length > 0) && renderActiveChart()}
      </div>

      {children && <div className="border-t">{children}</div>}
    </Comp>
  );
}

export function ChangeBadge({
  percentageDiff,
  showSign = false,
  showIcon = true,
  size = 'sm',
  ...props
}: BadgeProps & { percentageDiff: number; showSign?: boolean; showIcon?: boolean }) {
  if (!percentageDiff) {
    return null;
  }
  const isPositive = percentageDiff > 0;

  return (
    <Badge {...props} size={size} type={isPositive ? 'success' : 'error'}>
      {showIcon && isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      {Number.isFinite(percentageDiff) && (
        <span>{`${showSign ? (isPositive ? '+' : '-') : ''}${
          Math.abs(percentageDiff) >= 1000
            ? `${Math.round(Math.abs(percentageDiff) / 100)}x`
            : `${Math.abs(percentageDiff)}%`
        }`}</span>
      )}
    </Badge>
  );
}
