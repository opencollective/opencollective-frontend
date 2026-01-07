import React from 'react';
import { useQuery } from '@apollo/client';
import { truncate } from 'lodash';
import { ArrowRight, ArrowRightLeft, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { getAccountReferenceInput } from '@/lib/collective';
import { TransactionKind } from '@/lib/constants/transactions';
import { integer } from '@/lib/filters/schemas';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { i18nExpenseType } from '@/lib/i18n/expense';
import { cn } from '@/lib/utils';

import Avatar from '@/components/Avatar';
import DateTime from '@/components/DateTime';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import Link from '@/components/Link';
import LinkCollective from '@/components/LinkCollective';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import OrderStatusTag from '@/components/orders/OrderStatusTag';
import { actionsColumn, DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/Button';

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
    header: () => <FormattedMessage defaultMessage="Charges" id="Dx5IBb" />,
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
  actionsColumn,
];
export function ContributionsTab({ account, host, setOpenContributionId }) {
  const intl = useIntl();
  const router = useRouter();
  const pagination = useQueryFilter({
    schema: z.object({ limit: integer.default(5), offset: integer.default(0) }),
    filters: {},
    skipRouter: true,
  });

  const { data, previousData, loading, error } = useQuery(communityAccountContributionsDetailQuery, {
    variables: {
      accountId: account.id,
      host: getAccountReferenceInput(host),
      ...pagination.variables,
    },
  });

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const getYearlySummaryActions = summary => ({
    primary: [
      {
        key: 'view-transactions',
        Icon: ArrowRightLeft,
        label: intl.formatMessage({ defaultMessage: 'View transactions', id: 'DfQJQ6' }),
        onClick: () => {
          router.push({
            pathname: `/dashboard/${host.slug}/host-transactions`,
            query: {
              searchTerm: `@${account.slug}`,
              'date[type]': 'BETWEEN',
              'date[gte]': `${summary.year}-01-01`,
              'date[lte]': `${summary.year}-12-31`,
              kind: [TransactionKind.CONTRIBUTION, TransactionKind.ADDED_FUNDS],
            },
          });
        },
      },
    ],
  });

  const canUsePreviousData = previousData?.account?.id === account.id;
  const accountData = data?.account || (canUsePreviousData ? previousData?.account : null);
  const totalContributions = accountData?.orders.totalCount || 0;
  const currentLimit = pagination.values.limit;
  const hasMore = currentLimit < totalContributions;
  const totalContributed = accountData?.communityStats?.transactionSummary[0]?.contributionTotalAcc || {
    valueInCents: 0,
    currency: host.currency,
  };
  const ordersCount = accountData?.orders.totalCount || 0;
  const chargeCount = accountData?.communityStats?.transactionSummary[0]?.contributionCountAcc || 0;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="tight text-xl font-bold text-slate-800">
        <FormattedMessage
          defaultMessage="Contributions made by {name}"
          id="ContributionsMadeByName"
          values={{ name: account.legalName || account.name || `@${account.slug}` }}
        />
      </h2>
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
          label={<FormattedMessage defaultMessage="Charges" id="Dx5IBb" />}
          count={{ current: chargeCount }}
          loading={loading}
        />
      </div>
      <h1 className="font-medium">
        <FormattedMessage defaultMessage="Summary by Year" id="SummaryByYear" />
      </h1>
      <DataTable
        columns={contributionSummaryColumns}
        data={accountData?.communityStats?.transactionSummary?.filter(curr => curr.contributionCount > 0) || []}
        loading={loading && !accountData?.communityStats?.transactionSummary}
        getActions={getYearlySummaryActions}
      />
      <h1 className="font-medium">
        <FormattedMessage defaultMessage="Recent Contributions" id="RecentContributions" />
      </h1>
      <DataTable
        data={accountData?.orders.nodes || []}
        columns={contributionColumns(intl)}
        onClickRow={row => setOpenContributionId(row.original.legacyId)}
        loading={loading && !accountData}
      />
      <div className="flex flex-wrap justify-end gap-2">
        {hasMore && (
          <Button
            variant="outline"
            loading={Boolean(loading && accountData)}
            onClick={() => {
              const currentLimit = pagination.values.limit;
              pagination.setFilter('limit', currentLimit + 5);
            }}
          >
            <RefreshCcw size={14} className={cn('shrink-0', loading && 'animate-spin')} />
            <span className="capitalize">
              <FormattedMessage defaultMessage="load more" id="loadMore" />
            </span>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={`/dashboard/${host.slug}/incoming-contributions?searchTerm=@${account.slug}`}>
            <FormattedMessage
              defaultMessage="See all of {name}'s contributions"
              id="SeeAllContributions"
              values={{ name: truncate(account.name, { length: 20 }) }}
            />
            <ArrowRight size={16} className="shrink-0" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
