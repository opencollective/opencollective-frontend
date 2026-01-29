import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, FormattedTime, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import {
  type AccountHoverCardFieldsFragment,
  HostContext,
  type HostDashboardExpensesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { ExpenseStatusFilter, ExpenseType } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import i18nPayoutMethodType from '../../../../lib/i18n/payout-method-type';
import { isFeatureEnabled } from '@/lib/allowed-features';
import { useDrawer } from '@/lib/hooks/useDrawer';
import { i18nExpenseStatus, i18nExpenseType } from '@/lib/i18n/expense';
import { sortSelectOptions } from '@/lib/utils';

import { ExpenseAccountingCategoryPill } from '@/components/expenses/ExpenseAccountingCategoryPill';

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
import ComboSelectFilter from '../../filters/ComboSelectFilter';
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
import { hostDashboardExpensesQuery, hostPaymentRequestsMetadataQuery } from './queries';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import { limit } from '@/lib/filters/schemas';

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

const getExpenseColumns = intl => [
  {
    accessorKey: 'createdAt',
    meta: { className: 'max-w-32' },
    header: () => <FormattedMessage defaultMessage="Date" id="Expense.Date" />,
    cell: ({ cell }) => {
      const createdAt = cell.getValue();
      return <DateTime dateStyle="medium" value={createdAt} />;
    },
  },

  {
    accessorKey: 'account',
    meta: { className: 'max-w-48' },
    header: () => <FormattedMessage defaultMessage="Account" id="TwyMau" />,
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
    header: () => <FormattedMessage defaultMessage="Title" id="Title" />,
    cell: ({ row }) => {
      const expense = row.original;
      return <span className="truncate font-medium">{expense.description}</span>;
    },
  },
  {
    accessorKey: 'accountingCategory',
    header: () => <FormattedMessage defaultMessage="Accounting category" id="AddFundsModal.accountingCategory" />,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div onClick={e => e.stopPropagation()}>
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
    accessorKey: 'payee',
    meta: { className: 'max-w-48' },
    header: () => <FormattedMessage defaultMessage="Payee" id="hiZQdK" />,
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
  {
    accessorKey: 'status',
    // meta: { className: 'min-w-32 ' },
    header: () => <FormattedMessage defaultMessage="Status" id="tzMNF3" />,
    cell: ({ cell }) => {
      const status = cell.getValue();
      return <ExpenseStatusTag status={status} />;
    },
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

const HostPaymentRequests = ({ accountSlug: hostSlug, subpath }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const { account } = useContext(DashboardContext);

  const views: Views<FilterValues> = [
    {
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
      id: 'all',
    },
    {
      label: intl.formatMessage({ id: 'expense.pending', defaultMessage: 'Pending' }),
      filter: { status: [ExpenseStatusFilter.PENDING], sort: { field: 'CREATED_AT', direction: 'ASC' } },
      id: 'pending',
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Paid', id: 'u/vOPu' }),
      filter: { status: [ExpenseStatusFilter.PAID], sort: { field: 'CREATED_AT', direction: 'DESC' } },
      id: 'paid',
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Rejected', id: '5qaD7s' }),
      filter: { status: [ExpenseStatusFilter.REJECTED], sort: { field: 'CREATED_AT', direction: 'ASC' } },
      id: 'rejected',
    },
  ];

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
    views,
    skipFiltersOnReset: ['hostContext'],
  });

  const { data: metaData, refetch: refetchMetaData } = useQuery(hostPaymentRequestsMetadataQuery, {
    variables: {
      hostSlug,
      hostContext: account.hasHosting ? queryFilter.values.hostContext : undefined,
    },
  });

  const viewsWithCount: Views<FilterValues> = views.map(view => ({
    ...view,
    count: metaData?.[view.id]?.totalCount,
  }));

  const variables = {
    hostSlug,
    ...queryFilter.variables,
    fetchGrantHistory: false,
  };

  const expenses = useQuery(hostDashboardExpensesQuery, {
    variables,
  });

  const getExpenseActions = useExpenseActions({
    refetchList: () => {
      expenses.refetch();
      refetchMetaData();
    },
  });

  const pushSubpath = makePushSubpath(router);
  const openExpenseId = subpath?.[0];

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

      <Filterbar {...queryFilter} views={viewsWithCount} />

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
            data={data?.expenses?.nodes ?? []}
            columns={getExpenseColumns(intl)}
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
