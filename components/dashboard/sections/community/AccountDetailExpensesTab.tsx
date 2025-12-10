import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { integer } from '@/lib/filters/schemas';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { i18nExpenseType } from '@/lib/i18n/expense';

import Avatar from '@/components/Avatar';
import DateTime from '@/components/DateTime';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import LinkCollective from '@/components/LinkCollective';
import { DataTable } from '@/components/table/DataTable';

import { Pagination } from '../../filters/Pagination';
import { Metric } from '../overview/Metric';

import { communityAccountExpensesDetailQuery } from './queries';

const expenseSummaryColumns = [
  {
    accessorKey: 'year',
    header: () => <FormattedMessage defaultMessage="Year" id="IFo1oo" />,
    cell: ({ cell }) => {
      return cell.getValue();
    },
  },
  {
    accessorKey: 'expenseCount',
    header: () => <FormattedMessage defaultMessage="Expenses Submitted" id="ExpensesSubmitted" />,
    cell: ({ cell }) => {
      return cell.getValue();
    },
  },
  {
    accessorKey: 'expenseTotal',
    header: () => <FormattedMessage defaultMessage="Total Expended" id="TotalExpended" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />;
    },
  },
];

const expenseColumns = intl => [
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage defaultMessage="Date" id="expense.incurredAt" />,
    cell: ({ cell }) => {
      return <DateTime value={cell.getValue()} />;
    },
  },
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Collective" id="Collective" />,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <LinkCollective collective={expense.account} withHoverCard>
          <Avatar size={24} collective={expense.account} mr={2} />
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
      return <ExpenseStatusTag status={status} />;
    },
  },
  {
    accessorKey: 'amount',
    header: () => <FormattedMessage id="TotalAmount" defaultMessage="Total amount" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />;
    },
    meta: { className: 'text-right' },
  },
];

export function ExpensesTab({ account, host, setOpenExpenseId }) {
  const intl = useIntl();
  const pagination = useQueryFilter({
    schema: z.object({ limit: integer.default(5), offset: integer.default(0) }),
    filters: {},
    skipRouter: true,
  });
  const { data, loading } = useQuery(communityAccountExpensesDetailQuery, {
    variables: {
      accountId: account.id,
      host: host,
      ...pagination.variables,
    },
    nextFetchPolicy: 'cache-and-network',
  });
  const totalExpended = data?.account?.communityStats?.transactionSummary[0]?.expenseTotalAcc || {
    valueInCents: 0,
    currency: host.currency,
  };
  const expenseCount = data?.account?.communityStats?.transactionSummary[0]?.expenseCountAcc || 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label={<FormattedMessage defaultMessage="Total Received" id="TotalReceived" />}
          amount={{ current: totalExpended }}
          loading={loading}
        />
        <Metric
          label={<FormattedMessage defaultMessage="Paid Expenses" id="NumberPaidExpenses" />}
          count={{ current: expenseCount }}
          loading={loading}
        />
      </div>
      <DataTable
        columns={expenseSummaryColumns}
        data={data?.account?.communityStats?.transactionSummary.filter(curr => curr.expenseCount > 0) || []}
        loading={loading}
      />
      <h1 className="font-medium">
        <FormattedMessage defaultMessage="Expenses" id="Expenses" />
      </h1>
      <DataTable
        data={data?.account?.expenses.nodes || []}
        columns={expenseColumns(intl)}
        onClickRow={row => setOpenExpenseId(row.original.legacyId)}
        loading={loading}
      />
      <Pagination queryFilter={pagination} total={data?.account?.expenses.totalCount} />
    </div>
  );
}
