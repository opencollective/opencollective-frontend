import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { get, omit } from 'lodash';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedDate, FormattedMessage, FormattedTime, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import {
  type AccountHoverCardFieldsFragment,
  ExpenseStatus,
  ExpenseType,
  HostContext,
  type PaidDisbursementsQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
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
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { expenseTagFilter } from '../../filters/ExpenseTagsFilter';
import { Filterbar } from '../../filters/Filterbar';
import { HostContextFilter, hostContextFilter } from '../../filters/HostContextFilter';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';
import { makePushSubpath } from '../../utils';

import { useExpenseActions } from './actions';
import type { FilterMeta as CommonFilterMeta } from './filters';
import {
  ExpenseAccountingCategoryKinds,
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from './filters';
import { hostDashboardMetadataQuery, paidDisbursementsQuery } from './queries';
import { limit } from '@/lib/filters/schemas';
import { ExpenseAccountingCategoryPill } from '@/components/expenses/ExpenseAccountingCategoryPill';
import { isFeatureEnabled } from '@/lib/allowed-features';
import { buildSortFilter } from '../../filters/SortFilter';

enum PaidDisbursementsTab {
  ALL = 'ALL',
  INVOICES = 'INVOICES',
  REIMBURSEMENTS = 'REIMBURSEMENTS',
  GRANTS = 'GRANTS',
}
const sortFilter = buildSortFilter({
  fieldSchema: z.enum(['PAID_AT']),
  defaultValue: {
    field: 'PAID_AT',
    direction: 'DESC',
  },
});
const filterSchema = commonSchema.extend({
  account: z.string().optional(),
  status: z.literal(ExpenseStatus.PAID).default(ExpenseStatus.PAID),
  hostContext: hostContextFilter.schema,
  limit: limit.default(20),
  sort: sortFilter.schema,
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
  account: (value, key, allValues, meta) => {
    // If hostContext is INTERNAL, filter to host's own account
    if ((allValues as FilterValues).hostContext === HostContext.INTERNAL) {
      return { slug: (meta as FilterMeta).hostSlug };
    }
    // Otherwise, use the normal account filter
    return hostedAccountFilter.toVariables(value, key, allValues, meta);
  },
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...omit(commonFilters, 'status'),
  account: hostedAccountFilter.filter,
  tag: expenseTagFilter.filter,
  sort: sortFilter.filter,
};

const getExpenseColumns = intl => [
  {
    accessorKey: 'paidAt',
    meta: { className: 'max-w-32' },
    header: () => <FormattedMessage defaultMessage="Paid on" id="qlXxnX" />,
    cell: ({ cell, row }) => {
      const expense = row.original;
      const paidBy = expense.paidBy;
      return (
        <div>
          <DateTime dateStyle="medium" value={cell.getValue()} />
          <div className="flex items-center gap-1 overflow-hidden text-xs whitespace-nowrap text-muted-foreground">
            <FormattedTime timeStyle={'short'} value={cell.getValue()} />
            {paidBy && (
              <React.Fragment>
                <span>by</span>
                <LinkCollective
                  collective={paidBy}
                  withHoverCard
                  className="inline-flex items-center gap-1 overflow-hidden"
                >
                  <Avatar size={14} collective={paidBy} />
                </LinkCollective>
              </React.Fragment>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'type',
    header: () => <FormattedMessage defaultMessage="Type" id="+U6ozc" />,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="flex flex-col">
          <span>{i18nExpenseType(intl, expense.type)}</span>
          <span className="text-xs text-muted-foreground">#{expense.legacyId}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'description',
    meta: { className: 'max-w-64' },
    header: () => <FormattedMessage defaultMessage="Submitted details" id="QwFHnc"  />,
    cell: ({ row }) => {
      const expense = row.original;
      const submittedBy = expense.createdByAccount;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{expense.description}</span>
          <div className="flex items-center gap-1 overflow-hidden text-xs whitespace-nowrap text-muted-foreground">
            <DateTime dateStyle="medium" value={expense.createdAt} />
            <span>•</span>
            <LinkCollective
              collective={submittedBy}
              withHoverCard
              className="inline-flex items-center gap-1 overflow-hidden"
            >
              <Avatar size={14} collective={submittedBy} />
              <span className="truncate">{submittedBy.name}</span>
            </LinkCollective>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'accountingCategory',
    header: () => <FormattedMessage defaultMessage="Accounting category" id="AddFundsModal.accountingCategory" />,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <ExpenseAccountingCategoryPill
            expense={expense}
            host={expense.host}
            account={expense.account}
            canEdit={
              isFeatureEnabled(expense.host, 'CHART_OF_ACCOUNTS') &&
              get(expense, 'permissions.canEditAccountingCategory', false)
            }
            allowNone
            showCodeInSelect={true}
          />
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
    header: () => <FormattedMessage defaultMessage="Paid to" id="Expense.PaidTo" />,
    cell: ({ row }) => {
      const expense = row.original;
      const payee = expense.payee;
      return (
        <div className="max-w-fit">
          <LinkCollective collective={payee} withHoverCard className="group hover:no-underline">
            <div className="flex items-center gap-2">
              <Avatar size={24} collective={payee} />
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-medium group-hover:underline">{payee.name}</span>
                <span className="text-xs text-muted-foreground">{formatCollectiveType(intl, payee.type)}</span>
              </div>
            </div>
          </LinkCollective>
        </div>
      );
    },
  },

  // {
  //   accessorKey: 'comments',
  //   header: () => null,
  //   cell: ({ row }) => {
  //     const expense = row.original;
  //     const commentCount = expense.comments?.totalCount || 0;
  //     if (!commentCount) {
  //       return null;
  //     }
  //     return (
  //       <div className="flex items-center gap-1 text-muted-foreground">
  //         <MessageCircle className="h-4 w-4" />
  //         <span>{commentCount}</span>
  //       </div>
  //     );
  //   },
  //   meta: { className: 'w-16' },
  // },
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

export const PaidDisbursements = ({ accountSlug: hostSlug, subpath }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const { account } = useContext(DashboardContext);

  const { data: metaData } = useQuery(hostDashboardMetadataQuery, {
    variables: { hostSlug, withHoverCard: true },
  });

  const views: Views<FilterValues> = [
    {
      id: PaidDisbursementsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
    },
    {
      id: PaidDisbursementsTab.INVOICES,
      label: intl.formatMessage({ defaultMessage: 'Invoices', id: 'c0bGFo' }),
      filter: {
        type: ExpenseType.INVOICE,
      },
    },
    {
      id: PaidDisbursementsTab.REIMBURSEMENTS,
      label: intl.formatMessage({ defaultMessage: 'Reimbursements', id: 'wdu2yl' }),
      filter: {
        type: ExpenseType.RECEIPT,
      },
    },
    {
      id: PaidDisbursementsTab.GRANTS,
      label: intl.formatMessage({ defaultMessage: 'Grants', id: 'Csh2rX',  }),
      filter: {
        type: ExpenseType.GRANT,
      },
    },
  ];

  const meta: FilterMeta = {
    currency: metaData?.host?.currency,
    hostSlug: hostSlug,
    includeUncategorized: true,
    accountingCategoryKinds: ExpenseAccountingCategoryKinds,
  };

  const queryFilter = useQueryFilter({
    schema: filterSchema,
    toVariables,
    filters,
    meta,
    views,
    skipFiltersOnReset: ['hostContext'],
  });

  const variables = {
    hostSlug,
    ...queryFilter.variables,
  };

  const expenses = useQuery(paidDisbursementsQuery, {
    variables,
  });

  const getExpenseActions = useExpenseActions({
    refetchList: expenses.refetch,
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
      <DashboardHeader
        title={
          <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
            <FormattedMessage defaultMessage="Paid Disbursements" id="rwMrEx" />
            {account.hasHosting && (
              <HostContextFilter
                value={queryFilter.values.hostContext}
                onChange={val => queryFilter.setFilter('hostContext', val)}
                intl={intl}
              />
            )}
          </div>
        }
      />

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
