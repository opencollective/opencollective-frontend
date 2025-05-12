import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  AccountHoverCardFieldsFragment,
  HostDashboardExpensesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { ExpenseStatusFilter } from '../../../../lib/graphql/types/v2/schema';
import { useLazyGraphQLPaginatedResults } from '../../../../lib/hooks/useLazyGraphQLPaginatedResults';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import { accountHoverCardFields } from '@/components/AccountHoverCard';

import ExpensesList from '../../../expenses/ExpensesList';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { expenseTagFilter } from '../../filters/ExpenseTagsFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';
import type { FilterMeta as CommonFilterMeta } from '../expenses/filters';
import {
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from '../expenses/filters';
import { hostDashboardExpensesQuery, hostInfoCardFields } from '../expenses/queries';

const filterSchema = commonSchema.extend({
  account: z.string().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

type FilterMeta = CommonFilterMeta & {
  hostSlug: string;
  hostedAccounts?: Array<AccountHoverCardFieldsFragment>;
  expenseTags?: string[];
  includeUncategorized?: boolean;
};

const toVariables: FiltersToVariables<FilterValues, HostDashboardExpensesQueryVariables, FilterMeta> = {
  ...commonToVariables,
  limit: (value, key) => ({ [key]: value * 2 }), // Times two for the lazy pagination
  account: hostedAccountFilter.toVariables,
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...commonFilters,
  account: hostedAccountFilter.filter,
  tag: expenseTagFilter.filter,
};

/**
 * Remove the expense from the query cache if we're filtering by status and the expense status has changed.
 */
const onExpenseUpdate = ({ updatedExpense, cache, variables, refetchMetaData }) => {
  refetchMetaData(); // Refetch the metadata to update the view counts
  if (variables.status && updatedExpense.status !== variables.status) {
    cache.updateQuery({ query: hostDashboardExpensesQuery, variables }, data => {
      return {
        ...data,
        expenses: {
          ...data.expenses,
          totalCount: data.expenses.totalCount - 1,
          nodes: data.expenses.nodes?.filter(expense => updatedExpense.id !== expense.id),
        },
      };
    });
  }
};

const ROUTE_PARAMS = ['slug', 'section'];

export function HostedGrants({ accountSlug: hostSlug }: DashboardSectionProps) {
  const router = useRouter();
  const intl = useIntl();
  const query = router.query;
  const pageRoute = `/dashboard/${hostSlug}/hosted-grants`;

  const { data: metaData, refetch: refetchMetaData } = useQuery(
    gql`
      query HostedGrantsMetadata($hostSlug: String!) {
        host(slug: $hostSlug) {
          id
          ...HostInfoCardFields
          transferwise {
            id
            availableCurrencies
            amountBatched {
              valueInCents
              currency
            }
          }
        }
        pending: expenses(host: { slug: $hostSlug }, status: [PENDING]) {
          totalCount
        }
        approved: expenses(host: { slug: $hostSlug }, status: [APPROVED]) {
          totalCount
        }
        paid: expenses(host: { slug: $hostSlug }, status: [PAID]) {
          totalCount
        }

        hostedAccounts: accounts(host: { slug: $hostSlug }, orderBy: { field: ACTIVITY, direction: DESC }) {
          nodes {
            id
            ...AccountHoverCardFields
          }
        }

        expenseTags: expenseTagStats(host: { slug: $hostSlug }) {
          nodes {
            id
            tag
          }
        }
      }

      ${accountHoverCardFields}
      ${hostInfoCardFields}
    `,
    {
      variables: { hostSlug, withHoverCard: true },
      context: API_V2_CONTEXT,
    },
  );

  const views: Views<FilterValues> = [
    {
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
      id: 'all',
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Awaiting approval', id: 'uPFUUe' }),
      filter: { status: [ExpenseStatusFilter.PENDING], sort: { field: 'CREATED_AT', direction: 'ASC' } },
      id: 'pending',
      count: metaData?.pending?.totalCount,
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Approved', id: '6XFO/C' }),
      filter: {
        status: [ExpenseStatusFilter.APPROVED],
        sort: { field: 'CREATED_AT', direction: 'ASC' },
      },
      id: 'approved',
      count: metaData?.approved?.totalCount,
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Disbursed', id: 'eErSK0' }),
      filter: { status: [ExpenseStatusFilter.PAID] },
      count: metaData?.paid?.totalCount,
      id: 'paid',
    },
  ];

  const meta: FilterMeta = {
    currency: metaData?.host?.currency,
    hostSlug: hostSlug,
    hostedAccounts: metaData?.hostedAccounts.nodes,
    expenseTags: metaData?.expenseTags.nodes?.map(t => t.tag),
    includeUncategorized: true,
  };

  const queryFilter = useQueryFilter({
    schema: filterSchema,
    toVariables,
    defaultFilterValues: views[1].filter,
    filters,
    meta,
    views,
  });

  const variables = {
    hostSlug,
    ...queryFilter.variables,
  };

  const expenses = useQuery(hostDashboardExpensesQuery, {
    variables,
    context: API_V2_CONTEXT,
  });

  const paginatedExpenses = useLazyGraphQLPaginatedResults(expenses, 'expenses');

  const { data, error, loading } = expenses;

  const getQueryParams = newParams => {
    return omitBy({ ...query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  };

  return (
    <div className="flex max-w-(--breakpoint-lg) flex-col gap-4">
      <DashboardHeader title={<FormattedMessage defaultMessage="Grants" id="Csh2rX" />} />

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
          <ExpensesList
            isLoading={loading}
            host={data?.host}
            nbPlaceholders={paginatedExpenses.limit}
            expenses={paginatedExpenses.nodes}
            view="admin"
            onProcess={(expense, cache) => {
              onExpenseUpdate({ updatedExpense: expense, cache, variables, refetchMetaData });
            }}
            useDrawer
            openExpenseLegacyId={Number(router.query.openExpenseId)}
            setOpenExpenseLegacyId={(legacyId, attachmentUrl) => {
              router.push(
                {
                  pathname: pageRoute,
                  query: getQueryParams({ ...query, openExpenseId: legacyId, attachmentUrl }),
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
  );
}
