import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { groupBy, mapValues, pick, toPairs } from 'lodash';
import { Pencil } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { defineMessage, FormattedDate, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { integer } from '../../../../lib/filters/schemas';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { CollectiveType } from '@/lib/constants/collectives';
import type { SubscriberFieldsFragment, SubscribersQueryVariables } from '@/lib/graphql/types/v2/graphql';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { TableActionsButton } from '../../../ui/Table';
import { accountTrustLevelFilter } from '../../filters/AccountTrustLevelFilter';
import { buildAccountTypeFilter } from '../../filters/AccountTypeFilter';
import { dateFilter } from '../../filters/DateFilter';
import { dateToVariables } from '../../filters/DateFilter/schema';
import { searchFilter } from '../../filters/SearchFilter';
import { buildSortFilter } from '../../filters/SortFilter';

export const cols = {
  collective: {
    accessorKey: 'collective',
    header: () => <FormattedMessage id="Collective" defaultMessage="Collective" />,
    cell: ({ row, table }) => {
      const { intl } = table.options.meta as {
        intl: IntlShape;
      };
      const collective = row.original;
      const children = mapValues(groupBy(collective.childrenAccounts?.nodes, 'type'), 'length');
      const secondLine = toPairs(children)
        .map(([type, count]) => count && `${count} ${formatCollectiveType(intl, type, count)}`)
        .join(', ');
      return (
        <div className="flex items-center gap-2">
          <Avatar collective={collective} radius={48} />
          <div className="flex flex-col items-start">
            {collective.name}
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
  plan: {
    accessorKey: 'plan',
    header: () => <FormattedMessage id="SubscriptionPlan" defaultMessage="Subscription Plan" />,
    cell: ({ row }) => {
      const account = row.original;
      if ('platformSubscription' in account && account.platformSubscription.plan) {
        const plan = account.platformSubscription.plan;
        const startDate = account.platformSubscription.startDate;
        return (
          <div>
            <div className="text-sm font-medium text-foreground">{plan.title}</div>
            {startDate && (
              <div className="text-xs text-muted-foreground">Since {dayjs.utc(startDate).format('MMM D, YYYY')}</div>
            )}
          </div>
        );
      } else {
        return <FormattedMessage id="NoPlan" defaultMessage="No plan" />;
      }
    },
  },
  legacyPlan: {
    accessorKey: 'legacyPlan',
    header: () => <FormattedMessage id="SubscriptionPlan" defaultMessage="Subscription Plan" />,
    cell: ({ row }) => {
      const account = row.original;
      return 'legacyPlan' in account ? (
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
  lastTransactionAt: {
    accessorKey: 'lastTransactionAt',
    header: () => <FormattedMessage id="lastTransaction" defaultMessage="Last Transaction" />,
    cell: ({ row }) => {
      const account = row.original;
      const lastTransaction = account.transactions?.nodes?.[0];
      return lastTransaction ? (
        <div className="whitespace-nowrap">
          <FormattedDate value={lastTransaction.createdAt} day="numeric" month="long" year="numeric" />
        </div>
      ) : null;
    },
  },

  actions: {
    accessorKey: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const collective = row.original;
      const { onClickEdit } = table.options.meta as any;
      return (
        // Stop propagation since the row is clickable
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="flex flex-1 items-center justify-end" onClick={e => e.stopPropagation()}>
          <TableActionsButton className="h-8 w-8" onClick={() => onClickEdit(collective)}>
            <Pencil size={16} />
          </TableActionsButton>
        </div>
      );
    },
  },
} as Record<string, ColumnDef<SubscriberFieldsFragment>>;

const sortFilter = buildSortFilter({
  fieldSchema: z.enum(['MONEY_MANAGED', 'LAST_TRANSACTION_CREATED_AT', 'CREATED_AT', 'NAME']),
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
    LAST_TRANSACTION_CREATED_AT: defineMessage({
      defaultMessage: 'Last Transaction',
      id: 'lastTransaction',
    }),
  },
});

const typeFilter = buildAccountTypeFilter({
  types: pick(CollectiveType, ['ORGANIZATION', 'INDIVIDUAL', 'COLLECTIVE', 'FUND']),
  optional: true,
  defaultValue: [CollectiveType.ORGANIZATION],
});

const lastTransactionDateFilter = {
  ...dateFilter,
  toVariables: value => dateToVariables(value, 'lastTransaction'),
  filter: {
    ...dateFilter.filter,
    labelMsg: defineMessage({ id: 'lastTransaction', defaultMessage: 'Last Transaction' }),
  },
};

const COLLECTIVES_PER_PAGE = 20;

export const schema = z.object({
  limit: integer.default(COLLECTIVES_PER_PAGE),
  offset: integer.default(0),
  searchTerm: searchFilter.schema,
  sort: sortFilter.schema,
  type: typeFilter.schema,
  trustLevel: accountTrustLevelFilter.schema,
  lastTransactionDateFilter: lastTransactionDateFilter.schema,
});

export const toVariables: FiltersToVariables<z.infer<typeof schema>, SubscribersQueryVariables> = {
  trustLevel: accountTrustLevelFilter.toVariables,
  lastTransactionDateFilter: lastTransactionDateFilter.toVariables,
};

export const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  sort: sortFilter.filter,
  searchTerm: searchFilter.filter,
  type: typeFilter.filter,
  trustLevel: accountTrustLevelFilter.filter,
  lastTransactionDateFilter: lastTransactionDateFilter.filter,
};

export const AVAILABLE_FEATURES = [
  'TRANSFERWISE',
  'PAYPAL_PAYOUTS',
  'RECEIVE_HOST_APPLICATIONS',
  'CHART_OF_ACCOUNTS',
  'EXPENSE_SECURITY_CHECKS',
  'EXPECTED_FUNDS',
  'CHARGE_HOSTING_FEES',
  'AGREEMENTS',
  'TAX_FORMS',
  'OFF_PLATFORM_TRANSACTIONS',
  'FUNDS_GRANTS_MANAGEMENT',
  'VENDORS',
  'USE_EXPENSES',
  'UPDATES',
  'RECEIVE_FINANCIAL_CONTRIBUTIONS',
  'RECEIVE_EXPENSES',
  'ACCOUNT_MANAGEMENT',
] as const;
