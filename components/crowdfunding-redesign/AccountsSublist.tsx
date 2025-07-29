import React from 'react';
import { isNil, omit } from 'lodash';
import { ArrowUp10, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';

import type { AccountMetricsFragment } from '../../lib/graphql/types/v2/graphql';

import { getPercentageDifference } from '../dashboard/sections/overview/Metric';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import { Button } from '../ui/Button';

import { triggerPrototypeToast } from './helpers';

type AccountMetricsRow = AccountMetricsFragment & {
  current: number;
  comparison?: number;
  percentageDifference?: number;
};

export function AccountsSublist({ label, type, data, metric, meta }) {
  const router = useRouter();
  const columnData: AccountMetricsRow[] = React.useMemo(() => {
    const nodes = data
      ? [omit(data?.account, 'childrenAccounts'), ...(data?.account.childrenAccounts.nodes ?? [])]
      : [];
    const filteredNodes = nodes.filter(node => node.type === type);

    return filteredNodes.map(node => {
      const current = node[metric.id].current.valueInCents ?? node[metric.id].current;
      const comparison = node[metric.id].comparison?.valueInCents ?? node[metric.id].comparison;
      return {
        ...node,
        current: Math.abs(current),
        comparison: !isNil(comparison) ? Math.abs(comparison) : undefined,
        percentageDifference: getPercentageDifference(current, comparison),
      };
    });
  }, [metric.id, data, type]);

  return (
    <div className="">
      <div className="mb-2 flex items-center justify-between gap-4 px-2">
        <h2 className="text-lg font-semibold text-slate-800">{label}</h2>
        <Button
          variant="ghost"
          size="sm"
          className={'group/btn -m-2 gap-2 text-foreground'}
          onClick={triggerPrototypeToast}
          disabled={columnData.length === 1}
        >
          <span>{metric.id === 'balance' ? 'Balance' : metric.label}</span>
          <ArrowUp10 className="h-4 w-4 text-muted-foreground transition-colors" />
        </Button>
      </div>
      <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-background">
        {columnData
          .sort((a, b) => b.current - a.current)
          .map(account => (
            <Link
              key={account.id}
              className="flex items-center justify-between px-4 py-4 hover:bg-muted"
              href={`/preview/${router.query.collectiveSlug}/finances/${account.slug}`}
            >
              <div>{account.name}</div>
              <div className="flex items-center gap-2">
                <div className="font-medium">
                  <FormattedMoneyAmount
                    amount={account.current}
                    currency={meta.currency}
                    precision={2}
                    showCurrencyCode={false}
                  />
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
