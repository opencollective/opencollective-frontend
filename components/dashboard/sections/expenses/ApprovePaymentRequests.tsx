import React from 'react';
import { useQuery } from '@apollo/client';
import { isEmpty, omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import {
  HostContext,
  type AccountHoverCardFieldsFragment,
  type HostDashboardExpensesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { ExpenseStatusFilter, LastCommentBy } from '../../../../lib/graphql/types/v2/schema';
import { useLazyGraphQLPaginatedResults } from '../../../../lib/hooks/useLazyGraphQLPaginatedResults';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { isMulti, isNullable } from '@/lib/filters/schemas';
import { i18nExpenseStatus } from '@/lib/i18n/expense';
import { sortSelectOptions } from '@/lib/utils';

import ExpensesList from '../../../expenses/ExpensesList';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
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

import type { FilterMeta as CommonFilterMeta } from './filters';
import {
  ExpenseAccountingCategoryKinds,
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from './filters';
import { approvalMetadataQuery, hostDashboardExpensesQuery } from './queries';

// Statuses relevant for approval workflow
const ApprovalExpenseStatuses = [ExpenseStatusFilter.PENDING] as const;
const ApprovalExpenseStatusFilter = Object.fromEntries(
  Object.entries(ExpenseStatusFilter).filter(([status]) =>
    ApprovalExpenseStatuses.includes(status as ExpenseStatusFilter),
  ),
) as { [K in (typeof ApprovalExpenseStatuses)[number]]: (typeof ExpenseStatusFilter)[K] };

const filterSchema = commonSchema.extend({
  account: z.string().optional(),
  status: isNullable(isMulti(z.nativeEnum(ApprovalExpenseStatusFilter))),
  hostContext: hostContextFilter.schema.default(HostContext.INTERNAL),
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
  status: value => {
    /**
     * As `status` is "nullable", this function will run even if the value is null.
     * In that case we provide all approval status values as the variables to filter.
     */
    return isEmpty(value) ? { status: Object.values(ApprovalExpenseStatusFilter) } : { status: value };
  },
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...commonFilters,
  status: {
    labelMsg: defineMessage({ id: 'expense.status', defaultMessage: 'Status' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(ApprovalExpenseStatusFilter)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        isMulti
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => i18nExpenseStatus(intl, value),
  },
  account: hostedAccountFilter.filter,
  tag: expenseTagFilter.filter,
};

/**
 * Remove the expense from the query cache if we're filtering by status and the expense status has changed.
 */
// TODO: verify it works
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

const ApprovePaymentRequests = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const query = router.query;
  const { account } = React.useContext(DashboardContext);

  const pageRoute = `/dashboard/${hostSlug}/approve-payment-requests`;

  const views: Views<FilterValues> = [
    {
      label: intl.formatMessage({ id: 'expense.pending', defaultMessage: 'Pending' }),
      filter: { status: [ExpenseStatusFilter.PENDING], sort: { field: 'CREATED_AT', direction: 'ASC' } },
      id: 'pending',
    },
  ];

  const queryFilter = useQueryFilter({
    schema: filterSchema,
    toVariables,
    // defaultFilterValues: views[1].filter, // Default to "Pending" view
    filters,
    meta: {
      currency: account.currency,
      hostSlug: hostSlug,
      includeUncategorized: true,
      accountingCategoryKinds: ExpenseAccountingCategoryKinds,
    },
    lockViewFilters: true,
    views,
    skipFiltersOnReset: ['hostContext'],
  });

  const {
    data: metaData,
    error: errorMetaData,
    refetch: refetchMetaData,
  } = useQuery(approvalMetadataQuery, {
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

  const paginatedExpenses = useLazyGraphQLPaginatedResults(expenses, 'expenses');

  const { data, error, loading } = expenses;

  const getQueryParams = newParams => {
    return omitBy({ ...query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  };

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={
          <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
            <FormattedMessage defaultMessage="Approve Payment Requests" id="ApprovePaymentRequests" />
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
            defaultMessage="Approve payment requests that have been submitted to your organization."
            id="GS5NkP"
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
};

export default ApprovePaymentRequests;
