import React, { useContext, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { get } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import type {
  Account,
  AccountHoverCardFieldsFragment,
  Expense,
  Host,
  HostDashboardExpensesQuery,
  HostDashboardExpensesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import i18nPayoutMethodType from '../../../../lib/i18n/payout-method-type';
import { isFeatureEnabled } from '@/lib/allowed-features';
import { limit } from '@/lib/filters/schemas';
import { useDrawer } from '@/lib/hooks/useDrawer';
import { i18nExpenseType } from '@/lib/i18n/expense';

import { ExpenseAccountingCategoryPill } from '@/components/expenses/ExpenseAccountingCategoryPill';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import ExpenseDrawer from '../../../expenses/ExpenseDrawer';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { ColumnHeader } from '../../../table/ColumnHeader';
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
import { hostDashboardExpensesQuery } from './queries';

type HostExpensesQueryNode = NonNullable<HostDashboardExpensesQuery['expenses']['nodes']>[number];

const columnHelper = createColumnHelper<HostExpensesQueryNode>();

function getExpenseColumns(
  intl: IntlShape,
  host: HostDashboardExpensesQuery['host'],
): ColumnDef<HostExpensesQueryNode, unknown>[] {
  return [
    columnHelper.accessor('createdAt', {
      meta: { className: 'max-w-32', labelMsg: defineMessage({ defaultMessage: 'Date', id: 'expense.incurredAt' }) },
      header: ctx => <ColumnHeader {...ctx} filterKey="date" />,
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        return <DateTime className="whitespace-nowrap" dateStyle="medium" value={createdAt} />;
      },
    }),
    columnHelper.accessor('account', {
      meta: {
        className: 'max-w-10 xl:max-w-48',
        labelMsg: defineMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
      },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        const account = expense.account;
        return (
          <div className="max-w-fit">
            <LinkCollective
              collective={account}
              withHoverCard
              className="flex items-center gap-2 hover:no-underline"
              onClick={e => e.preventDefault()}
            >
              <Avatar size={24} collective={account} />
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-medium">{account.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatCollectiveType(intl, account.type)}
                </span>
              </div>
            </LinkCollective>
          </div>
        );
      },
    }),
    columnHelper.accessor('type', {
      meta: { className: 'max-w-24', labelMsg: defineMessage({ defaultMessage: 'Type', id: '+U6ozc' }) },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        return (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate">{i18nExpenseType(intl, expense.type)}</span>
            <span className="text-xs text-muted-foreground">#{expense.legacyId}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('description', {
      meta: { className: 'max-w-64 flex-1', labelMsg: defineMessage({ defaultMessage: 'Title', id: 'Title' }) },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        const submittedBy = expense.createdByAccount;
        return (
          <div className="flex flex-col">
            <span className="truncate font-medium">{expense.description}</span>
            <div className="flex items-center gap-1 overflow-hidden text-xs whitespace-nowrap text-muted-foreground">
              <FormattedMessage
                defaultMessage="Submitted by {submittedByAccount}"
                id="HJQNkj"
                values={{
                  date: <DateTime dateStyle="medium" value={expense.createdAt} />,
                  submittedByAccount: (
                    <LinkCollective
                      collective={submittedBy}
                      withHoverCard
                      className=""
                      onClick={e => e.preventDefault()}
                    >
                      <Avatar size={14} collective={submittedBy} />
                    </LinkCollective>
                  ),
                }}
              />
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('accountingCategory', {
      meta: {
        className: 'hidden lg:table-cell max-w-32',
        labelMsg: defineMessage({ defaultMessage: 'Accounting category', id: 'AddFundsModal.accountingCategory' }),
      },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        return (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div onClick={e => e.stopPropagation()} className="overflow-hidden">
            <ExpenseAccountingCategoryPill
              expense={expense as Expense}
              host={host as unknown as Host}
              account={expense.account as Account}
              canEdit={
                host !== undefined &&
                host !== null &&
                isFeatureEnabled(host, 'CHART_OF_ACCOUNTS') &&
                get(expense, 'permissions.canEditAccountingCategory', false)
              }
              allowNone
              showCodeInSelect={true}
            />
          </div>
        );
      },
    }),
    columnHelper.accessor('payee', {
      meta: {
        className: 'hidden lg:table-cell max-w-48',
        labelMsg: defineMessage({ defaultMessage: 'Payee', id: 'SecurityScope.Payee' }),
      },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        const payee = expense.payee;
        return (
          <div className="max-w-fit">
            <LinkCollective
              collective={payee}
              withHoverCard
              className="hover:no-underline"
              onClick={e => e.preventDefault()}
            >
              <div className="flex items-center gap-2">
                <Avatar size={24} collective={payee} />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium">{payee.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {intl ? formatCollectiveType(intl, payee.type) : payee.type}
                  </span>
                </div>
              </div>
            </LinkCollective>
          </div>
        );
      },
    }),
    columnHelper.accessor('status', {
      meta: { className: 'max-w-32', labelMsg: defineMessage({ defaultMessage: 'Status', id: 'tzMNF3' }) },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const status = cell.getValue();
        return (
          <div>
            <ExpenseStatusTag status={status} />
          </div>
        );
      },
    }),
    columnHelper.accessor('amount', {
      meta: {
        className: 'min-w-32 text-right',
        labelMsg: defineMessage({ defaultMessage: 'Amount', id: 'Fields.amount' }),
        align: 'right',
      },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              <FormattedMoneyAmount amount={Math.abs(expense.amount)} currency={expense.currency} />
            </span>
            <span className="text-xs text-muted-foreground">
              {intl
                ? i18nPayoutMethodType(intl, expense.payoutMethod?.type, {
                    aliasBankAccountToTransferWise: true,
                  })
                : expense.payoutMethod?.type}
            </span>
          </div>
        );
      },
    }),
    actionsColumn,
  ];
}

const filterSchema = commonSchema.extend({
  account: z.string().optional(),
  hostContext: hostContextFilter.schema,
  limit: limit.default(20),
});

type FilterValues = z.infer<typeof filterSchema>;

type FilterMeta = CommonFilterMeta & {
  hostSlug: string;
  hostedAccounts?: Array<AccountHoverCardFieldsFragment>;
  expenseTags?: string[];
  includeUncategorized?: boolean;
  hideExpensesMetaStatuses: boolean;
};

const toVariables: FiltersToVariables<FilterValues, HostDashboardExpensesQueryVariables, FilterMeta> = {
  ...commonToVariables,
  account: hostedAccountFilter.toVariables,
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...commonFilters,
  account: hostedAccountFilter.filter,
  tag: expenseTagFilter.filter,
};

const HostPaymentRequests = ({ accountSlug: hostSlug, subpath }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const { account } = useContext(DashboardContext);

  const queryFilter = useQueryFilter({
    schema: filterSchema,
    toVariables,
    filters,
    meta: {
      currency: account.currency,
      hostSlug,
      includeUncategorized: true,
      accountingCategoryKinds: ExpenseAccountingCategoryKinds,
      hideExpensesMetaStatuses: true,
    },
    skipFiltersOnReset: ['hostContext'],
  });

  const variables = {
    hostSlug,
    ...queryFilter.variables,
    fetchGrantHistory: false,
  };

  const { data, error, loading, refetch } = useQuery(hostDashboardExpensesQuery, {
    variables,
  });

  const getExpenseActions = useExpenseActions({
    refetchList: () => {
      refetch();
    },
    host: data?.host,
  });

  const pushSubpath = makePushSubpath(router);
  const openExpenseId = subpath?.[0];

  const { openDrawer, drawerProps } = useDrawer({
    open: Boolean(openExpenseId),
    onOpen: id => pushSubpath(id),
    onClose: () => pushSubpath(undefined),
  });

  const expenseColumns = useMemo(() => getExpenseColumns(intl, data?.host), [data?.host, intl]);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={
          <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
            <FormattedMessage defaultMessage="All Payment Requests" id="HostPaymentRequests" />
            {account.hasHosting && (
              <HostContextFilter
                value={queryFilter.values.hostContext}
                onChange={val => queryFilter.setFilter('hostContext', val)}
                intl={intl}
              />
            )}
          </div>
        }
        description={
          <FormattedMessage
            defaultMessage="All payment requests across your hosted Collectives."
            id="HostPaymentRequestsDescription"
          />
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
            mobileTableView
            data={data?.expenses?.nodes ?? []}
            columns={expenseColumns}
            onClickRow={(row, menuRef) => openDrawer(row.id, menuRef)}
            getRowId={row => String(row.legacyId)}
            queryFilter={queryFilter}
            loading={loading}
            getActions={getExpenseActions}
            nbPlaceholders={queryFilter.values.limit}
          />
          <Pagination queryFilter={queryFilter} total={data?.expenses?.totalCount} />
        </React.Fragment>
      )}
      <ExpenseDrawer openExpenseLegacyId={Number(openExpenseId)} handleClose={drawerProps.onClose} />
    </div>
  );
};

export default HostPaymentRequests;
