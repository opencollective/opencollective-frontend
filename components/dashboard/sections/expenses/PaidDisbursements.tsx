import React from 'react';
import { useQuery } from '@apollo/client';
import { omit } from 'lodash';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import {
  type AccountHoverCardFieldsFragment,
  ExpenseStatus,
  type PaidDisbursementsQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import formatAccountType from '../../../../lib/i18n/account-type';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { i18nExpenseType } from '../../../../lib/i18n/expense';
import i18nPayoutMethodType from '../../../../lib/i18n/payout-method-type';
import { useDrawer } from '@/lib/hooks/useDrawer';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import ExpenseDrawer from '../../../expenses/ExpenseDrawer';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { expenseTagFilter } from '../../filters/ExpenseTagsFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';
import { makePushSubpath } from '../../utils';

import type { FilterMeta as CommonFilterMeta } from './filters';
import {
  ExpenseAccountingCategoryKinds,
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from './filters';
import { hostDashboardMetadataQuery, paidDisbursementsQuery } from './queries';

const filterSchema = commonSchema.extend({
  account: z.string().optional(),
  status: z.literal(ExpenseStatus.PAID).default(ExpenseStatus.PAID),
});

type FilterValues = z.infer<typeof filterSchema>;

type FilterMeta = CommonFilterMeta & {
  hostSlug: string;
  hostedAccounts?: Array<AccountHoverCardFieldsFragment>;
  expenseTags?: string[];
  includeUncategorized?: boolean;
};

const toVariables: FiltersToVariables<FilterValues, PaidDisbursementsQueryVariables, FilterMeta> = {
  ...(omit(commonToVariables, 'status') as unknown as Partial<
    FiltersToVariables<FilterValues, PaidDisbursementsQueryVariables, FilterMeta>
  >),
  limit: (value, key) => ({ [key]: value * 2 }), // Times two for the lazy pagination
  account: hostedAccountFilter.toVariables,
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...omit(commonFilters, 'status'),
  account: hostedAccountFilter.filter,
  tag: expenseTagFilter.filter,
};

const getExpenseColumns = intl => [
  {
    accessorKey: 'createdAt',
    meta: { className: 'min-w-30' },
    header: () => <FormattedMessage defaultMessage="Date" id="P7PLVj" />,
    cell: ({ cell }) => {
      return <DateTime dateStyle="medium" value={cell.getValue()} />;
    },
  },

  {
    accessorKey: 'type',
    header: () => <FormattedMessage defaultMessage="Accounting" id="uxUU0P" />,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="flex flex-col">
          <span>
            {i18nExpenseType(intl, expense.type)} #{expense.legacyId}
          </span>
          <span className="text-xs text-muted-foreground">{expense.accountingCategory?.name || '—'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'account',
    meta: { className: 'max-w-48' },
    header: () => <FormattedMessage defaultMessage="Paid from" id="Kz1xPl" />,
    cell: ({ row }) => {
      const expense = row.original;
      const account = expense.account;
      return (
        <div className="max-w-fit">
          <LinkCollective
            collective={account}
            withHoverCard
            className="group flex items-center gap-2 hover:no-underline"
          >
            <Avatar size={24} collective={account} />
            <div className="flex flex-col overflow-hidden">
              <span className="truncate font-medium group-hover:underline">{account.name}</span>
              <span className="text-xs text-muted-foreground">{formatCollectiveType(intl, account.type)}</span>
            </div>
          </LinkCollective>
        </div>
      );
    },
  },
  {
    accessorKey: 'payee',
    meta: { className: 'max-w-48' },
    header: () => <FormattedMessage defaultMessage="Paid to" id="wfH1yB" />,
    cell: ({ row }) => {
      const expense = row.original;
      const payee = expense.payee;
      return (
        <div className="max-w-fit">
          <LinkCollective collective={payee} withHoverCard className="group flex items-center gap-2 hover:no-underline">
            <Avatar size={24} collective={payee} />
            <div className="flex flex-col overflow-hidden">
              <span className="truncate font-medium group-hover:underline">{payee.name}</span>
              <span className="text-xs text-muted-foreground">{formatCollectiveType(intl, payee.type)}</span>
            </div>
          </LinkCollective>
        </div>
      );
    },
  },
  {
    accessorKey: 'paidBy',
    meta: { className: 'max-w-48' },
    header: () => <FormattedMessage defaultMessage="Paid by" id="l0K8BV" />,
    cell: ({ row }) => {
      const expense = row.original;
      const paidBy = expense.paidBy;
      if (!paidBy) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="max-w-fit">
          <LinkCollective collective={paidBy} withHoverCard className="flex items-center gap-2 font-medium">
            <Avatar size={24} collective={paidBy} />
            <span className="truncate">{paidBy.name}</span>
          </LinkCollective>
        </div>
      );
    },
  },
  {
    accessorKey: 'comments',
    header: () => null,
    cell: ({ row }) => {
      const expense = row.original;
      const commentCount = expense.comments?.totalCount || 0;
      if (!commentCount) {
        return null;
      }
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </div>
      );
    },
    meta: { className: 'w-16' },
  },
  {
    accessorKey: 'amount',
    meta: { className: 'min-w-32 text-right' },
    header: () => <FormattedMessage id="Fields.amount" defaultMessage="Amount" />,
    cell: ({ row }) => {
      const expense = row.original;
      const amount = expense.amountInHostCurrency || { valueInCents: expense.amount, currency: expense.currency };
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            <FormattedMoneyAmount amount={Math.abs(amount.valueInCents)} currency={amount.currency} />
          </span>
          <span className="text-xs text-muted-foreground">
            {i18nPayoutMethodType(intl, expense.payoutMethod?.type, { aliasBankAccountToTransferWise: true })}
          </span>
        </div>
      );
    },
  },
  actionsColumn,
];

const getExpenseActions = () => ({ primary: [] });

export const PaidDisbursements = ({ accountSlug: hostSlug, subpath }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();

  const { data: metaData } = useQuery(hostDashboardMetadataQuery, {
    variables: { hostSlug, withHoverCard: true },
  });

  const meta: FilterMeta = {
    currency: metaData?.host?.currency,
    hostSlug: hostSlug,
    hostedAccounts: metaData?.hostedAccounts.nodes,
    expenseTags: metaData?.expenseTags.nodes?.map(t => t.tag),
    includeUncategorized: true,
    accountingCategoryKinds: ExpenseAccountingCategoryKinds,
  };

  const queryFilter = useQueryFilter({
    schema: filterSchema,
    toVariables,
    filters,
    meta,
  });

  const variables = {
    hostSlug,
    ...queryFilter.variables,
  };

  const expenses = useQuery(paidDisbursementsQuery, {
    variables,
  });
  const pushSubpath = makePushSubpath(router);
  const openExpenseId = subpath[0];

  const { openDrawer, drawerProps } = useDrawer({
    open: Boolean(openExpenseId),
    onOpen: id => pushSubpath(id),
    onClose: () => pushSubpath(undefined),
  });

  const { data, error, loading } = expenses;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader title={<FormattedMessage defaultMessage="Paid Disbursements" id="rwMrEx" />} />

      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !data.expenses?.nodes.length ? (
        <EmptyResults
          entityType="EXPENSES"
          onResetFilters={() => queryFilter.resetFilters({})}
          hasFilters={queryFilter.hasFilters}
        />
      ) : (
        <React.Fragment>
          <DataTable
            data={data?.expenses.nodes || []}
            columns={getExpenseColumns(intl)}
            onClickRow={(row, menuRef) => openDrawer(row.id, menuRef)}
            getRowId={row => String(row.legacyId)}
            queryFilter={queryFilter}
            loading={loading}
            getActions={getExpenseActions}
          />
          <ExpenseDrawer openExpenseLegacyId={Number(openExpenseId)} handleClose={drawerProps.onClose} />
          <Pagination queryFilter={queryFilter} total={data?.expenses?.totalCount} />
        </React.Fragment>
      )}
    </div>
  );
};
