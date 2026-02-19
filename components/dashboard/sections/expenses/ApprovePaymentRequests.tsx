import React from 'react';
import { useQuery } from '@apollo/client';
import { omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import {
  type AccountHoverCardFieldsFragment,
  HostContext,
  type HostDashboardExpensesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { ExpenseStatusFilter } from '../../../../lib/graphql/types/v2/graphql';
import { useLazyGraphQLPaginatedResults } from '../../../../lib/hooks/useLazyGraphQLPaginatedResults';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import ExpensesList from '../../../expenses/ExpensesList';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
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
import { hostDashboardExpensesQuery } from './queries';

const filterSchema = commonSchema.extend({
  account: hostedAccountFilter.schema,
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
const onExpenseUpdate = ({ updatedExpense, cache, variables }) => {
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
      id: 'pending',
      filter: {
        status: [ExpenseStatusFilter.PENDING],
      },
      label: intl.formatMessage({ id: 'expense.pending', defaultMessage: 'Pending' }),
    },
  ];

  const queryFilter = useQueryFilter({
    schema: filterSchema,
    toVariables,
    filters,
    meta: {
      currency: account.currency,
      hostSlug: hostSlug,
      includeUncategorized: true,
      accountingCategoryKinds: ExpenseAccountingCategoryKinds,
    },
    views,
    lockViewFilters: true,
    skipFiltersOnReset: ['hostContext'],
  });

  const variables = {
    hostSlug,
    ...queryFilter.variables,
    status: [ExpenseStatusFilter.PENDING, ExpenseStatusFilter.UNVERIFIED],
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
            <HostContextFilter
              value={queryFilter.values.hostContext}
              onChange={val => queryFilter.setFilter('hostContext', val)}
              intl={intl}
            />
          </div>
        }
        description={<FormattedMessage defaultMessage="Approve payment requests" id="DKcbG3" />}
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
          <ExpensesList
            isLoading={loading}
            host={data?.host}
            nbPlaceholders={paginatedExpenses.limit}
            expenses={paginatedExpenses.nodes}
            view="admin"
            onProcess={(expense, cache) => {
              onExpenseUpdate({ updatedExpense: expense, cache, variables });
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
