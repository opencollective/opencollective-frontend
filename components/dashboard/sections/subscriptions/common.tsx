import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { groupBy, mapValues, pick, toPairs } from 'lodash';
import { ArrowUpRight } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { defineMessage, FormattedDate, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { getCollectivePageCanonicalURL } from '../../../../lib/url-helpers';
import { CollectiveType } from '@/lib/constants/collectives';

import Link from '@/components/Link';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Badge } from '../../../ui/Badge';
import { TableActionsButton } from '../../../ui/Table';
import { buildAccountTypeFilter } from '../../filters/AccountTypeFilter';
import { buildSortFilter } from '../../filters/SortFilter';

export const cols: Record<string, ColumnDef<any, any>> = {
  collective: {
    accessorKey: 'collective',
    header: () => <FormattedMessage id="Collective" defaultMessage="Collective" />,
    cell: ({ row, table }) => {
      const { intl } = table.options.meta as {
        intl: IntlShape;
      };
      const collective = row.original;
      const children = mapValues(groupBy(collective.childrenAccounts?.nodes, 'type'), 'length');
      const isChild = collective.parent;
      const secondLine = isChild ? (
        <FormattedMessage
          defaultMessage="{childAccountType} by {parentAccount}"
          id="9f14iS"
          values={{
            childAccountType: (
              <Badge size="xs" type="outline">
                {formatCollectiveType(intl, collective.type)}
              </Badge>
            ),
            parentAccount: collective.parent.name,
          }}
        />
      ) : (
        toPairs(children)
          .map(([type, count]) => count && `${count} ${formatCollectiveType(intl, type, count)}`)
          .join(', ')
      );
      return (
        <div className="flex items-center gap-2">
          <Link href={getCollectivePageCanonicalURL(collective)} passHref>
            <Avatar collective={collective} radius={48} />
          </Link>
          <div className="flex flex-col items-start">
            <Link href={getCollectivePageCanonicalURL(collective)} passHref>
              {collective.name}
            </Link>
            <div className="text-xs">{secondLine}</div>
          </div>
        </div>
      );
    },
  },
  team: {
    accessorKey: 'team',
    header: () => <FormattedMessage id="Team" defaultMessage="Team" />,
    cell: ({ row }) => {
      const DISPLAYED_TEAM_MEMBERS = 3;
      const account = row.original;
      const admins = account.members?.nodes || [];
      const displayed = admins.length > DISPLAYED_TEAM_MEMBERS ? admins.slice(0, DISPLAYED_TEAM_MEMBERS - 1) : admins;
      const left = admins.length - displayed.length;
      return (
        <div className="flex gap-[-4px]">
          {displayed.map(admin => (
            <AccountHoverCard
              key={admin.id}
              account={admin.account}
              includeAdminMembership={{ accountSlug: account.slug }}
              trigger={
                <div className="ml-[-8px] flex items-center first:ml-0">
                  <Avatar collective={admin.account} radius={24} displayTitle={false} />
                </div>
              }
            />
          ))}
          {left ? (
            <div className="ml-[-8px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-400 first:ml-0">
              +{left}
            </div>
          ) : null}
        </div>
      );
    },
  },
  moneyManaged: {
    accessorKey: 'managedAmount',
    header: () => <FormattedMessage id="MoneyManaged" defaultMessage="Money Managed" />,
    cell: ({ row }) => {
      const account = row.original;
      const amount = account.stats?.managedAmount;
      if (amount) {
        return (
          <div className="font-medium text-foreground">
            <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} showCurrencyCode={true} />
          </div>
        );
      }
    },
  },
  legacyPlan: {
    accessorKey: 'legacyPlan',
    header: () => <FormattedMessage id="SubscriptionPlan" defaultMessage="Subscription Plan" />,
    cell: ({ row }) => {
      const account = row.original;
      return account.legacyPlan ? (
        <div className="text-sm font-medium text-foreground">{account.legacyPlan.name}</div>
      ) : (
        <FormattedMessage id="NoPlan" defaultMessage="No plan" />
      );
    },
  },
  createdAt: {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage id="CreatedAt" defaultMessage="Created At" />,
    cell: ({ row }) => {
      const account = row.original;
      return account.createdAt ? (
        <div className="whitespace-nowrap">
          <FormattedDate value={account.createdAt} day="numeric" month="long" year="numeric" />
        </div>
      ) : null;
    },
  },
  actions: {
    accessorKey: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const collective = row.original;
      const { onClickUpgrade } = table.options.meta as any;
      return (
        // Stop propagation since the row is clickable
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="flex flex-1 items-center justify-end" onClick={e => e.stopPropagation()}>
          <TableActionsButton
            title="Upgrade Subscription"
            className="h-8 w-8"
            onClick={() => onClickUpgrade(collective)}
          >
            <ArrowUpRight size={20} />
          </TableActionsButton>
        </div>
      );
    },
  },
};

export const sortFilter = buildSortFilter({
  fieldSchema: z.enum(['MONEY_MANAGED', 'CREATED_AT', 'NAME']),
  defaultValue: {
    field: 'MONEY_MANAGED',
    direction: 'DESC',
  },
  i18nCustomLabels: {
    CREATED_AT: defineMessage({
      defaultMessage: 'Created',
      id: 'created',
    }),
    MONEY_MANAGED: defineMessage({
      defaultMessage: 'Money Managed',
      id: 'moneyManaged',
    }),
  },
});

export const typeFilter = buildAccountTypeFilter({
  types: pick(CollectiveType, ['ORGANIZATION', 'INDIVIDUAL', 'COLLECTIVE', 'FUND']),
  optional: true,
  defaultValue: [CollectiveType.ORGANIZATION],
});
