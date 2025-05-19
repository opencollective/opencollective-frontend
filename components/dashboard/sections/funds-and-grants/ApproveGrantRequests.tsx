import React from 'react';
import { useQuery } from '@apollo/client';
import { get, omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { type ExpensesPageQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { type Account, ExpenseStatusFilter, ExpenseType } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import ExpensesList from '../../../expenses/ExpensesList';
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
  ...omit(commonFilters, ['type', 'status']),
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

  const { data: metadata, loading: loadingMetaData } = useQuery(accountExpensesMetadataQuery, {
    variables: { accountSlug },
    context: API_V2_CONTEXT,
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

  const { data, loading } = useQuery(accountExpensesQuery, {
    variables: {
      account: { slug: accountSlug },
      fetchHostForExpenses: false, // Already fetched at the root level
      hasAmountInCreatedByAccountCurrency: false,
      ...queryFilter.variables,
      type: ExpenseType.GRANT,
      status: [ExpenseStatusFilter.PENDING],
    },
    context: API_V2_CONTEXT,
  });

  const pageRoute = `/dashboard/${accountSlug}/approve-grant-requests`;

  return (
    <React.Fragment>
      <div className="flex max-w-(--breakpoint-lg) flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Approve Grants Requests" id="nsfRjl" />}
          description={<FormattedMessage defaultMessage="Review Grants submitted to your account." id="ZGgpSR" />}
        />

        <Filterbar {...queryFilter} />

        {!loading && !data.expenses?.nodes.length ? (
          <EmptyResults
            entityType="EXPENSES"
            onResetFilters={() => queryFilter.resetFilters({})}
            hasFilters={queryFilter.hasFilters}
          />
        ) : (
          <React.Fragment>
            <ExpensesList
              isLoading={loading || loadingMetaData}
              collective={metadata?.account}
              host={metadata?.account?.host}
              expenses={data?.expenses?.nodes}
              nbPlaceholders={queryFilter.values.limit}
              useDrawer
              openExpenseLegacyId={Number(router.query.openExpenseId)}
              setOpenExpenseLegacyId={legacyId => {
                router.push(
                  {
                    pathname: pageRoute,
                    query: { ...omit(router.query, ROUTE_PARAMS), openExpenseId: legacyId },
                  },
                  undefined,
                  { shallow: true },
                );
              }}
            />
            <Pagination queryFilter={queryFilter} total={data?.expenses?.totalCount} />
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}
