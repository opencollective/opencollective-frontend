import React from 'react';
import { useQuery } from '@apollo/client';
import { omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  AccountHoverCardFieldsFragment,
  HostDashboardExpensesQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { ExpenseStatusFilter, PayoutMethodType } from '../../../../lib/graphql/types/v2/graphql';
import { useLazyGraphQLPaginatedResults } from '../../../../lib/hooks/useLazyGraphQLPaginatedResults';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import ExpensesList from '../../../expenses/ExpensesList';
import ExpensePipelineOverview from '../../../host-dashboard/expenses/ExpensePipelineOverview';
import ScheduledExpensesBanner from '../../../host-dashboard/ScheduledExpensesBanner';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBox from '../../../MessageBox';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import Pagination from '../../../Pagination';
import StyledButton from '../../../StyledButton';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { expenseTagFilter } from '../../filters/ExpenseTagsFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import type { DashboardSectionProps } from '../../types';

import type { FilterMeta as CommonFilterMeta } from './filters';
import { filters as commonFilters, schema as commonSchema, toVariables as commonToVariables } from './filters';
import { hostDashboardExpensesQuery, hostDashboardMetadataQuery } from './queries';

const filterSchema = commonSchema.extend({
  account: z.string().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

type FilterMeta = CommonFilterMeta & {
  hostSlug: string;
  hostedAccounts?: Array<AccountHoverCardFieldsFragment>;
  expenseTags?: string[];
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

const HostExpenses = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const query = router.query;
  const [paypalPreApprovalError, setPaypalPreApprovalError] = React.useState(null);
  const pageRoute = `/dashboard/${hostSlug}/host-expenses`;

  const {
    data: metaData,
    error: errorMetaData,
    refetch: refetchMetaData,
  } = useQuery(hostDashboardMetadataQuery, {
    variables: { hostSlug, withHoverCard: true },
    context: API_V2_CONTEXT,
  });

  const views: Views<FilterValues> = [
    {
      label: intl.formatMessage({ defaultMessage: 'All' }),
      filter: {},
      id: 'all',
      count: metaData?.all?.totalCount,
    },
    {
      label: intl.formatMessage({ id: 'expenses.ready', defaultMessage: 'Ready to pay' }),
      filter: { status: ExpenseStatusFilter.READY_TO_PAY, orderBy: 'CREATED_AT,ASC' },
      id: 'ready_to_pay',
      count: metaData?.ready_to_pay?.totalCount,
    },
    {
      label: intl.formatMessage({ id: 'expense.scheduledForPayment', defaultMessage: 'Scheduled for payment' }),
      filter: {
        status: ExpenseStatusFilter.SCHEDULED_FOR_PAYMENT,
        orderBy: 'CREATED_AT,ASC',
      },
      id: 'scheduled_for_payment',
      count: metaData?.scheduled_for_payment?.totalCount,
    },
    {
      label: intl.formatMessage({ defaultMessage: 'On hold' }),
      filter: { status: ExpenseStatusFilter.ON_HOLD, orderBy: 'CREATED_AT,ASC' },
      id: 'on_hold',
      count: metaData?.on_hold?.totalCount,
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Incomplete' }),
      filter: { status: ExpenseStatusFilter.INCOMPLETE, orderBy: 'CREATED_AT,ASC' },
      id: 'incomplete',
      count: metaData?.incomplete?.totalCount,
    },
    {
      label: intl.formatMessage({ id: 'Error', defaultMessage: 'Error' }),
      filter: { status: ExpenseStatusFilter.ERROR, orderBy: 'CREATED_AT,ASC' },
      id: 'error',
      count: metaData?.error?.totalCount,
    },
    {
      label: intl.formatMessage({ defaultMessage: 'Paid' }),
      filter: { status: ExpenseStatusFilter.PAID },
      id: 'paid',
      count: metaData?.paid?.totalCount,
    },
  ];

  const meta: FilterMeta = {
    currency: metaData?.host?.currency,
    hostSlug: hostSlug,
    hostedAccounts: metaData?.hostedAccounts.nodes,
    expenseTags: metaData?.expenseTags.nodes?.map(t => t.tag),
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
  React.useEffect(() => {
    if (query.paypalApprovalError && !paypalPreApprovalError) {
      setPaypalPreApprovalError(query.paypalApprovalError);
      router.replace(pageRoute, omit(query, 'paypalApprovalError'), { shallow: true });
    }
  }, [query.paypalApprovalError]);

  const { data, error, loading } = expenses;

  const getQueryParams = newParams => {
    return omitBy({ ...query, ...newParams }, (value, key) => !value || ROUTE_PARAMS.includes(key));
  };

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader title={<FormattedMessage id="Expenses" defaultMessage="Expenses" />} />
      {paypalPreApprovalError && (
        <MessageBox type="warning" mb={3} withIcon>
          {paypalPreApprovalError === 'PRE_APPROVAL_EMAIL_CHANGED' ? (
            <FormattedMessage
              id="paypal.preApproval.emailWarning"
              defaultMessage="Warning: the associated PayPal email was changed from {oldEmail} to {newEmail}. If this was not intentional, click {refillBalance} and use the correct account."
              values={{
                oldEmail: <strong>{query.oldPaypalEmail}</strong>,
                newEmail: <strong>{query.newPaypalEmail}</strong>,
                refillBalance: (
                  <q>
                    <FormattedMessage id="ConnectPaypal.refill" defaultMessage="Refill balance" />
                  </q>
                ),
              }}
            />
          ) : (
            paypalPreApprovalError
          )}
        </MessageBox>
      )}

      {!metaData?.host ? (
        <LoadingPlaceholder height={150} />
      ) : errorMetaData ? (
        <MessageBoxGraphqlError error={errorMetaData} />
      ) : (
        <ExpensePipelineOverview className="pt-4" host={metaData.host} />
      )}
      <ScheduledExpensesBanner
        hostSlug={hostSlug}
        onSubmit={() => {
          expenses.refetch();
          refetchMetaData();
        }}
        secondButton={
          !(
            queryFilter.values.status === ExpenseStatusFilter.SCHEDULED_FOR_PAYMENT &&
            queryFilter.values.payout === PayoutMethodType.BANK_ACCOUNT
          ) ? (
            <StyledButton
              buttonSize="tiny"
              buttonStyle="successSecondary"
              onClick={() =>
                queryFilter.resetFilters({
                  status: ExpenseStatusFilter.SCHEDULED_FOR_PAYMENT,
                  payout: PayoutMethodType.BANK_ACCOUNT,
                })
              }
            >
              <FormattedMessage id="expenses.list" defaultMessage="List Expenses" />
            </StyledButton>
          ) : null
        }
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
              onExpenseUpdate({ updatedExpense: expense, cache, variables, refetchMetaData });
            }}
            useDrawer
            openExpenseLegacyId={Number(router.query.openExpenseId)}
            setOpenExpenseLegacyId={legacyId => {
              router.push(
                {
                  pathname: pageRoute,
                  query: getQueryParams({ ...query, openExpenseId: legacyId }),
                },
                undefined,
                { shallow: true },
              );
            }}
          />
          <div className="mt-12 flex justify-center">
            <Pagination
              route={pageRoute}
              total={paginatedExpenses.totalCount}
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

export default HostExpenses;
