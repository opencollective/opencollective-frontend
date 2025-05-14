import React from 'react';
import { useQuery } from '@apollo/client';
import { omit } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { ExpenseType } from '@/lib/graphql/types/v2/schema';

import ExpensesList from '../../../expenses/ExpensesList';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';
import type { FilterMeta } from '../expenses/filters';
import { filters as commonFilters, schema, toVariables } from '../expenses/filters';
import { accountExpensesQuery } from '../expenses/queries';

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
    ...queryFilter.variables,
    type: ExpenseType.GRANT,
  };

  const { data, loading, error } = useQuery(accountExpensesQuery, {
    variables,
    context: API_V2_CONTEXT,
  });

  const filterMeta: FilterMeta = {
    currency: data?.account?.currency,
  };

  const pageRoute = `/dashboard/${accountSlug}/submitted-grants`;

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <React.Fragment>
      <div className="flex max-w-(--breakpoint-lg) flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Submitted Grants Requests" id="Sf1IrG" />}
          description={
            <FormattedMessage
              defaultMessage="Grant requests that you have submitted to other Collectives."
              id="CU04Sf"
            />
          }
        />
        <Filterbar {...queryFilter} meta={filterMeta} />

        {!loading && !data.expenses?.nodes.length ? (
          <EmptyResults
            entityType="EXPENSES"
            onResetFilters={() => queryFilter.resetFilters({})}
            hasFilters={queryFilter.hasFilters}
          />
        ) : (
          <React.Fragment>
            <ExpensesList
              isLoading={loading}
              expenses={data?.expenses?.nodes}
              nbPlaceholders={queryFilter.values.limit}
              isInverted
              view={'submitter-new'}
              useDrawer
              openExpenseLegacyId={Number(router.query.openExpenseId)}
              expenseFieldForTotalAmount="amountInCreatedByAccountCurrency"
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
