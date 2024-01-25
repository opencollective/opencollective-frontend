import React from 'react';
import { isNil } from 'lodash';
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Amount } from '../../../../lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Badge } from '../../../ui/Badge';
import { Skeleton } from '../../../ui/Skeleton';

function getPercentageDifference(current: number, previous?: number) {
  if (isNil(previous)) {
    return undefined;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function Metric({
  count,
  amount,
  label,
  loading,
}: {
  count?: {
    current: number;
    comparison?: number;
  };
  amount?: {
    current: Amount;
    comparison?: Amount;
  };
  label: React.ReactNode;
  loading?: boolean;
}) {
  let value, comparisonValue;
  if (amount?.current) {
    value = amount.current.valueInCents;
    comparisonValue = amount.comparison?.valueInCents;
  } else if (count?.current) {
    value = count.current;
    comparisonValue = count.comparison;
  }
  const percentageDiff = getPercentageDifference(value, comparisonValue);

  return (
    <div className="flex flex-col gap-1 rounded-xl border p-3">
      <div className="flex justify-between gap-1">
        <span className="block text-sm font-medium tracking-tight">{label}</span>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="mt-1 h-7 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="block text-2xl font-bold">
            {amount?.current ? (
              <FormattedMoneyAmount
                amount={Math.abs(amount.current.valueInCents)}
                currency={amount.current.currency}
                precision={2}
                amountStyles={{ letterSpacing: 0 }}
                showCurrencyCode={false}
              />
            ) : (
              count?.current
            )}
          </span>

          {!isNil(comparisonValue) && value !== comparisonValue && (
            <Badge
              className="gap-0.5"
              size="sm"
              type={Math.abs(value) >= Math.abs(comparisonValue) ? 'success' : 'error'}
            >
              {Math.abs(value) >= Math.abs(comparisonValue) ? (
                comparisonValue ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowUp size={16} />
                )
              ) : comparisonValue ? (
                <ArrowDownRight size={16} />
              ) : (
                <ArrowDown size={16} />
              )}{' '}
              {Boolean(comparisonValue) && (
                <span>{`${
                  Math.abs(percentageDiff) >= 1000
                    ? `${Math.round(Math.abs(percentageDiff) / 100)}x`
                    : `${Math.abs(percentageDiff)}%`
                }`}</span>
              )}
            </Badge>
          )}
        </div>
      )}
      {!isNil(comparisonValue) && (
        <span className="text-sm text-muted-foreground">
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
                count.comparison
              ),
            }}
          />
        </span>
      )}
    </div>
  );
}
