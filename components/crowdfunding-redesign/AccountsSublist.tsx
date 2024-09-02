import React from 'react';
import { isNil, omit } from 'lodash';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';

import type { AccountMetricsFragment } from '../../lib/graphql/types/v2/graphql';

import { getPercentageDifference } from '../dashboard/sections/overview/Metric';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';

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
      <h2 className="mb-3 px-2 text-lg font-semibold text-slate-800">{label}</h2>
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
