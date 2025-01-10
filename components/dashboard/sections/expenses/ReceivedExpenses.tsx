import React from 'react';
import { useQuery } from '@apollo/client';
import { get, omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '../../../../lib/filters/filter-types';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { type ExpensesPageQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import { type Account, ExpenseStatusFilter, PayoutMethodType } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import ExpensesList from '../../../expenses/ExpensesList';
import StyledButton from '../../../StyledButton';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { expenseTagFilter } from '../../filters/ExpenseTagsFilter';
import { Filterbar } from '../../filters/Filterbar';
import { AccountRenderer } from '../../filters/HostedAccountFilter';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';

import type { FilterMeta as CommonFilterMeta } from './filters';
import { filters as commonFilters, schema as commonSchema, toVariables as commonToVariables } from './filters';
import { accountExpensesMetadataQuery, accountExpensesQuery } from './queries';
import ScheduledExpensesBanner from './ScheduledExpensesBanner';

const schema = commonSchema.extend({
  account: z.string().nullable().default(null),
});

const schemaWithoutHost = schema.omit({ accountingCategory: true });

type FilterValues = z.infer<typeof schema>;

type FilterMeta = CommonFilterMeta & {
  accountSlug: string;
  childrenAccounts?: Array<Account>;
  expenseTags?: string[];
  hostSlug?: string;
  includeUncategorized: boolean;
};
const toVariables: FiltersToVariables<FilterValues, ExpensesPageQueryVariables, FilterMeta> = {
  ...commonToVariables,
  account: (slug, key, meta) => {
    if (!slug) {
      return { includeChildrenExpenses: true };
    } else if (meta.childrenAccounts && !meta.childrenAccounts.find(a => a.slug === slug)) {
      return { limit: 0 };
    } else {
      return { account: { slug } };
    }
  },
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...commonFilters,
  tag: expenseTagFilter.filter,
  account: {
    labelMsg: defineMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    Component: ({ meta, ...props }) => {
      return (
        <ComboSelectFilter
          options={meta.childrenAccounts.map(account => ({
            value: account.slug,
            label: <AccountRenderer account={account} inOptionsList />,
          }))}
          {...props}
        />
      );
    },
    valueRenderer: ({ value }) => <AccountRenderer account={{ slug: value }} />,
  },
};

const filtersWithoutHost = omit(filters, 'accountingCategory');

const ROUTE_PARAMS = ['slug', 'section', 'subpath'];

const ReceivedExpenses = ({ accountSlug }: DashboardSectionProps) => {
  const router = useRouter();

  const {
    data: metadata,
    loading: loadingMetaData,
    refetch: refetchMetadata,
  } = useQuery(accountExpensesMetadataQuery, {
    variables: { accountSlug },
    context: API_V2_CONTEXT,
  });

  const isSelfHosted = metadata?.account && metadata.account.id === metadata.account.host?.id;
  const hostSlug = get(metadata, 'account.host.slug');

  const filterMeta: FilterMeta = {
    currency: metadata?.account?.currency,
    childrenAccounts: metadata?.account?.childrenAccounts?.nodes.length
      ? [metadata.account, ...metadata.account.childrenAccounts.nodes]
      : undefined,
    accountSlug,
    expenseTags: metadata?.expenseTagStats?.nodes?.map(({ tag }) => tag),
    hostSlug: hostSlug,
    includeUncategorized: true,
  };

  const queryFilter = useQueryFilter({
    schema: hostSlug ? schema : schemaWithoutHost,
    toVariables,
    meta: filterMeta,
    filters: hostSlug ? filters : filtersWithoutHost,
  });

  const { data, loading, refetch } = useQuery(accountExpensesQuery, {
    variables: {
      account: { slug: accountSlug },
      fetchHostForExpenses: false, // Already fetched at the root level
      hasAmountInCreatedByAccountCurrency: false,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
  });

  const pageRoute = `/dashboard/${accountSlug}/expenses`;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Received Expenses" id="1c0Y31" />}
        description={<FormattedMessage defaultMessage="Expenses submitted to your account." id="0I3Lbj" />}
      />
      {isSelfHosted && (
        <ScheduledExpensesBanner
          hostSlug={hostSlug}
          onSubmit={() => {
            refetch();
            refetchMetadata();
          }}
          secondButton={
            !(
              queryFilter.values.status?.includes(ExpenseStatusFilter.SCHEDULED_FOR_PAYMENT) &&
              queryFilter.values.payout === PayoutMethodType.BANK_ACCOUNT
            ) ? (
              <StyledButton
                buttonSize="tiny"
                buttonStyle="successSecondary"
                onClick={() =>
                  queryFilter.resetFilters({
                    status: [ExpenseStatusFilter.SCHEDULED_FOR_PAYMENT],
                    payout: PayoutMethodType.BANK_ACCOUNT,
                  })
                }
              >
                <FormattedMessage id="expenses.list" defaultMessage="List Expenses" />
              </StyledButton>
            ) : null
          }
        />
      )}
      <Filterbar {...queryFilter} />

      {!loading && !data.expenses?.nodes.length ? (
        <EmptyResults
          entityType="EXPENSES"
          onResetFilters={() => queryFilter.resetFilters({})}
          hasFilters={queryFilter.hasFilters}
        />
      ) : (
        <React.Fragment>
          <ExpensesList
            isLoading={loading || loadingMetaData}
            collective={metadata?.account}
            host={metadata?.account?.host}
            expenses={data?.expenses?.nodes}
            nbPlaceholders={queryFilter.values.limit}
            useDrawer
            openExpenseLegacyId={Number(router.query.openExpenseId)}
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
  );
};

export default ReceivedExpenses;
