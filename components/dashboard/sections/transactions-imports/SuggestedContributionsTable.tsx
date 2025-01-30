import React from 'react';
import { Banknote } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { Account, Amount, Order, OrderStatus } from '../../../../lib/graphql/types/v2/schema';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import OrderStatusTag from '../../../orders/OrderStatusTag';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { RadioGroup, RadioGroupItem } from '../../../ui/RadioGroup';
import { EmptyResults } from '../../EmptyResults';

export const SuggestedContributionsTable = ({
  loading,
  selectedContribution,
  setSelectedContribution,
  contributions,
  totalContributions,
  queryFilter,
  onAddFundsClick,
}) => {
  return (
    <RadioGroup value={selectedContribution?.id}>
      <DataTable<Order, unknown>
        loading={loading}
        nbPlaceholders={3}
        onClickRow={({ original }) => setSelectedContribution(original)}
        data={contributions}
        getRowClassName={({ original }) =>
          selectedContribution?.id === original.id
            ? 'bg-blue-50 font-semibold shadow-inner shadow-blue-100 border-l-2! border-l-blue-500'
            : ''
        }
        emptyMessage={() => (
          <EmptyResults
            hasFilters={queryFilter.hasFilters}
            entityType="CONTRIBUTIONS"
            onResetFilters={() => queryFilter.resetFilters({})}
            otherActions={
              <Button
                data-cy="reset-filters"
                size="lg"
                variant="outline"
                className="gap-2 rounded-full"
                onClick={onAddFundsClick}
              >
                <Banknote size={16} />
                <span>
                  <FormattedMessage defaultMessage="Manually add funds" id="OrmUye" />
                </span>
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
            cell: ({ cell }) => <Badge size="xs">#{cell.getValue() as number}</Badge>,
          },
          {
            id: 'date',
            header: () => <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
            accessorKey: 'createdAt',
            cell: ({ cell }) => {
              const date = cell.getValue() as string;
              return <DateTime value={new Date(date)} />;
            },
          },
          {
            id: 'amount',
            header: () => <FormattedMessage defaultMessage="Amount" id="Fields.amount" />,
            accessorKey: 'totalAmount',
            cell: ({ cell }) => {
              const value = cell.getValue() as Amount;
              return (
                <FormattedMoneyAmount amount={value.valueInCents} currency={value.currency} showCurrencyCode={false} />
              );
            },
          },
          {
            id: 'from',
            header: () => <FormattedMessage defaultMessage="From" id="dM+p3/" />,
            accessorKey: 'fromAccount',
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
            id: 'to',
            header: () => <FormattedMessage id="To" defaultMessage="To" />,
            accessorKey: 'toAccount',
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
            id: 'status',
            accessorKey: 'status',
            header: () => <FormattedMessage defaultMessage="Status" id="order.status" />,
            cell: ({ cell }) => <OrderStatusTag status={cell.getValue() as OrderStatus} />,
          },
          {
            id: 'description',
            header: () => <FormattedMessage id="Fields.description" defaultMessage="Description" />,
            accessorKey: 'description',
            cell: ({ cell }) => <div className="flex items-center gap-1">{cell.getValue() as string}</div>,
          },
        ]}
        footer={
          totalContributions > contributions.length && (
            <div className="flex justify-center border-t border-neutral-200 p-3 text-center">
              <FormattedMessage
                id="/zSZjG"
                defaultMessage="{totalContributions, plural, one {# contribution} other {# contributions}} also match your filters. Narrow down your search to see them."
                values={{ totalContributions }}
              />
            </div>
          )
        }
      />
    </RadioGroup>
  );
};
