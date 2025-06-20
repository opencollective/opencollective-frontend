import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import type { ColumnDef } from '@tanstack/react-table';
import { Sparkles } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { limit, offset } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { getDashboardRoute } from '../../../../lib/url-helpers';
import type { Expense } from '@/lib/graphql/types/v2/schema';

import LinkExpense from '@/components/LinkExpense';

import { MemoizedAccountingCategorySelect } from '../../../AccountingCategorySelect';
import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import { editExpenseCategoryMutation } from '../../../expenses/graphql/mutations';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';

const hostUncategorizedExpensesQuery = gql`
  query HostUncategorizedExpenses($hostSlug: String!, $limit: Int!, $offset: Int!) {
    expenses(
      host: { slug: $hostSlug }
      accountingCategory: ["__uncategorized__"]
      limit: $limit
      offset: $offset
      orderBy: { field: CREATED_AT, direction: DESC }
      status: [PAID]
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        legacyId
        description
        incurredAt
        amountV2 {
          valueInCents
          currency
        }
        currency
        type
        status
        createdAt
        items {
          id
          description
        }
        account {
          id
          slug
          name
          type
          imageUrl
        }
        accountingCategory {
          id
          code
          name
          friendlyName
        }
        accountingCategoryPrediction {
          id
          code
          name
          friendlyName
        }
        host {
          id
          slug
          type
          accountingCategories(kind: EXPENSE) {
            nodes {
              id
              code
              name
              friendlyName
              kind
              expensesTypes
              appliesTo
            }
          }
        }
      }
    }
  }
`;

const HostUncategorizedExpenses = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [savingExpenseIds, setSavingExpenseIds] = React.useState(() => new Set<string>());

  // Create a simple queryFilter object for pagination
  const queryFilter = React.useMemo(() => {
    const schema = z.object({
      limit,
      offset,
    });

    const defaultSchemaValues = schema.parse({});

    return {
      values: {
        limit: pageSize,
        offset: page * pageSize,
      },
      setFilter: (filterName: string, value: any) => {
        if (filterName === 'limit') {
          setPageSize(value);
          setPage(0);
        } else if (filterName === 'offset') {
          setPage(value / pageSize);
        }
      },
      defaultSchemaValues,
    };
  }, [page, pageSize]);

  const { data, loading, error } = useQuery(hostUncategorizedExpensesQuery, {
    variables: {
      hostSlug,
      limit: pageSize,
      offset: page * pageSize,
    },
    context: API_V2_CONTEXT,
  });

  const [editExpense] = useMutation(editExpenseCategoryMutation, { context: API_V2_CONTEXT });

  const handleCategoryChange = async (expenseId: string, category: any) => {
    try {
      setSavingExpenseIds(prev => {
        const newSet = new Set(prev);
        newSet.add(expenseId);
        return newSet;
      });
      await editExpense({
        variables: {
          expenseId,
          category: category ? { id: category.id } : null,
        },
      });
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    } finally {
      setSavingExpenseIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(expenseId);
        return newSet;
      });
    }
  };

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'account',
      header: () => <FormattedMessage defaultMessage="Account" id="Account" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar collective={row.original.account} size={24} />
          <Link href={getDashboardRoute(row.original.account, 'expenses')}>{row.original.account.name}</Link>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: () => <FormattedMessage defaultMessage="Description" id="Description" />,
      cell: ({ row }) => (
        <div className="max-w-md">
          <div className="font-medium">
            <LinkExpense collective={row.original.account} expense={row.original} className="hover:underline">
              {row.original.description}
            </LinkExpense>
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.items.map(item => item.description).join(', ')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'incurredAt',
      header: () => <FormattedMessage defaultMessage="Date" id="expense.incurredAt" />,
      cell: ({ row }) => <DateTime value={new Date(row.original.incurredAt)} dateStyle="medium" />,
    },
    {
      accessorKey: 'amountV2',
      header: () => <FormattedMessage defaultMessage="Amount" id="/0TOL5" />,
      cell: ({ row }) => (
        <FormattedMoneyAmount amount={row.original.amountV2.valueInCents} currency={row.original.amountV2.currency} />
      ),
    },
    {
      accessorKey: 'type',
      header: () => <FormattedMessage defaultMessage="Type" id="Type" />,
      cell: ({ row }) => <Badge>{row.original.type}</Badge>,
    },
    {
      accessorKey: 'accountingCategory',
      header: () => <FormattedMessage defaultMessage="Accounting Category" id="AccountingCategory" />,
      cell: ({ row }) => {
        const expense = row.original;
        const hasPrediction = Boolean(expense.accountingCategoryPrediction);

        return (
          <div className="space-y-2">
            <MemoizedAccountingCategorySelect
              host={expense.host}
              account={expense.account}
              kind="EXPENSE"
              expenseType={expense.type}
              selectedCategory={expense.accountingCategory}
              onChange={category => handleCategoryChange(expense.id, category)}
              predictionStyle="inline-preload"
              disabled={savingExpenseIds.has(expense.id)}
              expenseValues={{
                type: expense.type,
                description: expense.description,
                items: expense.items,
              }}
              buttonClassName="w-full"
              showCode
              allowNone
            />
            {hasPrediction && !expense.accountingCategory && (
              <div className="flex items-center justify-between gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-600" />
                  <span className="text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Suggested" id="Suggested" />:{' '}
                    {expense.accountingCategoryPrediction.friendlyName || expense.accountingCategoryPrediction.name}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCategoryChange(expense.id, expense.accountingCategoryPrediction)}
                  className="shrink-0"
                  loading={savingExpenseIds.has(expense.id)}
                >
                  <FormattedMessage defaultMessage="Apply" id="Apply" />
                </Button>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const expenses = data?.expenses?.nodes || [];
  const totalCount = data?.expenses?.totalCount || 0;

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">
          <FormattedMessage defaultMessage="Error loading expenses" id="ErrorLoadingExpenses" />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          <FormattedMessage defaultMessage="Uncategorized Expenses" id="HostUncategorizedExpenses" />
        </h1>
        <p className="text-muted-foreground">
          <FormattedMessage
            defaultMessage="Review and categorize expenses that don't have an accounting category assigned."
            id="HostUncategorizedExpensesDescription"
          />
        </p>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        emptyMessage={() => (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              <FormattedMessage defaultMessage="No uncategorized expenses found" id="NoUncategorizedExpenses" />
            </p>
          </div>
        )}
      />

      <Pagination queryFilter={queryFilter} total={totalCount} hideLimitSelector />
    </div>
  );
};

export default HostUncategorizedExpenses;
