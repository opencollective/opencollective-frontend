import React from 'react';
import { useQuery } from '@apollo/client';
import { compact, omit } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { isIndividualAccount } from '@/lib/collective';
import type { Expense } from '@/lib/graphql/types/v2/graphql';
import { ExpenseType } from '@/lib/graphql/types/v2/graphql';

import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import { DataTable } from '@/components/table/DataTable';

import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';
import type { FilterMeta } from '../expenses/filters';
import { filters as commonFilters, schema, toVariables } from '../expenses/filters';
import { accountExpensesQuery } from '../expenses/queries';

import type { GrantsTableMeta } from './common';
import { grantColumns } from './common';

const ROUTE_PARAMS = ['slug', 'section', 'subpath'];
const filters = omit(commonFilters, ['type', 'chargeHasReceipts']);

export function SubmittedGrants({ accountSlug }: DashboardSectionProps) {
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters,
  });
  const createdByAccount = accountSlug === LoggedInUser?.collective.slug ? { slug: accountSlug } : null;
  const fromAccount = !createdByAccount ? { slug: accountSlug } : null;

  const variables = {
    collectiveSlug: accountSlug,
    createdByAccount,
    fromAccount,
    fetchHostForExpenses: true,
    hasAmountInCreatedByAccountCurrency: true, // To generate the `amountInCreatedByAccountCurrency` field below
    fetchGrantHistory: false,
    ...queryFilter.variables,
    type: ExpenseType.GRANT,
  };

  const { data, loading, error, refetch } = useQuery(accountExpensesQuery, {
    variables,
  });

  const filterMeta: FilterMeta = {
    currency: data?.account?.currency,
  };

  const pageRoute = `/dashboard/${accountSlug}/submitted-grants`;

  const { account } = React.useContext(DashboardContext);
  const isIndividual = isIndividualAccount(account);

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
          title={
            isIndividual ? (
              <FormattedMessage defaultMessage="Grant Requests" id="fng2Fr" />
            ) : (
              <FormattedMessage defaultMessage="Issued Grants Requests" id="Tz9Fw1" />
            )
          }
          description={<FormattedMessage defaultMessage="Grant requests that you have issued" id="zKZXvF" />}
        />
        <Filterbar {...queryFilter} meta={filterMeta} />

        {error && <MessageBoxGraphqlError error={error} mb={2} />}
        {!error && !loading && !data?.expenses?.nodes.length ? (
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
                  onViewDetailsClick,
                  refetch,
                } as GrantsTableMeta
              }
              columns={compact([
                grantColumns.account,
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
