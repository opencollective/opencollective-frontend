import React from 'react';
import { useQuery } from '@apollo/client';
import { omit } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { PREVIEW_FEATURE_KEYS } from '../../../../lib/preview-features';
import type { FilterComponentConfigs } from '@/lib/filters/filter-types';
import { ExpenseType } from '@/lib/graphql/types/v2/schema';
import { i18nExpenseType } from '@/lib/i18n/expense';
import { sortSelectOptions } from '@/lib/utils';

import ExpensesList from '../../../expenses/ExpensesList';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { SubmitExpenseFlow } from '../../../submit-expense/SubmitExpenseFlow';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';

import type { FilterMeta as CommonFilterMeta, FilterValues } from './filters';
import { filters as commonFilters, schema, toVariables } from './filters';
import { accountExpensesQuery } from './queries';

const ROUTE_PARAMS = ['slug', 'section', 'subpath'];

type FilterMeta = CommonFilterMeta & { omitExpenseTypesInFilter: ExpenseType[] };

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...commonFilters,
  type: {
    labelMsg: defineMessage({ id: 'expense.type', defaultMessage: 'Type' }),
    Component: ({ meta, valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(omit(ExpenseType, [ExpenseType.FUNDING_REQUEST, ...meta.omitExpenseTypesInFilter]))
          .map(value => ({ label: valueRenderer({ value, intl }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nExpenseType(intl, value),
  },
};

const SubmittedExpenses = ({ accountSlug }: DashboardSectionProps) => {
  const router = useRouter();
  const [isExpenseFlowOpen, setIsExpenseFlowOpen] = React.useState(false);
  const [duplicateExpenseId, setDuplicateExpenseId] = React.useState(null);
  const { LoggedInUser } = useLoggedInUser();

  const hasGrantAndFundsReorgEnabled = LoggedInUser?.hasPreviewFeatureEnabled(
    PREVIEW_FEATURE_KEYS.GRANT_AND_FUNDS_REORG,
  );

  const omitExpenseTypesInFilter = hasGrantAndFundsReorgEnabled ? [ExpenseType.GRANT] : [];

  const queryFilter = useQueryFilter<typeof schema, { type: ExpenseType }>({
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
    ...(!queryFilter.variables.type
      ? { types: Object.values(ExpenseType).filter(v => !omitExpenseTypesInFilter.includes(v)) }
      : {}),
  };

  const {
    data,
    loading,
    error,
    refetch: refetchExpenses,
  } = useQuery(accountExpensesQuery, {
    variables,
    context: API_V2_CONTEXT,
  });

  const filterMeta: FilterMeta = {
    currency: data?.account?.currency,
    omitExpenseTypesInFilter,
  };

  const hasNewSubmitExpenseFlow =
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW) || router.query.newExpenseFlowEnabled;

  const pageRoute = `/dashboard/${accountSlug}/submitted-expenses`;

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <React.Fragment>
      <div className="flex max-w-(--breakpoint-lg) flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage defaultMessage="Submitted Expenses" id="NpGb+x" />}
          description={
            <FormattedMessage defaultMessage="Expenses that you have submitted to other Collectives." id="aKfm6V" />
          }
          actions={
            hasNewSubmitExpenseFlow ? (
              <Button
                onClick={() => {
                  setDuplicateExpenseId(null);
                  setIsExpenseFlowOpen(true);
                }}
                size="sm"
                className="gap-1"
              >
                <FormattedMessage defaultMessage="New expense" id="pNn/g+" />
              </Button>
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
              view={'submitter-new'}
              useDrawer
              openExpenseLegacyId={Number(router.query.openExpenseId)}
              expenseFieldForTotalAmount="amountInCreatedByAccountCurrency"
              onDuplicateClick={expenseId => {
                setDuplicateExpenseId(expenseId);
                setIsExpenseFlowOpen(true);
              }}
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
            setDuplicateExpenseId(null);
            setIsExpenseFlowOpen(false);
            if (submittedExpense) {
              refetchExpenses();
            }
          }}
          expenseId={duplicateExpenseId}
          duplicateExpense={!!duplicateExpenseId}
        />
      )}
    </React.Fragment>
  );
};

export default SubmittedExpenses;
