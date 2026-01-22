import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { compact, omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import type {
  AccountHoverCardFieldsFragment,
  HostDashboardExpensesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import type { AccountingCategoryKind, Expense } from '../../../../lib/graphql/types/v2/schema';
import { ExpenseStatusFilter, ExpenseType } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { FEATURES, requiresUpgrade } from '@/lib/allowed-features';

import { accountHoverCardFieldsFragment } from '@/components/AccountHoverCard';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import { UpgradePlanCTA } from '@/components/platform-subscriptions/UpgradePlanCTA';
import { DataTable } from '@/components/table/DataTable';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { accountFilter } from '../../filters/AccountFilter';
import { expenseTagFilter } from '../../filters/ExpenseTagsFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import { Pagination } from '../../filters/Pagination';
import { buildSortFilter } from '../../filters/SortFilter';
import type { DashboardSectionProps } from '../../types';
import type { FilterMeta as CommonFilterMeta } from '../expenses/filters';
import {
  ExpenseAccountingCategoryKinds,
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from '../expenses/filters';
import { hostDashboardExpensesQuery, hostInfoCardFieldsFragment } from '../expenses/queries';

import type { GrantsTableMeta } from './common';
import { grantColumns } from './common';

const sortByFilter = buildSortFilter({
  fieldSchema: z.enum(['CREATED_AT']),
  defaultValue: {
    field: 'CREATED_AT',
    direction: 'ASC',
  },
});

const filterSchema = commonSchema.extend({
  account: z.string().optional(),
  fromAccount: accountFilter.schema,
  sort: sortByFilter.schema,
});

type FilterValues = z.infer<typeof filterSchema>;

type FilterMeta = CommonFilterMeta & {
  hostSlug: string;
  hostedAccounts?: Array<AccountHoverCardFieldsFragment>;
  includeUncategorized?: boolean;
  accountingCategoryKinds: readonly AccountingCategoryKind[];
};

const toVariables: FiltersToVariables<FilterValues, HostDashboardExpensesQueryVariables, FilterMeta> = {
  ...commonToVariables,
  limit: (value, key) => ({ [key]: value * 2 }), // Times two for the lazy pagination
  account: hostedAccountFilter.toVariables,
  fromAccount: accountFilter.toVariables,
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...omit(commonFilters, ['type', 'chargeHasReceipts']),
  account: hostedAccountFilter.filter,
  tag: expenseTagFilter.filter,
  fromAccount: { ...accountFilter.filter, labelMsg: defineMessage({ defaultMessage: 'Beneficiary', id: 'VfJsl4' }) },
};

const ROUTE_PARAMS = ['slug', 'section'];

export function HostedGrants({ accountSlug: hostSlug }: DashboardSectionProps) {
  const router = useRouter();
  const intl = useIntl();
  const pageRoute = `/dashboard/${hostSlug}/hosted-grants`;
  const { account } = React.useContext(DashboardContext);
  const isUpgradeRequired = requiresUpgrade(account, FEATURES.FUNDS_GRANTS_MANAGEMENT);
  const { data: metaData } = useQuery(
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
        pending: expenses(host: { slug: $hostSlug }, status: [PENDING], type: GRANT) {
          totalCount
        }
        approved: expenses(host: { slug: $hostSlug }, status: [APPROVED], type: GRANT) {
          totalCount
        }
        paid: expenses(host: { slug: $hostSlug }, status: [PAID], type: GRANT) {
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

      ${accountHoverCardFieldsFragment}
      ${hostInfoCardFieldsFragment}
    `,
    {
      variables: { hostSlug, withHoverCard: true },

      skip: isUpgradeRequired,
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
    includeUncategorized: true,
    accountingCategoryKinds: ExpenseAccountingCategoryKinds,
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
    type: ExpenseType.GRANT,
    fetchGrantHistory: true,
  };

  const expenses = useQuery(hostDashboardExpensesQuery, {
    variables,

    skip: isUpgradeRequired,
  });

  const { data, error, loading, refetch } = expenses;

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
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Grants" id="Csh2rX" />}
        description={<FormattedMessage defaultMessage="Grant requests submitted to your hosted funds" id="TPbcKk" />}
      />
      {isUpgradeRequired ? (
        <UpgradePlanCTA featureKey={FEATURES.FUNDS_GRANTS_MANAGEMENT} />
      ) : (
        <React.Fragment>
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
                  grantColumns.account,
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
          <ExpenseDrawer
            openExpenseLegacyId={openGrantId}
            handleClose={onCloseDetails}
            initialExpenseValues={openGrant}
          />
        </React.Fragment>
      )}
    </div>
  );
}
