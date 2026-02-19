import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { get, omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../lib/filters/filter-types';
import { type ExpensesPageQueryVariables } from '../../../../lib/graphql/types/v2/graphql';
import {
  type Account,
  ExpenseStatusFilter,
  ExpenseType,
  PayoutMethodType,
} from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { PREVIEW_FEATURE_KEYS } from '../../../../lib/preview-features';

import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import ExpensesList from '../../../expenses/ExpensesList';
import StyledButton from '../../../StyledButton';
import { SubmitExpenseFlow } from '../../../submit-expense/SubmitExpenseFlow';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { AccountRenderer } from '../../filters/HostedAccountFilter';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';

import type { FilterMeta as CommonFilterMeta } from './filters';
import {
  ExpenseAccountingCategoryKinds,
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from './filters';
import { accountExpensesQuery, paymentRequestsMetadataQuery } from './queries';
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

const PaymentRequests = ({ accountSlug }: DashboardSectionProps) => {
  const router = useRouter();
  const intl = useIntl();
  const [isExpenseFlowOpen, setIsExpenseFlowOpen] = React.useState(false);
  const { LoggedInUser } = useLoggedInUser();

  const views: Views<FilterValues> = useMemo(
    () => [
      {
        label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
        filter: {},
        id: 'all',
      },
      {
        label: intl.formatMessage({ id: 'expense.pending', defaultMessage: 'Pending' }),
        filter: { status: [ExpenseStatusFilter.PENDING] },
        id: 'pending',
      },
      {
        label: intl.formatMessage({ defaultMessage: 'Paid', id: 'u/vOPu' }),
        filter: { status: [ExpenseStatusFilter.PAID] },
        id: 'paid',
      },
      {
        label: intl.formatMessage({ defaultMessage: 'Rejected', id: '5qaD7s' }),
        filter: { status: [ExpenseStatusFilter.REJECTED] },
        id: 'rejected',
      },
    ],
    [intl],
  );

  const {
    data: metadata,
    loading: loadingMetaData,
    refetch: refetchMetadata,
  } = useQuery(paymentRequestsMetadataQuery, {
    variables: { accountSlug },
  });

  const viewsWithCount: Views<FilterValues> = useMemo(
    () =>
      views.map(view => ({
        ...view,
        count: metadata?.[view.id]?.totalCount,
      })),
    [views, metadata],
  );

  const isSelfHosted = metadata?.account && metadata.account.id === metadata.account.host?.id;
  const hostSlug = get(metadata, 'account.host.slug');

  const omitExpenseTypes = [ExpenseType.GRANT];

  const filterMeta: FilterMeta = {
    currency: metadata?.account?.currency,
    childrenAccounts: metadata?.account?.childrenAccounts?.nodes.length
      ? [metadata.account, ...metadata.account.childrenAccounts.nodes]
      : undefined,
    accountSlug,
    hostSlug: hostSlug,
    includeUncategorized: true,
    omitExpenseTypes,
    accountingCategoryKinds: ExpenseAccountingCategoryKinds,
  };

  const queryFilter = useQueryFilter<typeof schema | typeof schemaWithoutHost, ExpensesPageQueryVariables>({
    schema: hostSlug ? schema : schemaWithoutHost,
    toVariables,
    meta: filterMeta,
    filters: hostSlug ? filters : filtersWithoutHost,
    views,
  });

  const { data, loading, refetch, error } = useQuery(accountExpensesQuery, {
    variables: {
      account: { slug: accountSlug },
      fetchHostForExpenses: false, // Already fetched at the root level
      hasAmountInCreatedByAccountCurrency: false,
      fetchGrantHistory: false,
      ...queryFilter.variables,
    },
  });

  const hasNewSubmitExpenseFlow =
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW) || router.query.newExpenseFlowEnabled;

  const pageRoute = `/dashboard/${accountSlug}/payment-requests`;

  return (
    <React.Fragment>
      <div className="flex flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Payment Requests" id="PaymentRequests" />}
          description={
            <FormattedMessage
              defaultMessage="Payment requests submitted to your account."
              id="PaymentRequestsDescription"
            />
          }
          actions={
            hasNewSubmitExpenseFlow ? (
              <Button onClick={() => setIsExpenseFlowOpen(true)} size="sm" className="gap-1">
                <FormattedMessage defaultMessage="New expense" id="pNn/g+" />
              </Button>
            ) : null
          }
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
        <Filterbar {...queryFilter} views={viewsWithCount} />

        {!loading && error ? (
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
      {isExpenseFlowOpen && (
        <SubmitExpenseFlow
          onClose={submittedExpense => {
            setIsExpenseFlowOpen(false);
            if (submittedExpense) {
              refetch();
              refetchMetadata();
            }
          }}
          submitExpenseTo={accountSlug}
        />
      )}
    </React.Fragment>
  );
};

export default PaymentRequests;
