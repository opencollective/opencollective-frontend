import React from 'react';
import type { QueryResult } from '@apollo/client';
import { useQuery } from '@apollo/client';
import { defineMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FiltersToVariables } from '@/lib/filters/filter-types';
import { limit, offset } from '@/lib/filters/schemas';
import { gql } from '@/lib/graphql/helpers';
import type { CommunityAccountDetailQuery, HostDashboardExpensesQueryVariables } from '@/lib/graphql/types/v2/graphql';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import ExpensesList from '../../../expenses/ExpensesList';
import {
  expenseHostFields,
  expensesListAdminFieldsFragment,
  expensesListFieldsFragment,
} from '../../../expenses/graphql/fragments';
import { EmptyResults } from '../../EmptyResults';
import { accountFilter } from '../../filters/AccountFilter';
import { accountingCategoryFilter } from '../../filters/AccountingCategoryFilter';
import { amountFilter } from '../../filters/AmountFilter';
import { dateFilter } from '../../filters/DateFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import { searchFilter } from '../../filters/SearchFilter';
import { buildSortFilter } from '../../filters/SortFilter';
import {
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from '../expenses/filters';

const communityExpensesQuery = gql`
  query CommunityAccountExpenses(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $status: [ExpenseStatusFilter]
    $type: ExpenseType
    $types: [ExpenseType]
    $amount: AmountRangeInput
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $sort: ChronologicalOrderInput
    $paidByAccount: AccountReferenceInput
    $approvedByAccount: AccountReferenceInput
    $rejectedByAccount: AccountReferenceInput
    $accountingCategory: [String]
  ) {
    expenses(
      host: { slug: $hostSlug }
      limit: $limit
      offset: $offset
      type: $type
      types: $types
      status: $status
      amount: $amount
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $sort
      paidByAccount: $paidByAccount
      approvedByAccount: $approvedByAccount
      rejectedByAccount: $rejectedByAccount
      accountingCategory: $accountingCategory
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        ...ExpensesListFieldsFragment
        ...ExpensesListAdminFieldsFragment
      }
    }
    host(slug: $hostSlug) {
      id
      ...ExpenseHostFields
    }
  }
  ${expensesListFieldsFragment}
  ${expensesListAdminFieldsFragment}
  ${expenseHostFields}
`;

const communityExpensesMetaQuery = gql`
  query CommunityAccountExpensesMeta($hostSlug: String!, $accountSlug: String!) {
    approved: expenses(host: { slug: $hostSlug }, approvedByAccount: { slug: $accountSlug }, limit: 0) {
      totalCount
    }
    paid: expenses(host: { slug: $hostSlug }, paidByAccount: { slug: $accountSlug }, limit: 0) {
      totalCount
    }
    rejected: expenses(host: { slug: $hostSlug }, rejectedByAccount: { slug: $accountSlug }, limit: 0) {
      totalCount
    }
  }
`;

enum ManagedDisbursementView {
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

const sortFilter = buildSortFilter({
  fieldSchema: z.enum(['CREATED_AT']),
  defaultValue: { field: 'CREATED_AT', direction: 'DESC' },
});

const schema = z.object({
  limit: limit.default(15),
  offset,
  date: dateFilter.schema,
  amount: amountFilter.schema,
  sort: sortFilter.schema,
  searchTerm: searchFilter.schema,
  status: commonSchema.shape.status,
  type: commonSchema.shape.type,
  accountingCategory: accountingCategoryFilter.schema,
  approvedByAccount: accountFilter.schema,
  paidByAccount: accountFilter.schema,
  rejectedByAccount: accountFilter.schema,
});

type FilterValues = z.infer<typeof schema>;

const toVariables: FiltersToVariables<FilterValues, HostDashboardExpensesQueryVariables> = {
  date: commonToVariables.date,
  amount: commonToVariables.amount,
  status: commonToVariables.status,
  type: commonToVariables.type,
  approvedByAccount: accountFilter.toVariables,
  paidByAccount: accountFilter.toVariables,
  rejectedByAccount: accountFilter.toVariables,
};

const filterConfigs = {
  searchTerm: commonFilters.searchTerm,
  date: commonFilters.date,
  sort: sortFilter.filter,
  amount: commonFilters.amount,
  status: commonFilters.status,
  type: commonFilters.type,
  accountingCategory: accountingCategoryFilter.filter,
  approvedByAccount: {
    ...accountFilter.filter,
    labelMsg: defineMessage({ defaultMessage: 'Approved by', id: 'ApprovedBy' }),
  },
  paidByAccount: {
    ...accountFilter.filter,
    labelMsg: defineMessage({ defaultMessage: 'Paid by', id: 'PaidBy' }),
  },
  rejectedByAccount: {
    ...accountFilter.filter,
    labelMsg: defineMessage({ defaultMessage: 'Rejected by', id: 'RejectedBy' }),
  },
};

export const AccountDetailManagedDisbursementsTab = ({
  query,
  openExpenseLegacyId,
  setOpenExpenseLegacyId,
}: {
  query: QueryResult<CommunityAccountDetailQuery>;
  openExpenseLegacyId?: number;
  setOpenExpenseLegacyId?: (id: number | null) => void;
}) => {
  const intl = useIntl();
  const accountSlug = query.data?.account?.slug;
  const hostSlug = query.variables?.hostSlug as string;

  const { data: metaData } = useQuery(communityExpensesMetaQuery, {
    variables: {
      hostSlug,
      accountSlug,
    },
    skip: !accountSlug || !hostSlug,
  });

  const views = React.useMemo(
    () => [
      {
        id: ManagedDisbursementView.APPROVED,
        label: intl.formatMessage({ defaultMessage: 'Approved', id: 'Approved' }),
        filter: { approvedByAccount: accountSlug },
        count: metaData?.approved?.totalCount,
      },
      {
        id: ManagedDisbursementView.PAID,
        label: intl.formatMessage({ defaultMessage: 'Paid', id: 'Paid' }),
        filter: { paidByAccount: accountSlug },
        count: metaData?.paid?.totalCount,
      },
      {
        id: ManagedDisbursementView.REJECTED,
        label: intl.formatMessage({ defaultMessage: 'Rejected', id: 'Rejected' }),
        filter: { rejectedByAccount: accountSlug },
        count: metaData?.rejected?.totalCount,
      },
    ],
    [intl, accountSlug, metaData],
  );

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters: filterConfigs,
    views,
    skipRouter: true,
    lockViewFilters: true,
    meta: {
      hostSlug,
    },
  });

  const { data, error, loading } = useQuery(communityExpensesQuery, {
    variables: {
      hostSlug,
      ...queryFilter.variables,
    },
    skip: !accountSlug || !hostSlug,
  });

  const expenses = data?.expenses;

  return (
    <div className="flex flex-col gap-4">
      <Filterbar {...queryFilter} views={views} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !expenses?.nodes?.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="EXPENSES"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <ExpensesList
            isLoading={loading}
            host={data?.host}
            expenses={expenses?.nodes}
            nbPlaceholders={queryFilter.values.limit}
            useDrawer
            openExpenseLegacyId={openExpenseLegacyId}
            setOpenExpenseLegacyId={setOpenExpenseLegacyId}
            displaySummaryFooter={false}
          />
          <Pagination queryFilter={queryFilter} total={expenses?.totalCount} />
        </React.Fragment>
      )}
    </div>
  );
};
