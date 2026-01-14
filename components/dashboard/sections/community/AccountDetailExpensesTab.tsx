import React from 'react';
import { useQuery } from '@apollo/client';
import { truncate, uniqBy } from 'lodash';
import { ArrowRight, ArrowRightLeft, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { getAccountReferenceInput } from '@/lib/collective';
import { CollectiveType } from '@/lib/constants/collectives';
import { integer } from '@/lib/filters/schemas';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { i18nExpenseType } from '@/lib/i18n/expense';
import { cn } from '@/lib/utils';

import Avatar from '@/components/Avatar';
import DateTime from '@/components/DateTime';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import Link from '@/components/Link';
import LinkCollective from '@/components/LinkCollective';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { actionsColumn, DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/Button';

import { Metric } from '../overview/Metric';

import { communityAccountExpensesDetailQuery } from './queries';

const FETCH_MORE_SIZE = 5;

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
    header: () => <FormattedMessage defaultMessage="Total Paid" id="TotalPaid" />,
    cell: ({ cell }) => {
      const amount = cell.getValue();
      return <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />;
    },
  },
  actionsColumn,
];

const getExpenseColumns = intl => [
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
  actionsColumn,
];

const ExpensesSection = ({
  account,
  title,
  expenses,
  setOpenExpenseId,
  host,
  loading = false,
  showSeeAllButton = false,
  handleLoadMore,
}) => {
  const intl = useIntl();
  const router = useRouter();
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  if (!expenses || expenses.nodes?.length === 0) {
    return null;
  }

  const getExpenseActions = expense => ({
    primary: [
      {
        key: 'view-transactions',
        Icon: ArrowRightLeft,
        label: intl.formatMessage({ defaultMessage: 'View transactions', id: 'DfQJQ6' }),
        onClick: () => {
          router.push({
            pathname: `/dashboard/${host.slug}/host-transactions`,
            query: {
              expenseId: expense.legacyId,
            },
          });
        },
      },
    ],
  });

  const hasMore = expenses.limit < expenses.totalCount;
  const isInitialLoading = loading && !expenses;
  return (
    <React.Fragment>
      <h1 className="font-medium">{title}</h1>
      <DataTable
        data={expenses.nodes || []}
        columns={getExpenseColumns(intl)}
        onClickRow={row => setOpenExpenseId(row.original.legacyId)}
        openDrawer={row => setOpenExpenseId(row.original.legacyId)}
        loading={isInitialLoading}
        getActions={getExpenseActions}
      />
      <div className="flex flex-wrap justify-end gap-2">
        {hasMore && (
          <Button
            variant="outline"
            disabled={isLoadingMore}
            onClick={() => {
              setIsLoadingMore(true);
              handleLoadMore().finally(() => {
                setIsLoadingMore(false);
              });
            }}
          >
            <RefreshCcw size={14} className={cn('shrink-0', isLoadingMore && 'animate-spin')} />
            <span className="capitalize">
              <FormattedMessage defaultMessage="load more" id="loadMore" />
            </span>
          </Button>
        )}
        {showSeeAllButton && (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/${host.slug}/host-expenses?searchTerm=@${account.slug}`}>
              <FormattedMessage
                defaultMessage="See all of {name}'s expenses"
                id="SeeAllExpenses"
                values={{ name: truncate(account.name, { length: 20 }) }}
              />
              <ArrowRight size={16} className="shrink-0" />
            </Link>
          </Button>
        )}
      </div>
    </React.Fragment>
  );
};

export function ExpensesTab({ account, host, setOpenExpenseId, expectedAccountType }) {
  const intl = useIntl();
  const router = useRouter();

  const queryFilters = useQueryFilter({
    schema: z.object({
      submittedExpensesOffset: integer.default(0),
      paidExpensesOffset: integer.default(0),
      approvedExpensesOffset: integer.default(0),
    }),
    filters: {},
  });

  const isIndividual = expectedAccountType === CollectiveType.INDIVIDUAL;
  const { data, loading, error, fetchMore } = useQuery(communityAccountExpensesDetailQuery, {
    fetchPolicy: 'cache-and-network',
    variables: {
      ...queryFilters.variables,
      accountId: account.id,
      host: getAccountReferenceInput(host),
      statsCurrency: host.currency,
      skipSubmittedExpenses: false,
      skipPaidExpenses: !isIndividual,
      skipApprovedExpenses: !isIndividual,
      defaultLimit: FETCH_MORE_SIZE,
    },
  });

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const accountData = data?.account;
  const paidExpenses = data?.paidExpenses;
  const approvedExpenses = data?.approvedExpenses;
  const submittedExpenses = accountData?.submittedExpenses;
  const submittedExpensesCount = submittedExpenses?.totalCount || 0;
  const totalPaid = accountData?.communityStats?.transactionSummary[0]?.expenseTotalAcc || {
    valueInCents: 0,
    currency: host.currency,
  };

  // Yearly summary actions
  const getYearlySummaryActions = summary => ({
    primary: [
      {
        key: 'view-expenses',
        Icon: ArrowRightLeft,
        label: intl.formatMessage({ defaultMessage: 'View expenses', id: 'rZDjnQ' }),
        onClick: () => {
          router.push({
            pathname: `/dashboard/${host.slug}/host-expenses`,
            query: {
              searchTerm: `@${account.slug}`,
              'date[type]': 'BETWEEN',
              'date[gte]': `${summary.year}-01-01`,
              'date[lte]': `${summary.year}-12-31`,
              status: 'ALL',
            },
          });
        },
      },
    ],
  });

  // Check if there's any activity in related expenses section
  const hasRelatedExpensesActivity =
    (approvedExpenses && approvedExpenses.nodes?.length > 0) || (paidExpenses && paidExpenses.nodes?.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* First Section: Expenses submitted by this user */}
      <div className="flex flex-col gap-6">
        <h2 className="tight text-xl font-bold text-slate-800">
          <FormattedMessage
            defaultMessage="Expenses submitted by {name}"
            id="ExpensesSubmittedByName"
            values={{ name: account.legalName || account.name || `@${account.slug}` }}
          />
        </h2>

        {/* Stats */}
        <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            label={<FormattedMessage defaultMessage="Total Paid" id="TotalPaid" />}
            amount={{ current: totalPaid }}
            loading={loading}
          />
          <Metric
            label={<FormattedMessage defaultMessage="Submitted Expenses" id="NpGb+x" />}
            count={{ current: submittedExpensesCount }}
            loading={loading}
          />
        </div>

        {/* Summary by Year */}
        <div className="flex flex-col gap-2">
          <h2 className="font-medium">
            <FormattedMessage defaultMessage="Summary by Year" id="SummaryByYear" />
          </h2>
          <DataTable
            columns={expenseSummaryColumns}
            data={accountData?.communityStats?.transactionSummary.filter(curr => curr.expenseCount > 0) || []}
            loading={loading && !accountData?.communityStats?.transactionSummary}
            getActions={getYearlySummaryActions}
          />
        </div>

        {/* Recent Expenses */}
        <ExpensesSection
          account={account}
          title={<FormattedMessage defaultMessage="Recent Expenses" id="RecentExpenses" />}
          expenses={submittedExpenses}
          setOpenExpenseId={setOpenExpenseId}
          loading={loading}
          host={host}
          showSeeAllButton={true}
          handleLoadMore={() =>
            fetchMore({
              variables: {
                submittedExpensesOffset: submittedExpenses.offset + FETCH_MORE_SIZE,
                skipPaidExpenses: true,
                skipApprovedExpenses: true,
              },
              updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) {
                  return prev;
                }

                return {
                  ...prev,
                  account: {
                    ...prev.account,
                    submittedExpenses: {
                      ...fetchMoreResult.account.submittedExpenses,
                      limit: submittedExpenses.limit + FETCH_MORE_SIZE,
                      nodes: uniqBy(
                        [...prev.account.submittedExpenses.nodes, ...fetchMoreResult.account.submittedExpenses.nodes],
                        'id',
                      ),
                    },
                  },
                };
              },
            })
          }
        />
      </div>

      {/* Second Section: Related expenses */}
      {hasRelatedExpensesActivity && (
        <div className="mt-6 flex flex-col gap-4 border-t pt-6">
          <h1 className="text-lg font-semibold">
            <FormattedMessage defaultMessage="Related expenses" id="ihL8wM" />
          </h1>
          <ExpensesSection
            account={account}
            title={<FormattedMessage defaultMessage="Approved Expenses" id="ApprovedExpenses" />}
            expenses={approvedExpenses}
            setOpenExpenseId={setOpenExpenseId}
            loading={loading}
            host={host}
            handleLoadMore={() =>
              fetchMore({
                variables: {
                  approvedExpensesOffset: approvedExpenses.offset + FETCH_MORE_SIZE,
                  skipSubmittedExpenses: true,
                  skipPaidExpenses: true,
                },
                updateQuery: (prev, { fetchMoreResult }) => {
                  if (!fetchMoreResult) {
                    return prev;
                  }
                  return {
                    ...prev,
                    approvedExpenses: {
                      ...fetchMoreResult.approvedExpenses,
                      limit: approvedExpenses.limit + FETCH_MORE_SIZE,
                      nodes: uniqBy([...prev.approvedExpenses.nodes, ...fetchMoreResult.approvedExpenses.nodes], 'id'),
                    },
                  };
                },
              })
            }
          />
          <ExpensesSection
            account={account}
            title={<FormattedMessage defaultMessage="Paid Expenses" id="PaidExpenses" />}
            expenses={paidExpenses}
            setOpenExpenseId={setOpenExpenseId}
            loading={loading}
            host={host}
            handleLoadMore={() =>
              fetchMore({
                variables: {
                  paidExpensesOffset: paidExpenses.offset + FETCH_MORE_SIZE,
                  skipSubmittedExpenses: true,
                  skipApprovedExpenses: true,
                },
                updateQuery: (prev, { fetchMoreResult }) => {
                  if (!fetchMoreResult) {
                    return prev;
                  }
                  return {
                    ...prev,
                    paidExpenses: {
                      ...fetchMoreResult.paidExpenses,
                      limit: paidExpenses.limit + FETCH_MORE_SIZE,
                      nodes: uniqBy([...prev.paidExpenses.nodes, ...fetchMoreResult.paidExpenses.nodes], 'id'),
                    },
                  };
                },
              })
            }
          />
        </div>
      )}
    </div>
  );
}
