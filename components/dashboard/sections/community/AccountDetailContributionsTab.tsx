import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { integer } from '@/lib/filters/schemas';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { i18nExpenseType } from '@/lib/i18n/expense';

import Avatar from '@/components/Avatar';
import DateTime from '@/components/DateTime';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import LinkCollective from '@/components/LinkCollective';
import OrderStatusTag from '@/components/orders/OrderStatusTag';
import { DataTable } from '@/components/table/DataTable';

import { Pagination } from '../../filters/Pagination';
import { Metric } from '../overview/Metric';

import { communityAccountContributionsDetailQuery } from './queries';

const contributionColumns = intl => [
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage defaultMessage="Date" id="expense.incurredAt" />,
    cell: ({ cell }) => {
      return <DateTime value={cell.getValue()} />;
    },
  },
  {
    accessorKey: 'toAccount',
    header: () => <FormattedMessage defaultMessage="Collective" id="Collective" />,
    cell: ({ row }) => {
      const order = row.original;
      return (
        <LinkCollective collective={order.toAccount} withHoverCard>
          <Avatar size={24} collective={order.toAccount} mr={2} />
        </LinkCollective>
      );
    },
  },
  {
    accessorKey: 'description',
    header: () => <FormattedMessage defaultMessage="Description" id="Fields.description" />,
    cell: ({ cell }) => {
      const expense = cell.row.original;
      return (
        <div className="flex flex-col">
          <span>{expense.description}</span>
          <span className="text-xs text-muted-foreground">
            {i18nExpenseType(intl, expense.type)}
            {expense.accountingCategory && <span>: {expense.accountingCategory.name}</span>}
            {!expense.accountingCategory && expense.tags?.length > 0 && <span>: {expense.tags.join(', ')}</span>}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: () => <FormattedMessage defaultMessage="Status" id="Status" />,
    cell: ({ cell }) => {
      const status = cell.getValue();
      return <OrderStatusTag status={status} />;
    },
  },
  {
    accessorKey: 'totalContributed',
    header: () => <FormattedMessage id="TotalContributed" defaultMessage="Total Contributed" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />;
    },
    meta: { className: 'text-right' },
  },
];

const contributionSummaryColumns = [
  {
    accessorKey: 'year',
    header: () => <FormattedMessage defaultMessage="Year" id="IFo1oo" />,
    cell: ({ cell }) => {
      return cell.getValue();
    },
  },
  {
    accessorKey: 'contributionCount',
    header: () => <FormattedMessage defaultMessage="Charged Processed" id="ChargesProcessed" />,
    cell: ({ cell }) => {
      return cell.getValue();
    },
  },
  {
    accessorKey: 'contributionTotal',
    header: () => <FormattedMessage defaultMessage="Total Contributed" id="TotalContributed" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />;
    },
  },
];
export function ContributionsTab({ account, host, setOpenContributionId }) {
  const intl = useIntl();
  const pagination = useQueryFilter({
    schema: z.object({ limit: integer.default(5), offset: integer.default(0) }),
    filters: {},
    skipRouter: true,
  });

  const { data, loading } = useQuery(communityAccountContributionsDetailQuery, {
    variables: {
      accountId: account.id,
      host: host,
      ...pagination.variables,
    },
  });

  const totalContributed = data?.account?.communityStats?.transactionSummary[0]?.contributionTotalAcc || {
    valueInCents: 0,
    currency: host.currency,
  };
  const ordersCount = data?.account?.orders.totalCount || 0;
  const chargeCount = data?.account?.communityStats?.transactionSummary[0]?.contributionCountAcc || 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label={<FormattedMessage defaultMessage="Total Contributed" id="TotalContributed" />}
          amount={{ current: totalContributed }}
          loading={loading}
        />
        <Metric
          label={<FormattedMessage defaultMessage="Number of Contributions" id="NumberContributions" />}
          count={{ current: ordersCount }}
          loading={loading}
        />
        <Metric
          label={<FormattedMessage defaultMessage="Processed Charges" id="NumberProcessedCharges" />}
          count={{ current: chargeCount }}
          loading={loading}
        />
      </div>
      <DataTable
        columns={contributionSummaryColumns}
        data={data?.account?.communityStats?.transactionSummary?.filter(curr => curr.contributionCount > 0) || []}
        loading={loading}
      />
      <h1 className="font-medium">
        <FormattedMessage defaultMessage="Contributions" id="Contributions" />
      </h1>
      <DataTable
        data={data?.account?.orders.nodes || []}
        columns={contributionColumns(intl)}
        onClickRow={row => setOpenContributionId(row.original.legacyId)}
        loading={loading}
      />
      <Pagination queryFilter={pagination} total={data?.account?.orders.totalCount} />
    </div>
  );
}
