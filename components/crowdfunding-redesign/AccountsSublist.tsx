import React from 'react';
import type { Column, ColumnDef, Row, TableMeta } from '@tanstack/react-table';
import clsx from 'clsx';
import { isNil, omit } from 'lodash';
import { ArrowDown10, ArrowDownZA, ArrowUp10, ArrowUpZA, ChevronRight } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type {
  AccountMetricsFragment,
  Currency,
  OverviewMetricsQueryVariables,
} from '../../lib/graphql/types/v2/graphql';
import type { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import type { schema } from '../dashboard/sections/overview/CollectiveOverview';
import type { MetricProps } from '../dashboard/sections/overview/Metric';
import { ChangeBadge, getPercentageDifference } from '../dashboard/sections/overview/Metric';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import { DataTable } from '../table/DataTable';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { useRouter } from 'next/router';
type AccountMetricsRow = AccountMetricsFragment & {
  current: number;
  comparison?: number;
  percentageDifference?: number;
};

interface AccountMetricsMeta extends TableMeta<AccountMetricsRow> {
  currency: Currency;
  isAmount: boolean;
  queryFilter: useQueryFilterReturnType<typeof schema, OverviewMetricsQueryVariables>;
  metric: MetricProps;
}

const SortableHeader = ({
  column,
  label,
  type,
  align,
}: {
  column: Column<AccountMetricsRow, unknown>;
  label: React.ReactNode;
  type?: 'alphabetic' | 'numerical';
  align?: 'left' | 'right';
}) => {
  const isSorted = column.getIsSorted();
  const isSortedDesc = isSorted === 'desc';
  const UpIcon = type === 'alphabetic' ? ArrowUpZA : ArrowUp10;
  const DownIcon = type === 'alphabetic' ? ArrowDownZA : ArrowDown10;
  const SortIcon = isSortedDesc || !isSorted ? UpIcon : DownIcon;
  return (
    <div className={clsx('flex items-center', align === 'right' && 'justify-end')}>
      <Button
        variant="ghost"
        size="xs"
        className={clsx('group/btn -m-2 gap-2', isSorted && 'text-foreground')}
        onClick={() => column.toggleSorting(!isSortedDesc)}
      >
        <SortIcon
          className={clsx(
            'h-4 w-4 transition-colors',
            isSorted ? 'text-muted-foreground' : 'text-transparent group-hover/btn:text-muted-foreground',
          )}
        />
        <span className={clsx(align === 'left' && '-order-1')}>{label}</span>
      </Button>
    </div>
  );
};
const columns: ColumnDef<AccountMetricsRow>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader
        column={column}
        type="alphabetic"
        label={<FormattedMessage defaultMessage="Name" id="HAlOn1" />}
        align="left"
      />
    ),
    meta: { className: 'min-w-0  max-w-[300px]' },

    cell: ({ row, table }) => {
      const account = row.original;
      //   const { queryFilter } = table.options.meta as AccountMetricsMeta;
      //   const selectedAccountSlug = queryFilter.values.account;
      return (
        <div className="flex items-center gap-3 text-base">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <AccountHoverCard
              account={account}
              trigger={
                <div className="max-w-[400px] truncate">
                  <Link
                    href={getCollectivePageRoute(account)}
                    className={clsx('truncate hover:underline group-hover/row:text-foreground')}
                  >
                    {account.name}
                  </Link>
                </div>
              }
            />

            {account.isArchived && (
              <Badge size="xs" className="capitalize">
                Archived {account.type.toLowerCase()}
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: 'current',
    accessorKey: 'current',
    meta: { className: 'text-right' },
    header: ({ column, table }) => {
      const meta = table.options.meta as AccountMetricsMeta;
      return <SortableHeader align="right" column={column} label={meta.metric.label} />;
    },
    sortingFn: (rowA: Row<AccountMetricsRow>, rowB: Row<AccountMetricsRow>): number => {
      const a = rowA.original.current;
      const b = rowB.original.current;

      const diff = a - b;

      // sort by comparison value if current is the same
      if (diff === 0) {
        const rowAPrevious = rowA.original.comparison;
        const rowBPrevious = rowB.original.comparison;
        return rowAPrevious - rowBPrevious;
      }
      return a - b;
    },
    cell: ({ cell, table }) => {
      const current = cell.getValue() as number;
      const meta = table.options.meta as AccountMetricsMeta;

      return (
        <div className="flex items-center justify-end gap-2">
          <span className="text-base font-medium">
            {meta.isAmount ? (
              <FormattedMoneyAmount amount={current} currency={meta.currency} precision={2} showCurrencyCode={false} />
            ) : (
              current.toLocaleString()
            )}
          </span>
          <ChevronRight size={20} className="text-muted-foreground" />
        </div>
      );
    },
  },
];

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
  }, [metric.id, data]);
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

      {/* <DataTable
        hideHeader
        className="bg-background"
        columns={columns}
        data={columnData}
        initialSort={[{ id: 'current', desc: true }]}
        nbPlaceholders={nbPlaceholders}
        loading={loading}
        meta={meta}
      /> */}
    </div>
  );
}
