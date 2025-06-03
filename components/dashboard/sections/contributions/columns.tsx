import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';

import type { ManagedOrderFieldsFragment } from '@/lib/graphql/types/v2/graphql';
import { AccountType } from '@/lib/graphql/types/v2/schema';
import formatCollectiveType from '@/lib/i18n/collective-type';
import { i18nFrequency } from '@/lib/i18n/order';
import { i18nPaymentMethodProviderType } from '@/lib/i18n/payment-method-provider-type';

import { AccountHoverCard } from '@/components/AccountHoverCard';
import Avatar from '@/components/Avatar';
import { CopyID } from '@/components/CopyId';
import DateTime from '@/components/DateTime';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import OrderStatusTag from '@/components/orders/OrderStatusTag';
import { PaymentMethodTypeLabel } from '@/components/PaymentMethodTypeWithIcon';

export const contributor: ColumnDef<ManagedOrderFieldsFragment> = {
  accessorKey: 'fromAccount',
  header: () => <FormattedMessage id="Contributor" defaultMessage="Contributor" />,
  meta: { className: 'max-w-[300px] overflow-hidden' },
  cell: ({ row, table }) => {
    const { intl } = table.options.meta;
    const fromAccount = row.original.fromAccount;
    const createdBy = fromAccount.type !== AccountType.INDIVIDUAL && row.original.createdByAccount;

    return (
      <div className="flex items-center gap-5">
        <div className="relative">
          <div>
            <AccountHoverCard
              account={fromAccount}
              trigger={
                <span>
                  <Avatar size={32} collective={fromAccount} displayTitle={false} />
                </span>
              }
            />
          </div>
          {createdBy && (
            <div className="absolute -right-[6px] -bottom-[6px] rounded-full">
              <AccountHoverCard
                account={createdBy}
                trigger={
                  <span>
                    <Avatar size={16} collective={createdBy} displayTitle={false} />
                  </span>
                }
              />
            </div>
          )}
        </div>
        <div className="overflow-hidden">
          <div className="overflow-hidden text-sm leading-5 text-ellipsis whitespace-nowrap">
            {fromAccount.name || fromAccount.slug}
          </div>

          <div className="overflow-hidden text-xs leading-4 font-normal text-ellipsis whitespace-nowrap text-slate-700">
            {createdBy ? createdBy.name || createdBy.slug : formatCollectiveType(intl, fromAccount.type, 1)}
          </div>
        </div>
      </div>
    );
  },
};

export const beneficiary: ColumnDef<ManagedOrderFieldsFragment> = {
  accessorKey: 'toAccount',
  header: () => <FormattedMessage id="VfJsl4" defaultMessage="Beneficiary" />,
  meta: { className: 'max-w-[250px] overflow-hidden' },
  cell: ({ row }) => {
    const toAccount = row.original.toAccount;
    return (
      <AccountHoverCard
        account={toAccount}
        trigger={
          <div className="flex items-center gap-2">
            <div>
              <Avatar size={32} collective={toAccount} displayTitle={false} />
            </div>
            <div className="overflow-hidden">
              <div className="overflow-hidden text-sm leading-5 text-ellipsis whitespace-nowrap">
                {toAccount.name || toAccount.slug}
              </div>
            </div>
          </div>
        }
      />
    );
  },
};

export const amount: ColumnDef<ManagedOrderFieldsFragment> = {
  accessorKey: 'totalAmount',
  header: () => (
    <div className="flex flex-col">
      <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
      <div className="text-xs font-normal">
        <FormattedMessage id="Frequency" defaultMessage="Frequency" />
      </div>
    </div>
  ),
  cell: ({ row, table }) => {
    const { intl } = table.options.meta;
    const amount = row.original.totalAmount;
    const frequency = row.original.frequency;
    return (
      <div>
        <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} showCurrencyCode={false} />
        {['MONTHLY', 'YEARLY'].includes(frequency) && (
          <div className="overflow-hidden text-xs leading-4 font-normal text-ellipsis whitespace-nowrap text-slate-700">
            {i18nFrequency(intl, frequency)}
          </div>
        )}
      </div>
    );
  },
};

export const paymentMethod: ColumnDef<ManagedOrderFieldsFragment> = {
  accessorKey: 'paymentMethod',
  header: () => <FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />,
  meta: { className: 'whitespace-nowrap max-w-[140px]' },
  cell: ({ row, table }) => {
    const { intl } = table.options.meta;
    const pm = row.original.paymentMethod;
    if (row.original.pendingContributionData?.paymentMethod) {
      return i18nPaymentMethodProviderType(intl, row.original.pendingContributionData?.paymentMethod);
    }

    return (
      <div className="overflow-hidden text-ellipsis">
        <PaymentMethodTypeLabel type={pm?.type} />
      </div>
    );
  },
};

export const date: ColumnDef<ManagedOrderFieldsFragment> = {
  accessorKey: 'lastChargedAt',
  header: () => (
    <div className="flex flex-col whitespace-nowrap">
      <FormattedMessage id="Contribution.ChargeDate" defaultMessage="Charge Date" />
      <div className="text-xs font-normal">
        <FormattedMessage id="Contribution.SinceDate" defaultMessage="Since Date" />
      </div>
    </div>
  ),
  cell: ({ row }) => {
    const order = row.original;
    const lastChargedAt = order.lastChargedAt || order.createdAt;
    const createdAt = order.createdAt;
    return (
      <div className="whitespace-nowrap">
        <DateTime value={lastChargedAt} dateStyle="medium" timeStyle={undefined} />
        {createdAt !== lastChargedAt && (
          <div className="overflow-hidden text-xs leading-4 font-normal text-ellipsis whitespace-nowrap text-slate-700">
            <DateTime value={createdAt} dateStyle="medium" timeStyle={undefined} />
          </div>
        )}
      </div>
    );
  },
};

export const status: ColumnDef<ManagedOrderFieldsFragment> = {
  accessorKey: 'status',
  header: () => <FormattedMessage id="order.status" defaultMessage="Status" />,
  cell: ({ row }) => {
    const status = row.original.status;
    return (
      <div data-cy="contribution-status" className="w-fit">
        <OrderStatusTag status={status} />
      </div>
    );
  },
};

export const expectedAt: ColumnDef<ManagedOrderFieldsFragment> = {
  accessorKey: 'pendingContributionData.expectedAt',
  header: () => <FormattedMessage id="vNC2dX" defaultMessage="Expected Date" />,
  cell: ({ row }) => {
    const date = row.original.pendingContributionData?.expectedAt;
    return (
      date && (
        <div className="flex items-center gap-2 truncate">
          <DateTime value={date} dateStyle="medium" timeStyle={undefined} />
        </div>
      )
    );
  },
};

export const contributionId: ColumnDef<ManagedOrderFieldsFragment> = {
  accessorKey: 'legacyId',
  header: '#',
  cell: ({ row }) => {
    const legacyId = row.original.legacyId;
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div className="cursor-default" onClick={e => e.stopPropagation()}>
        <CopyID value={legacyId}>{legacyId}</CopyID>
      </div>
    );
  },
};
