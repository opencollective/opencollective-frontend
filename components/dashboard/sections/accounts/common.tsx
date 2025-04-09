import React from 'react';
import type { ColumnDef, TableMeta } from '@tanstack/react-table';
import type { IntlShape } from 'react-intl';
import { FormattedMessage } from 'react-intl';

import type { HostedCollectiveFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';

import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Badge } from '../../../ui/Badge';
import formatAccountType from '@/lib/i18n/account-type';

export interface HostedCollectivesDataTableMeta extends TableMeta<any> {
  openCollectiveDetails?: (c: HostedCollectiveFieldsFragment) => void;
}

export const cols: Record<string, ColumnDef<any, any>> = {
  collective: {
    accessorKey: 'collective',
    header: () => <FormattedMessage defaultMessage="Account" id="TwyMau" />,
    cell: ({ row, table }) => {
      const { intl } = table.options.meta as {
        intl: IntlShape;
      };
      const account = row.original;
      return (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar collective={account} className="" radius={32} />
            <p className="truncate text-sm text-foreground">{account.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge type="outline" size="sm">
              {formatAccountType(intl, account.type)}
            </Badge>
            {account.isFrozen && (
              <Badge type="info" size="sm" className="">
                <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
              </Badge>
            )}
            {!account.isActive && (
              <Badge size="sm">
                <FormattedMessage id="Archived" defaultMessage="Archived" />
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  balance: {
    meta: {
      align: 'right',
    },
    accessorKey: 'balance',
    header: () => <FormattedMessage id="Balance" defaultMessage="Balance" />,
    cell: ({ row }) => {
      const account = row.original;
      const balance = account.stats.balance;
      return (
        <div className="font-medium text-foreground">
          <FormattedMoneyAmount amount={balance.valueInCents} currency={balance.currency} showCurrencyCode={false} />
        </div>
      );
    },
  },
};
