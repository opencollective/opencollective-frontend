import React from 'react';
import { useQuery } from '@apollo/client';
import { Column, ColumnDef, Row, TableMeta } from '@tanstack/react-table';
import clsx from 'clsx';
import { isNil, omit } from 'lodash';
import { ArrowDown10, ArrowDownZA, ArrowUp10, ArrowUpZA } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import {
  AccountMetricsFragment,
  Currency,
  OverviewMetricsQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { useQueryFilterReturnType } from '../../../../lib/hooks/useQueryFilter';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import { DataTable } from '../../../DataTable';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { DashboardContext } from '../../DashboardContext';

import { schema } from './CollectiveOverview';
import { ChangeBadge, getPercentageDifference, MetricProps } from './Metric';
import { metricsPerAccountQuery } from './queries';

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

const columns: ColumnDef<AccountMetricsRow>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => (
      <SortableHeader
        column={column}
        type="alphabetic"
        label={<FormattedMessage defaultMessage="Account" />}
        align="left"
      />
    ),
    meta: { className: 'min-w-0  max-w-[300px]' },

    cell: ({ row, table }) => {
      const account = row.original;
      const { queryFilter } = table.options.meta as AccountMetricsMeta;
      const selectedAccountSlug = queryFilter.values.account;
      const isSelected = selectedAccountSlug === account.slug;
      return (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              className={clsx('transition-opacity', isSelected ? 'opacity-0' : ' group-hover/row:opacity-0')}
              collective={account}
              radius={24}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() =>
                  isSelected ? queryFilter.setFilter('account', null) : queryFilter.setFilter('account', account.slug)
                }
                aria-label="Select row"
                className={clsx(
                  'transition-opacity group-hover/row:opacity-100',
                  isSelected ? 'opacity-100' : 'opacity-0',
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-hidden">
            <AccountHoverCard
              account={account}
              trigger={
                <div className="max-w-[400px] truncate">
                  <Link
                    href={getCollectivePageRoute(account)}
                    className={clsx(
                      'truncate hover:underline group-hover/row:text-foreground',
                      isSelected ? 'text-foreground' : 'text-muted-foreground ',
                    )}
                  >
                    {account.name}
                  </Link>
                </div>
              }
            />

            {account.isArchived ? (
              <Badge size="xs" className="capitalize">
                Archived {account.type.toLowerCase()}
              </Badge>
            ) : (
              <Badge size="xs" className={account.type !== 'COLLECTIVE' && 'capitalize'} type={'outline'}>
                {account.type === 'COLLECTIVE' ? 'Main account' : account.type.toLowerCase()}
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: 'comparison',
    accessorKey: 'comparison',
    meta: { className: 'text-right' },
    header: ({ column }) => (
      <SortableHeader
        align="right"
        column={column}
        label={<FormattedMessage id="PeriodCompareFilter.PreviousPeriod" defaultMessage="Previous period" />}
      />
    ),
    cell: ({ cell, table }) => {
      const comparison = cell.getValue() as number;
      const meta = table.options.meta as AccountMetricsMeta;

      return (
        <span className={'text-muted-foreground'}>
          {!isNil(comparison) &&
            (meta.isAmount ? (
              <FormattedMoneyAmount
                amount={comparison}
                currency={meta.currency}
                precision={2}
                amountStyles={{ letterSpacing: 0 }}
                showCurrencyCode={false}
              />
            ) : (
              comparison.toLocaleString()
            ))}
        </span>
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
        <span className="font-medium">
          {meta.isAmount ? (
            <FormattedMoneyAmount
              amount={current}
              currency={meta.currency}
              precision={2}
              amountStyles={{ letterSpacing: 0 }}
              showCurrencyCode={false}
            />
          ) : (
            current.toLocaleString()
          )}
        </span>
      );
    },
  },
  {
    accessorKey: 'percentageDifference',
    meta: { className: 'text-left w-14' },
    header: () => null,
    cell: ({ cell }) => {
      const diff = cell.getValue() as number;

      return (
        <div>
          <ChangeBadge size="xs" showIcon={true} showSign={false} percentageDiff={diff} />
        </div>
      );
    },
  },
];

export default function AccountTable({ accountSlug, queryFilter, metric }) {
  const { data, loading, error } = useQuery(metricsPerAccountQuery, {
    variables: {
      ...queryFilter.variables,
      slug: accountSlug,
    },
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  });
  const { account } = React.useContext(DashboardContext);
  const nbPlaceholders = account?.childrenAccounts?.nodes.length + 1;

  const currency = data?.account?.[metric.id]?.current?.currency;

  const meta = {
    selectAccount: slug => queryFilter.setFilter('account', slug),
    queryFilter,
    currency: currency,
    isAmount: !!metric.amount,
    metric,
  } as AccountMetricsMeta;

  const columnData: AccountMetricsRow[] = React.useMemo(() => {
    const nodes = data
      ? [omit(data?.account, 'childrenAccounts'), ...(data?.account.childrenAccounts.nodes ?? [])]
      : [];

    return nodes.map(node => {
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

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <DataTable
      className="border-0"
      columns={columns}
      data={columnData}
      initialSort={[{ id: 'current', desc: true }]}
      nbPlaceholders={nbPlaceholders}
      loading={loading}
      meta={meta}
    />
  );
}
