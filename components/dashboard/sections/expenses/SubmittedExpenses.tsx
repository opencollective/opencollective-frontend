import React from 'react';
import { useQuery } from '@apollo/client';
import { omit } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import ExpensesList from '../../../expenses/ExpensesList';
import Pagination from '../../../Pagination';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import type { DashboardSectionProps } from '../../types';

import type { FilterMeta } from './filters';
import { filters, schema, toVariables } from './filters';
import { accountExpensesQuery } from './queries';

const ROUTE_PARAMS = ['slug', 'section', 'subpath'];

const SubmittedExpenses = ({ accountSlug }: DashboardSectionProps) => {
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
  };

  const { data, loading } = useQuery(accountExpensesQuery, {
    variables,
    context: API_V2_CONTEXT,
  });

  const filterMeta: FilterMeta = {
    currency: data?.account?.currency,
  };

  const pageRoute = `/dashboard/${accountSlug}/submitted-expenses`;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Submitted Expenses" />}
        description={<FormattedMessage defaultMessage="Expenses that you have submitted to other Collectives." />}
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
            collective={data?.account}
            host={data?.account?.isHost ? data?.account : data?.account?.host}
            expenses={data?.expenses?.nodes}
            nbPlaceholders={queryFilter.values.limit}
            isInverted
            view={'submitter'}
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
          <div className="mt-12 flex justify-center">
            <Pagination
              route={pageRoute}
              total={data?.expenses?.totalCount}
              limit={queryFilter.values.limit}
              offset={queryFilter.values.limit}
              ignoredQueryParams={ROUTE_PARAMS}
            />
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default SubmittedExpenses;
