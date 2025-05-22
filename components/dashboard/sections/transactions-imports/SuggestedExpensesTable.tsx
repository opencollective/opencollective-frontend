import React from 'react';
import { Receipt } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { Account, Amount, Expense } from '../../../../lib/graphql/types/v2/schema';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import ExpenseStatusTag from '../../../expenses/ExpenseStatusTag';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { DataTable } from '../../../table/DataTable';
import { Button } from '../../../ui/Button';
import { RadioGroup, RadioGroupItem } from '../../../ui/RadioGroup';
import { EmptyResults } from '../../EmptyResults';

export const SuggestedExpensesTable = ({
  loading,
  selectedExpense,
  setSelectedExpense,
  expenses,
  totalExpenses,
  queryFilter,
  onCreateExpenseClick,
}: {
  loading: boolean;
  selectedExpense: Expense;
  setSelectedExpense: (expense: Expense) => void;
  expenses: Expense[];
  totalExpenses: number;
  queryFilter: any;
  onCreateExpenseClick: () => void;
}) => {
  return (
    <RadioGroup value={selectedExpense?.id}>
      <DataTable<Expense, unknown>
        loading={loading}
        nbPlaceholders={3}
        onClickRow={({ original }) => setSelectedExpense(original)}
        data={expenses}
        getRowClassName={({ original }) =>
          selectedExpense?.id === original.id
            ? 'bg-blue-50 font-semibold shadow-inner shadow-blue-100 border-l-2! border-l-blue-500'
            : 'border-l-2! border-l-transparent'
        }
        emptyMessage={() => (
          <EmptyResults
            hasFilters={queryFilter.hasFilters}
            entityType="EXPENSES"
            onResetFilters={() => queryFilter.resetFilters()}
            imageSize={120}
            otherActions={
              <Button data-cy="create-expense" variant="outline" onClick={onCreateExpenseClick}>
                <Receipt size={16} className="mr-2" />
                <FormattedMessage defaultMessage="Create new expense" id="tbnLgX" />
              </Button>
            }
          />
        )}
        columns={[
          {
            id: 'select',
            cell: ({ row }) => <RadioGroupItem value={row.original.id} />,
            meta: { className: 'w-[20px]' },
          },
          {
            id: 'id',
            header: () => <FormattedMessage id="Fields.id" defaultMessage="ID" />,
            accessorKey: 'legacyId',
            cell: ({ cell }) => `#${cell.getValue() as number}`,
          },
          {
            id: 'date',
            header: () => <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
            accessorKey: 'incurredAt',
            cell: ({ cell }) => {
              const date = cell.getValue() as string;
              return <DateTime value={new Date(date)} dateStyle="medium" />;
            },
          },
          {
            id: 'amount',
            header: () => <FormattedMessage defaultMessage="Amount" id="Fields.amount" />,
            accessorKey: 'amountV2',
            cell: ({ cell }) => {
              const value = cell.getValue() as Amount;
              return (
                <FormattedMoneyAmount amount={value.valueInCents} currency={value.currency} showCurrencyCode={false} />
              );
            },
          },
          {
            id: 'account',
            header: () => <FormattedMessage defaultMessage="Account" id="TwyMau" />,
            accessorKey: 'account',
            cell: ({ cell }) => {
              const account = cell.getValue() as Account;
              return (
                <div className="flex items-center gap-1">
                  <Avatar account={account} size={24} />
                  {account.name}
                </div>
              );
            },
          },
          {
            id: 'payee',
            header: () => <FormattedMessage defaultMessage="Payee" id="SecurityScope.Payee" />,
            accessorKey: 'payee',
            cell: ({ cell }) => {
              const account = cell.getValue() as Account;
              return (
                <div className="flex items-center gap-1">
                  <Avatar account={account} size={24} />
                  {account.name}
                </div>
              );
            },
          },
          {
            id: 'description',
            header: () => <FormattedMessage id="Fields.description" defaultMessage="Description" />,
            accessorKey: 'description',
            cell: ({ cell }) => <div className="flex items-center gap-1">{cell.getValue() as string}</div>,
          },
          {
            id: 'status',
            accessorKey: 'status',
            header: () => <FormattedMessage defaultMessage="Status" id="Fields.status" />,
            cell: ({ cell }) => <ExpenseStatusTag status={cell.getValue() as string} />,
          },
        ]}
        footer={
          totalExpenses > expenses.length && (
            <div className="flex justify-center border-t border-neutral-200 p-3 text-center">
              <FormattedMessage
                id="SuggestedExpensesTable.MoreResults"
                defaultMessage="{nbExpenses, plural, one {# expense} other {# expenses}} also match your filters. Narrow down your search to see {nbExpenses, plural, one {it} other {them}}."
                values={{ nbExpenses: totalExpenses - expenses.length }}
              />
            </div>
          )
        }
      />
    </RadioGroup>
  );
};
