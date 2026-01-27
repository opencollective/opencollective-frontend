import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { defineMessage, FormattedMessage } from 'react-intl';

import dayjs from '@/lib/dayjs';
import type { ManagedOrderFieldsFragment } from '@/lib/graphql/types/v2/graphql';
import { type Account, AccountType } from '@/lib/graphql/types/v2/schema';
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
import { ColumnHeader } from '@/components/table/ColumnHeader';
import { actionsColumn } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/Badge';

const columnHelper = createColumnHelper<ManagedOrderFieldsFragment>();

export const columns: ColumnDef<ManagedOrderFieldsFragment>[] = [
  columnHelper.accessor('legacyId', {
    meta: { labelMsg: defineMessage({ defaultMessage: '#', id: 'contributions.id' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => {
      const legacyId = row.original.legacyId;
      return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="cursor-default" onClick={e => e.stopPropagation()}>
          <CopyID value={legacyId}>{legacyId}</CopyID>
        </div>
      );
    },
  }),
  columnHelper.accessor('fromAccount', {
    meta: {
      className: 'max-w-[300px] overflow-hidden',
      labelMsg: defineMessage({ defaultMessage: 'Contributor', id: 'Contributor' }),
    },
    header: ctx => <ColumnHeader {...ctx} />,
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
  }),
  columnHelper.accessor('toAccount', {
    meta: {
      className: 'max-w-[250px] overflow-hidden',
      labelMsg: defineMessage({ defaultMessage: 'Beneficiary', id: 'VfJsl4' }),
    },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => {
      let beneficiaryAccount = row.original.toAccount;
      let account: string | React.ReactElement = (
        <FormattedMessage id="AccountType.MainAccount" defaultMessage="Main account" />
      );
      if ('parent' in row.original.toAccount) {
        beneficiaryAccount = row.original.toAccount.parent as Account;
        account = row.original.toAccount.name || row.original.toAccount.slug;
      }
      return (
        <AccountHoverCard
          account={beneficiaryAccount}
          trigger={
            <div>
              <div className="flex items-center gap-2">
                <div>
                  <Avatar size={32} collective={beneficiaryAccount} displayTitle={false} />
                </div>
                <div className="overflow-hidden">
                  <div className="overflow-hidden text-sm leading-5 text-ellipsis whitespace-nowrap">
                    {beneficiaryAccount.name || beneficiaryAccount.slug}
                  </div>
                  <div className="overflow-hidden text-xs leading-4 font-normal text-ellipsis whitespace-nowrap text-slate-700">
                    {account}
                  </div>
                </div>
              </div>
            </div>
          }
        />
      );
    },
  }),
  columnHelper.accessor('totalAmount', {
    meta: { labelMsg: defineMessage({ defaultMessage: 'Amount', id: 'Fields.amount' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row, table }) => {
      const { intl } = table.options.meta;
      const amountValue = row.original.totalAmount;
      const frequency = row.original.frequency;
      return (
        <div>
          <FormattedMoneyAmount
            amount={amountValue.valueInCents}
            currency={amountValue.currency}
            showCurrencyCode={false}
          />
          {['MONTHLY', 'YEARLY'].includes(frequency) && (
            <div className="overflow-hidden text-xs leading-4 font-normal text-ellipsis whitespace-nowrap text-slate-700">
              {i18nFrequency(intl, frequency)}
            </div>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('lastChargedAt', {
    meta: { labelMsg: defineMessage({ defaultMessage: 'Charge Date', id: 'Contribution.ChargeDate' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => {
      const order = row.original;
      const lastChargedAt = order.lastChargedAt || order.createdAt;
      const createdAt = order.createdAt;
      return (
        <div className="whitespace-nowrap">
          <DateTime value={lastChargedAt} dateStyle="medium" timeStyle={undefined} />
          {!dayjs(createdAt).isSame(lastChargedAt, 'day') && (
            <div className="overflow-hidden text-xs leading-4 font-normal text-ellipsis whitespace-nowrap text-slate-700">
              <FormattedMessage
                defaultMessage="Since {date}"
                id="x9TypM"
                values={{ date: <DateTime value={createdAt} dateStyle="medium" timeStyle={undefined} /> }}
              />
            </div>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    meta: { labelMsg: defineMessage({ defaultMessage: 'Created at', id: 'AbXVP4' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => {
      const order = row.original;
      const createdAt = order.createdAt;
      return (
        <div className="whitespace-nowrap">
          <DateTime value={createdAt} dateStyle="medium" timeStyle={undefined} />
        </div>
      );
    },
  }),
  columnHelper.accessor('createdByAccount', {
    meta: { labelMsg: defineMessage({ defaultMessage: 'Created by', id: 'Agreement.createdBy' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ cell, row }) => {
      const order = row.original;
      const account = cell.getValue();
      return (
        <AccountHoverCard
          account={account}
          includeAdminMembership={{
            hostSlug: order.toAccount && 'host' in order.toAccount ? order.toAccount.host.slug : undefined,
            accountSlug: order.toAccount?.slug,
          }}
          trigger={
            <div>
              <div className="flex items-center gap-1">
                <div>
                  <Avatar size={24} collective={account} displayTitle={false} />
                </div>
                <div className="overflow-hidden">
                  <div className="overflow-hidden text-sm leading-5 text-ellipsis whitespace-nowrap">
                    {account?.name || account?.slug}
                  </div>
                </div>
              </div>
            </div>
          }
        />
      );
    },
  }),
  columnHelper.accessor('paymentMethod', {
    meta: {
      className: 'whitespace-nowrap max-w-[140px]',
      labelMsg: defineMessage({ defaultMessage: 'Payment Method', id: 'paymentmethod.label' }),
    },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row, table }) => {
      const { intl } = table.options.meta;
      const pm = row.original.paymentMethod;
      if (row.original.manualPaymentProvider) {
        return (
          <div className="flex items-center gap-1">
            <Badge size="xs" type="neutral">
              <FormattedMessage defaultMessage="Manual" id="PaymentMethod.Manual" />
            </Badge>
            <span>{row.original.manualPaymentProvider.name}</span>
          </div>
        );
      } else if (row.original.pendingContributionData?.paymentMethod) {
        // We don't store this information anymore, but it used to be populated in the API. Do not migrate unless you've
        // verified that all instances have been migrated to something else.
        return i18nPaymentMethodProviderType(intl, row.original.pendingContributionData?.paymentMethod);
      }

      return (
        <div className="overflow-hidden text-ellipsis">
          <PaymentMethodTypeLabel type={pm?.type} />
        </div>
      );
    },
  }),
  columnHelper.accessor('pendingContributionData.expectedAt', {
    id: 'expectedAt',
    meta: { labelMsg: defineMessage({ defaultMessage: 'Expected Date', id: 'vNC2dX' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => {
      const order = row.original;
      const expectedAt = order.pendingContributionData?.expectedAt;
      const createdAt = order.createdAt;
      return (
        <React.Fragment>
          {expectedAt && <DateTime value={expectedAt} dateStyle="medium" timeStyle={undefined} />}
          {createdAt && (
            <div className="overflow-hidden text-xs leading-4 font-normal text-ellipsis whitespace-nowrap text-slate-700">
              <FormattedMessage
                defaultMessage="Created on {date}"
                id="contribution.createdAt"
                values={{ date: <DateTime value={createdAt} dateStyle="medium" timeStyle={undefined} /> }}
              />
            </div>
          )}
        </React.Fragment>
      );
    },
  }),
  columnHelper.accessor('status', {
    meta: { labelMsg: defineMessage({ defaultMessage: 'Status', id: 'order.status' }) },
    header: ctx => <ColumnHeader {...ctx} />,
    cell: ({ row }) => {
      const statusValue = row.original.status;
      return (
        <div data-cy="contribution-status" className="w-fit">
          <OrderStatusTag status={statusValue} />
        </div>
      );
    },
  }),
  actionsColumn,
];
