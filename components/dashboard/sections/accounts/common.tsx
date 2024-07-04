import React from 'react';
import type { ColumnDef, TableMeta } from '@tanstack/react-table';
import type { IntlShape } from 'react-intl';
import { FormattedMessage } from 'react-intl';

import type { HostedCollectiveFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { cn } from '../../../../lib/utils';

import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Badge } from '../../../ui/Badge';
import { Label } from '../../../ui/Label';

export interface HostedCollectivesDataTableMeta extends TableMeta<any> {
  openCollectiveDetails?: (c: HostedCollectiveFieldsFragment) => void;
}

const DEFAULT_LABEL_STYLE = 'rounded px-1 py-0.5 text-xs';

export const cols: Record<string, ColumnDef<any, any>> = {
  collective: {
    accessorKey: 'collective',
    header: () => <FormattedMessage defaultMessage="Account" id="TwyMau" />,
    cell: ({ row }) => {
      const account = row.original;
      return (
        <div className="flex items-center">
          <Avatar collective={account} className="mr-4" radius={48} />
          {account.isFrozen && (
            <Badge type="info" size="xs" className="mr-2">
              <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
            </Badge>
          )}
          <div className="flex flex-col items-start">
            <div className="flex items-center text-sm">{account.name}</div>
          </div>
        </div>
      );
    },
  },
  status: {
    accessorKey: 'status',
    header: () => '',
    cell: ({ row, table }) => {
      const { intl } = table.options.meta as {
        intl: IntlShape;
      };

      const account = row.original;
      return (
        <div className="flex items-center gap-2">
          <Label className={cn(DEFAULT_LABEL_STYLE, 'border border-slate-500 text-slate-500')}>
            {formatCollectiveType(intl, account.type)}
          </Label>
          <Label
            className={cn(
              DEFAULT_LABEL_STYLE,
              account.isActive ? 'bg-green-200 text-green-600' : 'bg-slate-200 text-slate-600',
            )}
          >
            {account.isActive ? (
              <FormattedMessage id="Subscriptions.Active" defaultMessage="Active" />
            ) : (
              <FormattedMessage id="Archived" defaultMessage="Archived" />
            )}
          </Label>
        </div>
      );
    },
  },
  raised: {
    accessorKey: 'raised',
    header: () => <FormattedMessage id="Raised" defaultMessage="Raised" />,
    cell: ({ row }) => {
      const account = row.original;
      const amount = account.stats.totalAmountReceived;
      return (
        <div className="font-medium text-foreground">
          <FormattedMoneyAmount
            amount={amount.valueInCents}
            currency={amount.currency}
            showCurrencyCode={false}
            amountStyles={{}}
          />
        </div>
      );
    },
  },
  spent: {
    accessorKey: 'spent',
    header: () => <FormattedMessage defaultMessage="Spent" id="111qQK" />,
    cell: ({ row }) => {
      const account = row.original;
      const amount = account.stats.totalAmountSpent;
      return (
        <div className="font-medium text-foreground">
          <FormattedMoneyAmount
            amount={amount.valueInCents}
            currency={amount.currency}
            showCurrencyCode={false}
            amountStyles={{}}
          />
        </div>
      );
    },
  },
  balance: {
    accessorKey: 'balance',
    header: () => <FormattedMessage id="Balance" defaultMessage="Balance" />,
    cell: ({ row }) => {
      const account = row.original;
      const balance = account.stats.balance;
      return (
        <div className="font-medium text-foreground">
          <FormattedMoneyAmount
            amount={balance.valueInCents}
            currency={balance.currency}
            showCurrencyCode={false}
            amountStyles={{}}
          />
        </div>
      );
    },
  },
};
