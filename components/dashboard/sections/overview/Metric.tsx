import React from 'react';
import clsx from 'clsx';
import { isNil } from 'lodash';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Amount, Currency, TimeSeriesAmount } from '../../../../lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { InfoTooltipIcon } from '../../../InfoTooltipIcon';
import { Badge, BadgeProps } from '../../../ui/Badge';
import { Skeleton } from '../../../ui/Skeleton';

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

export interface MetricProps extends React.ComponentPropsWithoutRef<'div'> {
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
    currency: Currency;
  };
  helpLabel?: React.ReactNode;
  showCurrencyCode?: boolean;
  expanded?: boolean;
  withTimeseries?: boolean;
  currency?: Currency;
}
export function Metric({
  count,
  amount,
  label,
  loading,
  onClick,
  timeseries,
  className,
  expanded,
  children,
  showCurrencyCode = false,
  helpLabel,
}: MetricProps) {
  let value, comparisonValue;
  if (amount?.current) {
    value = amount.current.valueInCents;
    comparisonValue = amount.comparison?.valueInCents;
  } else if (count?.current) {
    value = count.current;
    comparisonValue = count.comparison;
  }
  const percentageDiff = getPercentageDifference(value, comparisonValue);
  // const loading = true;
  return (
    <div
      className={clsx(
        'group flex flex-col gap-1  rounded-xl border transition-all',
        onClick && ' cursor-pointer hover:scale-[1.01] hover:shadow-lg',
        className,
      )}
      {...(onClick && { onClick })}
    >
      <div className="space-y-1 p-3">
        <div>
          {label && (
            <div className="flex items-center gap-1">
              <span className="block text-sm font-medium tracking-tight">{label}</span>
              {helpLabel && <InfoTooltipIcon size={14}>{helpLabel}</InfoTooltipIcon>}
            </div>
          )}

          {loading ? (
            <Skeleton className="mt-1 h-7 w-1/2" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="block text-2xl font-bold">
                {amount?.current ? (
                  <FormattedMoneyAmount
                    amount={Math.abs(amount.current.valueInCents)}
                    currency={amount.current.currency}
                    precision={2}
                    amountStyles={{ letterSpacing: 0 }}
                    showCurrencyCode={showCurrencyCode}
                  />
                ) : (
                  count?.current.toLocaleString()
                )}
              </span>

              <ChangeBadge percentageDiff={percentageDiff} />
            </div>
          )}
          {loading ? (
            <Skeleton className="mt-1 h-4 w-1/3" />
          ) : !isNil(comparisonValue) ? (
            <div className="text-sm text-muted-foreground">
              <FormattedMessage
                defaultMessage="{countOrAmount} previous period"
                values={{
                  countOrAmount: amount ? (
                    <FormattedMoneyAmount
                      amount={Math.abs(amount.comparison.valueInCents)}
                      currency={amount.comparison.currency}
                      precision={2}
                      amountStyles={{ letterSpacing: 0 }}
                      showCurrencyCode={false}
                    />
                  ) : (
                    count.comparison.toLocaleString()
                  ),
                }}
              />
            </div>
          ) : (
            <div className="h-5" />
          )}
        </div>

        {timeseries && (
          <div className={clsx('relative', expanded ? 'h-[220px]' : 'h-[110px]')}>
            {timeseries.current && <ComparisonChart expanded={expanded} {...timeseries} />}
          </div>
        )}
      </div>

      {children && <div className="border-t">{children}</div>}
    </div>
  );
}

export function ChangeBadge({
  percentageDiff,
  showSign = false,
  showIcon = true,
  size = 'sm',
  ...props
}: BadgeProps & {
  percentageDiff: number;
  showSign?: boolean;
  showIcon?: boolean;
}) {
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
