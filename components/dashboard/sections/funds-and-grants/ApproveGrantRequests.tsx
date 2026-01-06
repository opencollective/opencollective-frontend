import React from 'react';
import { useQuery } from '@apollo/client';
import { compact, get, omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { type ExpensesPageQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import type { Account, Expense } from '../../../../lib/graphql/types/v2/schema';
import { ExpenseStatusFilter, ExpenseType } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import { DataTable } from '@/components/table/DataTable';

import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { expenseTagFilter } from '../../filters/ExpenseTagsFilter';
import { Filterbar } from '../../filters/Filterbar';
import { AccountRenderer } from '../../filters/HostedAccountFilter';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';
import type { FilterMeta as CommonFilterMeta } from '../expenses/filters';
import {
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from '../expenses/filters';
import { accountExpensesMetadataQuery, accountExpensesQuery } from '../expenses/queries';

import type { GrantsTableMeta } from './common';
import { grantColumns } from './common';

const schema = commonSchema
  .extend({
    account: z.string().nullable().default(null),
  })
  .omit({ type: true, status: true });

const schemaWithoutHost = schema.omit({ accountingCategory: true });

type FilterValues = z.infer<typeof schema>;

type FilterMeta = CommonFilterMeta & {
  accountSlug: string;
  childrenAccounts?: Array<Account>;
  expenseTags?: string[];
  hostSlug?: string;
  includeUncategorized: boolean;
};
const toVariables: FiltersToVariables<FilterValues, ExpensesPageQueryVariables, FilterMeta> = {
  ...commonToVariables,
  account: (slug, key, meta) => {
    if (!slug) {
      return { includeChildrenExpenses: true };
    } else if (meta.childrenAccounts && !meta.childrenAccounts.find(a => a.slug === slug)) {
      return { limit: 0 };
    } else {
      return { account: { slug } };
    }
  },
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...omit(commonFilters, ['type', 'status', 'chargeHasReceipts']),
  tag: expenseTagFilter.filter,
  account: {
    labelMsg: defineMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    Component: ({ meta, ...props }) => {
      return (
        <ComboSelectFilter
          options={meta.childrenAccounts.map(account => ({
            value: account.slug,
            label: <AccountRenderer account={account} inOptionsList />,
          }))}
          {...props}
        />
      );
    },
    valueRenderer: ({ value }) => <AccountRenderer account={{ slug: value }} />,
  },
};

const filtersWithoutHost = omit(filters, ['accountingCategory', 'type', 'status']);

const ROUTE_PARAMS = ['slug', 'section', 'subpath'];

export function ApproveGrantRequests({ accountSlug }: DashboardSectionProps) {
  const router = useRouter();

  const { data: metadata, refetch } = useQuery(accountExpensesMetadataQuery, {
    variables: { accountSlug },
  });

  const hostSlug = get(metadata, 'account.host.slug');

  const filterMeta: FilterMeta = {
    currency: metadata?.account?.currency,
    childrenAccounts: metadata?.account?.childrenAccounts?.nodes.length
      ? [metadata.account, ...metadata.account.childrenAccounts.nodes]
      : undefined,
    accountSlug,
    expenseTags: metadata?.expenseTagStats?.nodes?.map(({ tag }) => tag),
    hostSlug: hostSlug,
    includeUncategorized: true,
  };

  const queryFilter = useQueryFilter({
    schema: hostSlug ? schema : schemaWithoutHost,
    toVariables,
    meta: filterMeta,
    filters: hostSlug ? filters : filtersWithoutHost,
  });

  const { data, loading, error } = useQuery(accountExpensesQuery, {
    variables: {
      account: { slug: accountSlug },
      fetchHostForExpenses: false, // Already fetched at the root level
      hasAmountInCreatedByAccountCurrency: false,
      fetchGrantHistory: true,
      ...queryFilter.variables,
      type: ExpenseType.GRANT,
      status: [ExpenseStatusFilter.PENDING],
    },
  });

  const pageRoute = `/dashboard/${accountSlug}/approve-grant-requests`;

  const onViewDetailsClick = React.useCallback(
    (grant: Expense) => {
      router.push(
        {
          pathname: pageRoute,
          query: { ...omit(router.query, ROUTE_PARAMS), openGrantId: grant?.legacyId },
        },
        undefined,
        { shallow: true },
      );
    },
    [pageRoute, router],
  );

  const onClickRow = React.useCallback(
    (row: { original: Expense }) => {
      onViewDetailsClick(row.original);
    },
    [onViewDetailsClick],
  );

  const onCloseDetails = React.useCallback(() => {
    onViewDetailsClick(null);
  }, [onViewDetailsClick]);

  const openGrantId = router.query.openGrantId ? Number(router.query.openGrantId) : null;
  const openGrant = React.useMemo(
    () => data?.expenses?.nodes?.find(e => e.legacyId === openGrantId),
    [openGrantId, data?.expenses?.nodes],
  );

  return (
    <React.Fragment>
      <div className="flex flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Approve Grants Requests" id="nsfRjl" />}
          description={<FormattedMessage defaultMessage="Review received Grant Requests" id="su6SvX" />}
        />

        <Filterbar {...queryFilter} />
        {error && <MessageBoxGraphqlError error={error} mb={2} />}

        {!loading && !data.expenses?.nodes.length ? (
          <EmptyResults
            entityType="GRANTS"
            onResetFilters={() => queryFilter.resetFilters({})}
            hasFilters={queryFilter.hasFilters}
          />
        ) : (
          <React.Fragment>
            <DataTable
              data-cy="transactions-table"
              innerClassName="text-muted-foreground"
              meta={
                {
                  enableViewGrantsByBeneficiary: true,
                  onViewDetailsClick,
                  refetch,
                } as GrantsTableMeta
              }
              columns={compact([
                grantColumns.beneficiary,
                grantColumns.createdAt,
                grantColumns.amount,
                grantColumns.status,
                grantColumns.actions,
              ])}
              data={data?.expenses?.nodes || []}
              loading={loading}
              mobileTableView
              compact
              onClickRow={onClickRow}
              getRowDataCy={row => `grant-${row.original.legacyId}`}
            />
            <Pagination queryFilter={queryFilter} total={data?.expenses?.totalCount} />
          </React.Fragment>
        )}
      </div>
      <ExpenseDrawer openExpenseLegacyId={openGrantId} handleClose={onCloseDetails} initialExpenseValues={openGrant} />
    </React.Fragment>
  );
}
