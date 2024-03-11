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

interface BaseMetricProps {
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
  showTimeSeries?: boolean;
  expanded?: boolean;
  currency?: Currency;
  isSnapshot?: boolean;
  hide?: boolean;
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
  isSnapshot = false,
  ...props
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
  const isButton = 'onClick' in props;
  const Comp = isButton ? 'button' : 'div';

  return (
    <Comp
      className={clsx(
        'group flex flex-col gap-1 rounded-xl border transition-all',
        isButton &&
          'cursor-pointer text-left ring-ring ring-offset-2 hover:shadow-lg focus:outline-none focus-visible:ring-2',
        className,
      )}
      {...(isButton && { onClick: props.onClick })}
    >
      <div className="w-full space-y-1 p-3">
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
              {isSnapshot ? (
                <FormattedMessage
                  defaultMessage={'{countOrAmount} at start of period'}
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
              ) : (
                <FormattedMessage
                  defaultMessage={'{countOrAmount} previous period'}
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
              )}
            </div>
          ) : (
            <div className="h-5" />
          )}
        </div>

        {showTimeSeries && timeseries && (
          <div className={clsx('relative', expanded ? 'h-[220px]' : 'h-[110px]')}>
            {timeseries.current && <ComparisonChart expanded={expanded} {...timeseries} />}
          </div>
        )}
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
