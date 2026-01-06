import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { compact, get, omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { type ExpensesPageQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import type { Account, Expense } from '../../../../lib/graphql/types/v2/schema';
import { ExpenseType } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { CollectiveType } from '@/lib/constants/collectives';

import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';
import SubmitGrantFlow from '@/components/submit-grant/SubmitGrantFlow';
import { DataTable } from '@/components/table/DataTable';
import { Button } from '@/components/ui/Button';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { accountFilter } from '../../filters/AccountFilter';
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
    fromAccount: accountFilter.schema,
  })
  .omit({ type: true });

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
  fromAccount: accountFilter.toVariables,
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...omit(commonFilters, ['type', 'chargeHasReceipts']),
  tag: expenseTagFilter.filter,
  account: {
    labelMsg: defineMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    Component: ({ meta, ...props }) => {
      return (
        <ComboSelectFilter
          options={
            meta?.childrenAccounts?.map(account => ({
              value: account.slug,
              label: <AccountRenderer account={account} inOptionsList />,
            })) ?? []
          }
          {...props}
        />
      );
    },
    valueRenderer: ({ value }) => <AccountRenderer account={{ slug: value }} />,
  },
  fromAccount: { ...accountFilter.filter, labelMsg: defineMessage({ defaultMessage: 'Beneficiary', id: 'VfJsl4' }) },
};

const filtersWithoutHost = omit(filters, ['accountingCategory', 'type']);

const ROUTE_PARAMS = ['slug', 'section', 'subpath'];

export function Grants({ accountSlug }: DashboardSectionProps) {
  const router = useRouter();
  const { account } = useContext(DashboardContext);
  const [isCreateSubmitGrantFlowOpen, setIsCreateSubmitGrantFlowOpen] = React.useState(false);

  const { data: metadata, refetch: refechMetadata } = useQuery(accountExpensesMetadataQuery, {
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

  const { data, loading, error, refetch } = useQuery(accountExpensesQuery, {
    variables: {
      account: { slug: accountSlug },
      fetchHostForExpenses: false, // Already fetched at the root level
      hasAmountInCreatedByAccountCurrency: false,
      fetchGrantHistory: true,
      ...queryFilter.variables,
      type: ExpenseType.GRANT,
    },
  });

  const pageRoute = `/dashboard/${accountSlug}/grants`;

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
      {isCreateSubmitGrantFlowOpen && (
        <SubmitGrantFlow
          account={metadata?.account}
          handleOnClose={() => setIsCreateSubmitGrantFlowOpen(false)}
          onGrantSubmitted={() => {
            refechMetadata();
            refetch();
          }}
        />
      )}
      <div className="flex flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Grant requests" id="71LMx7" />}
          description={<FormattedMessage defaultMessage="Grant requests submitted to your account." id="qSe73a" />}
          actions={
            account.type === CollectiveType.FUND && (
              <Button size="sm" onClick={() => setIsCreateSubmitGrantFlowOpen(true)}>
                <FormattedMessage defaultMessage="Create grant request" id="TnG9DJ" />
              </Button>
            )
          }
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
              data-cy="grants-table"
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
