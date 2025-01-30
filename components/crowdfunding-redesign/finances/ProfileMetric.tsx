import React from 'react';
import clsx from 'clsx';
import { isNil } from 'lodash';
import { FormattedMessage } from 'react-intl';

import type { BaseMetricProps } from '../../dashboard/sections/overview/Metric';
import { ChangeBadge, getPercentageDifference } from '../../dashboard/sections/overview/Metric';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import { InfoTooltipIcon } from '../../InfoTooltipIcon';
import { Skeleton } from '../../ui/Skeleton';

interface ProfileMetricProps extends BaseMetricProps {
  active: boolean;
}

type MetricDivProps = ProfileMetricProps & Omit<React.ComponentPropsWithoutRef<'div'>, 'onClick'>;
type MetricButtonProps = ProfileMetricProps &
  React.ComponentPropsWithoutRef<'button'> & {
    onClick: () => void;
  };

type MetricProps = MetricDivProps | MetricButtonProps;

// Mostly a copy of the Metric component, but with the addition of `active` prop and slightly different behavior.
// If the pattern here in the crowdfunding prototype is adopted, we should migrate to a shared component and design.
export function ProfileMetric({
  count,
  amount,
  label,
  loading,
  className,
  children,
  showCurrencyCode = false,
  active = false,
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
        'group flex flex-col gap-1 border-0 border-b-[3px] border-r-border not-last:border-r',
        isButton && 'cursor-pointer text-left ring-ring ring-offset-2 focus:outline-hidden focus-visible:ring-2',
        active ? 'border-primary bg-background' : 'border-transparent bg-muted',
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
                  defaultMessage="{countOrAmount} at start of period"
                  id="Pa4OAa"
                  values={{
                    countOrAmount: amount ? (
                      <FormattedMoneyAmount
                        amount={Math.abs(amount.comparison.valueInCents)}
                        currency={amount.comparison.currency}
                        precision={2}
                        showCurrencyCode={false}
                      />
                    ) : (
                      count.comparison.toLocaleString()
                    ),
                  }}
                />
              ) : (
                <FormattedMessage
                  defaultMessage="{countOrAmount} previous period"
                  id="T5nXXx"
                  values={{
                    countOrAmount: amount ? (
                      <FormattedMoneyAmount
                        amount={Math.abs(amount.comparison.valueInCents)}
                        currency={amount.comparison.currency}
                        precision={2}
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
      </div>

      {children && <div className="border-t">{children}</div>}
    </Comp>
  );
}
