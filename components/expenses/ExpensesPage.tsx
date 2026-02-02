import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { omit, pick } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import type { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables } from '@/lib/filters/filter-types';
import type { ExpensesPageQuery, HostDashboardExpensesQueryVariables } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import useQueryFilter from '@/lib/hooks/useQueryFilter';

import { accountNavbarFieldsFragment } from '@/components/collective-navbar/fragments';
import { expenseTagFilter } from '@/components/dashboard/filters/ExpenseTagsFilter';
import { Pagination } from '@/components/dashboard/filters/Pagination';
import type { FilterMeta as CommonFilterMeta } from '@/components/dashboard/sections/expenses/filters';
import {
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from '@/components/dashboard/sections/expenses/filters';
import { expenseHostFields, expensesListFieldsFragment } from '@/components/expenses/graphql/fragments';

import { Filterbar } from '../dashboard/filters/Filterbar';
import ScheduledExpensesBanner from '../dashboard/sections/expenses/ScheduledExpensesBanner';
import Link from '../Link';
import MessageBox from '../MessageBox';
import Tags from '../Tags';
import { H5 } from '../Text';

import { EXPENSE_DIRECTION, expenseDirectionFilter } from './filters/DirectionFilter';
import ExpenseInfoSidebar from './ExpenseInfoSidebar';
import ExpensesList from './ExpensesList';

export const expensesPageQuery = gql`
  query ExpensesPage(
    $account: AccountReferenceInput
    $accountSlug: String
    $fromAccount: AccountReferenceInput
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $tags: [String]
    $status: [ExpenseStatusFilter]
    $amount: AmountRangeInput
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $sort: ChronologicalOrderInput
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
  ) {
    account(slug: $accountSlug) {
      id
      legacyId
      slug
      type
      imageUrl
      backgroundImageUrl
      twitterHandle
      name
      currency
      isArchived
      isActive
      settings
      createdAt
      supportedExpenseTypes
      expensesTags {
        id
        tag
      }
      features {
        id
        ...NavbarFields
      }

      stats {
        id
        balance {
          valueInCents
          currency
        }
        balanceWithBlockedFunds: balance(withBlockedFunds: true) {
          valueInCents
          currency
        }
      }

      ... on AccountWithHost {
        isApproved
        host {
          id
          ...ExpenseHostFields
        }
      }

      ... on AccountWithParent {
        parent {
          id
          slug
          imageUrl
          backgroundImageUrl
          twitterHandle
        }
      }

      ... on Organization {
        # We add that for hasFeature
        isHost
        isActive
        host {
          id
          ...ExpenseHostFields
        }
      }

      ... on Event {
        parent {
          id
          name
          slug
          type
        }
      }

      ... on Project {
        parent {
          id
          name
          slug
          type
        }
      }
    }
    expenses(
      account: $account
      fromAccount: $fromAccount
      limit: $limit
      offset: $offset
      type: $type
      tag: $tags
      status: $status
      amount: $amount
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $sort
      chargeHasReceipts: $chargeHasReceipts
      virtualCards: $virtualCards
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        ...ExpensesListFieldsFragment
      }
    }
    # limit: 1 as current best practice to avoid the API fetching entries it doesn't need
    # TODO: We don't need to try and fetch this field on non-host accounts (should use a ... on Host)
    scheduledExpenses: expenses(
      host: $account
      status: SCHEDULED_FOR_PAYMENT
      payoutMethodType: BANK_ACCOUNT
      limit: 1
    ) {
      totalCount
    }
  }

  ${expensesListFieldsFragment}
  ${accountNavbarFieldsFragment}
  ${expenseHostFields}
`;

export const schema = commonSchema.extend({ direction: expenseDirectionFilter.schema });

type FilterValues = z.infer<typeof schema>;

type FilterMeta = CommonFilterMeta & {
  expenseTags?: string[];
  includeUncategorized?: boolean;
  accountSlug: string;
};

export const toVariables: FiltersToVariables<FilterValues, HostDashboardExpensesQueryVariables, FilterMeta> = {
  ...commonToVariables,
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...pick(commonFilters, ['searchTerm']),
  direction: expenseDirectionFilter.filter,
  ...omit(commonFilters, ['searchTerm', 'status']),
  status: { ...commonFilters.status, static: false } as typeof commonFilters.status,
  tag: expenseTagFilter.filter,
};

type ExpensesProps = {
  account: ExpensesPageQuery['account'];
  expenses: ExpensesPageQuery['expenses'];
  direction: EXPENSE_DIRECTION;
};

const Expenses = ({ account, expenses: _expenses, direction }: ExpensesProps) => {
  const router = useRouter();
  const isSubmitted = direction === EXPENSE_DIRECTION.SUBMITTED;
  const { LoggedInUser } = useLoggedInUser();
  const meta: FilterMeta = {
    currency: account?.currency,
    accountSlug: account?.slug,
  };

  const queryFilter = useQueryFilter({
    schema,
    toVariables,
    filters: isSubmitted ? omit(filters, ['direction']) : filters,
    defaultFilterValues: { direction: direction || EXPENSE_DIRECTION.RECEIVED },
    meta,
    shallow: true,
  });

  const variables = {
    ...{
      [queryFilter.values.direction === EXPENSE_DIRECTION.RECEIVED ? 'account' : 'fromAccount']: {
        legacyId: account?.legacyId,
      },
    },
    accountSlug: account?.slug,
    ...queryFilter.variables,
  };

  const { data, loading, refetch } = useQuery(expensesPageQuery, {
    variables,
  });

  React.useEffect(() => {
    if (LoggedInUser) {
      refetch();
    }
  }, [LoggedInUser, refetch]);

  const isSelfHosted = account && 'host' in account && account.id === account.host?.id;
  const expenses = data?.expenses || _expenses;

  return (
    <React.Fragment>
      <React.Fragment>
        <h1 className={'mb-6 text-[32px] leading-10'}>
          {isSubmitted ? (
            <FormattedMessage defaultMessage="Submitted Expenses" id="NpGb+x" />
          ) : (
            <FormattedMessage id="Expenses" defaultMessage="Expenses" />
          )}
        </h1>
      </React.Fragment>
      {isSelfHosted && LoggedInUser?.isHostAdmin(account) && data?.scheduledExpenses?.totalCount > 0 && (
        <ScheduledExpensesBanner hostSlug={account.slug} />
      )}
      <div className="mx-5 flex flex-col justify-between gap-16 lg:mx-0 lg:flex-row">
        <div className="w-full">
          <Filterbar hideSeparator className="mb-4" {...queryFilter} />
          {!loading && !data?.expenses?.nodes.length ? (
            <MessageBox type="info" withIcon data-cy="zero-expense-message">
              {queryFilter.hasFilters ? (
                <FormattedMessage
                  id="ExpensesList.Empty"
                  defaultMessage="No expense matches the given filters, <ResetLink>reset them</ResetLink> to see all expenses."
                  values={{
                    ResetLink: text => (
                      <Link data-cy="reset-expenses-filters" href={`/${account.slug}/expenses`}>
                        <span>{text}</span>
                      </Link>
                    ),
                  }}
                />
              ) : (
                <FormattedMessage id="expenses.empty" defaultMessage="No expenses" />
              )}
            </MessageBox>
          ) : (
            <div className="flex flex-col gap-4">
              <ExpensesList
                isLoading={loading}
                collective={data?.account}
                host={data?.account?.host ?? (data?.account?.isHost ? data?.account : null)}
                expenses={expenses?.nodes}
                nbPlaceholders={queryFilter.values.limit}
                isInverted={direction === 'SUBMITTED'}
                view={direction === 'SUBMITTED' ? 'submitter' : undefined}
                useDrawer={false}
                openExpenseLegacyId={Number(router.query.openExpenseId)}
              />

              <Pagination queryFilter={queryFilter} total={data?.expenses?.totalCount} />
            </div>
          )}
        </div>
        {!isSubmitted && (
          <div className="min-w-64 lg:max-w-72">
            <ExpenseInfoSidebar isLoading={loading} collective={data?.account} host={data?.account?.host}>
              {data?.account?.expensesTags.length > 0 && (
                <React.Fragment>
                  <H5 mb={3}>
                    <FormattedMessage id="Tags" defaultMessage="Tags" />
                  </H5>
                  <div className="!text-sm">
                    <Tags
                      expense={{
                        tags: data?.account?.expensesTags.map(({ tag }) => tag),
                      }}
                      limit={30}
                      data-cy="expense-tags-title"
                      showUntagged
                    >
                      {({ key, tag, renderedTag }) => (
                        <button key={key} onClick={() => queryFilter.setFilter('tag', tag)} data-cy="expense-tags-link">
                          {renderedTag}
                        </button>
                      )}
                    </Tags>
                  </div>
                </React.Fragment>
              )}
            </ExpenseInfoSidebar>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default Expenses;
