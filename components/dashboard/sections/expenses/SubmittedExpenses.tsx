import React from 'react';
import { useQuery } from '@apollo/client';
import { omit } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { PREVIEW_FEATURE_KEYS } from '../../../../lib/preview-features';

import ExpensesList from '../../../expenses/ExpensesList';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import { Button } from '../../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { Filterbar } from '../../filters/Filterbar';
import { DashboardSectionProps } from '../../types';

import { FilterMeta, filters, schema, toVariables } from './filters';
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

  const { data, loading, error } = useQuery(accountExpensesQuery, {
    variables,
    context: API_V2_CONTEXT,
  });

  const filterMeta: FilterMeta = {
    currency: data?.account?.currency,
  };

  const hasNewSubmitExpenseFlow = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW);

  const pageRoute = `/dashboard/${accountSlug}/submitted-expenses`;

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Submitted Expenses" />}
        description={<FormattedMessage defaultMessage="Expenses that you have submitted to other Collectives." />}
        actions={
          hasNewSubmitExpenseFlow ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1">
                  <span>
                    <FormattedMessage defaultMessage="New expense" />
                  </span>
                  <ChevronDown size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <Link href={`/dashboard/${accountSlug}/expenses/new`}>
                    <FormattedMessage defaultMessage="Submit invoice for myself" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/dashboard/${accountSlug}/expenses/new?invite=true`}>
                    <FormattedMessage defaultMessage="Invite someone to submit an invoice" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
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
              offset={queryFilter.values.offset}
              ignoredQueryParams={ROUTE_PARAMS}
            />
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default SubmittedExpenses;
