import React from 'react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import formatAccountType from '@/lib/i18n/account-type';

import Avatar from '@/components/Avatar';
import type { HostedCollectivesDataTableMeta } from '@/components/dashboard/sections/collectives/common';
import { cols } from '@/components/dashboard/sections/collectives/common';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { DataTable } from '@/components/table/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

import type { HostedAccountFieldsData } from './types';

type HostedAccountAccountsTabProps = {
  account?: HostedAccountFieldsData;
  host?: { id?: string } | null;
  loading?: boolean;
  onEdit?: () => void;
};

const nameColumn = {
  accessorKey: 'account',
  header: () => <FormattedMessage id="Fields.name" defaultMessage="Name" />,
  cell: ({ row }) => {
    const rowAccount = row.original;
    return (
      <div className="flex items-center gap-2">
        <Avatar collective={rowAccount} radius={24} />
        <span className="text-sm">{rowAccount.name}</span>
      </div>
    );
  },
};

const typeColumn = {
  accessorKey: 'type',
  header: () => null,
  cell: ({ row, table }) => {
    const { intl } = table.options.meta as { intl: IntlShape };
    const rowAccount = row.original;
    return (
      <Badge type="outline" size="sm">
        {rowAccount.__isMain ? (
          <FormattedMessage defaultMessage="Main account" id="AccountType.MainAccount" />
        ) : (
          formatAccountType(intl, rowAccount.type)
        )}
      </Badge>
    );
  },
};

export function HostedAccountAccountsTab({ account, host, loading, onEdit }: HostedAccountAccountsTabProps) {
  const intl = useIntl();
  const children = account?.childrenAccounts?.nodes || [];

  const mainRow = account ? { ...account, __isMain: true } : null;
  const rows = mainRow ? [mainRow, ...children] : children;
  const consolidatedBalance = account?.stats?.consolidatedBalance;

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full max-w-xs space-y-1 rounded-lg border p-3">
        <span className="block text-sm font-medium tracking-tight">
          <FormattedMessage id="TotalBalance" defaultMessage="Total Balance" />
        </span>
        {loading ? (
          <Skeleton className="mt-1 h-7 w-1/2" />
        ) : (
          <span className="block text-2xl font-bold">
            {consolidatedBalance ? (
              <FormattedMoneyAmount
                amount={consolidatedBalance.valueInCents}
                currency={consolidatedBalance.currency}
                precision={2}
                showCurrencyCode
              />
            ) : (
              '—'
            )}
          </span>
        )}
      </div>
      <DataTable
        innerClassName="text-muted-foreground"
        columns={[nameColumn, typeColumn, cols.hostedSince, cols.balance, cols.actions]}
        data={rows}
        loading={loading}
        mobileTableView
        compact
        meta={{ intl, host, onEdit } as unknown as HostedCollectivesDataTableMeta}
      />
    </div>
  );
}
