import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowRight } from 'lucide-react';
import { defineMessage, useIntl } from 'react-intl';

import { useDrawer } from '../../../../lib/hooks/useDrawer';
import type { useQueryFilterReturnType } from '../../../../lib/hooks/useQueryFilter';
import { i18nPaymentIntentType } from '../../../../lib/i18n/payment-intent';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import { ColumnHeader } from '../../../table/ColumnHeader';
import { DataTable } from '../../../table/DataTable';
import { Pagination } from '../../filters/Pagination';

import type { schema } from './filters';
import { PaymentIntentDrawer } from './PaymentIntentDrawer';
import { PaymentIntentStatusBadge } from './PaymentIntentStatusBadge';
import type { PaymentIntentsTableQueryNode } from './types';

const columnHelper = createColumnHelper<PaymentIntentsTableQueryNode>();

const AccountCell = ({ account }: { account: PaymentIntentsTableQueryNode['payer'] }) => {
  if (!account) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <AccountHoverCard
      account={account}
      trigger={
        <LinkCollective
          collective={account}
          className="flex items-center gap-2 hover:no-underline"
          onClick={e => e.preventDefault()}
        >
          <Avatar size={24} collective={account} />
          <span className="truncate font-medium">{account.name || account.slug}</span>
        </LinkCollective>
      }
    />
  );
};

const DescriptionCell = ({ paymentIntent }: { paymentIntent: PaymentIntentsTableQueryNode }) => {
  const intl = useIntl();
  return (
    <div className="flex flex-col overflow-hidden">
      <span className="truncate font-medium">{paymentIntent.description || '-'}</span>
      <span className="truncate text-xs text-muted-foreground">{i18nPaymentIntentType(intl, paymentIntent.type)}</span>
    </div>
  );
};

const columns: ColumnDef<PaymentIntentsTableQueryNode>[] = [
  columnHelper.accessor('createdAt', {
    id: 'date',
    meta: { className: 'w-40', labelMsg: defineMessage({ defaultMessage: 'Date', id: 'expense.incurredAt' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => (
      <DateTime
        className="whitespace-nowrap"
        dateStyle="medium"
        value={row.original.paidAt ?? row.original.createdAt}
      />
    ),
  }),
  columnHelper.accessor('description', {
    meta: { labelMsg: defineMessage({ defaultMessage: 'Description', id: 'Fields.description' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => <DescriptionCell paymentIntent={row.original} />,
  }),
  columnHelper.accessor('payer', {
    meta: { className: 'max-w-40', labelMsg: defineMessage({ defaultMessage: 'Payer', id: 'noTqHQ' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => <AccountCell account={row.original.payer} />,
  }),
  columnHelper.display({
    id: 'arrow',
    meta: { className: 'w-6' },
    cell: () => <ArrowRight size={14} className="text-muted-foreground" />,
  }),
  columnHelper.accessor('payee', {
    meta: { className: 'max-w-40', labelMsg: defineMessage({ defaultMessage: 'Payee', id: 'SecurityScope.Payee' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => <AccountCell account={row.original.payee} />,
  }),
  columnHelper.accessor('status', {
    meta: { className: 'max-w-28', labelMsg: defineMessage({ defaultMessage: 'Status', id: 'tzMNF3' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => <PaymentIntentStatusBadge status={row.original.status} />,
  }),
  columnHelper.accessor('amountSent', {
    meta: {
      className: 'min-w-28 text-right',
      align: 'right',
      labelMsg: defineMessage({ defaultMessage: 'Amount', id: 'Fields.amount' }),
    },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => {
      const amount = row.original.amountSent ?? row.original.amountPledged;
      if (!amount) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="font-medium">
          <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />
        </span>
      );
    },
  }),
];

type PaymentIntentsTableProps = {
  paymentIntents?: { nodes: PaymentIntentsTableQueryNode[]; totalCount: number };
  loading?: boolean;
  nbPlaceholders?: number;
  queryFilter: useQueryFilterReturnType<typeof schema, unknown>;
};

export default function PaymentIntentsTable({
  paymentIntents,
  loading,
  nbPlaceholders,
  queryFilter,
}: PaymentIntentsTableProps) {
  const { openDrawer, drawerProps } = useDrawer({
    open: Boolean(queryFilter.values.openPaymentIntentId),
    onOpen: id => queryFilter.setFilter('openPaymentIntentId', id, false),
    onClose: () => queryFilter.setFilter('openPaymentIntentId', undefined, false),
  });

  return (
    <React.Fragment>
      <DataTable
        data-cy="payment-intents-table"
        innerClassName="text-muted-foreground"
        columns={columns}
        data={paymentIntents?.nodes || []}
        loading={loading}
        nbPlaceholders={nbPlaceholders}
        mobileTableView
        getRowId={row => row.publicId}
        onClickRow={(row, menuRef) => openDrawer(row.id, menuRef)}
      />
      <Pagination queryFilter={queryFilter} total={paymentIntents?.totalCount} />
      <PaymentIntentDrawer {...drawerProps} publicId={queryFilter.values.openPaymentIntentId} />
    </React.Fragment>
  );
}
