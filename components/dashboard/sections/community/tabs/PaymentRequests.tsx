import React, { useContext, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { get, omit } from 'lodash-es';
import type { IntlShape } from 'react-intl';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../../../lib/filters/filter-types';
import type {
  Account,
  AccountHoverCardFieldsFragment,
  CommunityAccountDetailQuery,
  Expense,
  Host,
  HostDashboardExpensesQuery,
  HostDashboardExpensesQueryVariables,
} from '../../../../../lib/graphql/types/v2/graphql';
import { ExpenseStatusFilter } from '../../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../../lib/hooks/useQueryFilter';
import formatCollectiveType from '../../../../../lib/i18n/collective-type';
import i18nPayoutMethodType from '../../../../../lib/i18n/payout-method-type';
import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { limit } from '@/lib/filters/schemas';
import { gql } from '@/lib/graphql/helpers';
import { i18nExpenseType } from '@/lib/i18n/expense';

import { ExpenseAccountingCategoryPill } from '@/components/expenses/ExpenseAccountingCategoryPill';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';

import Avatar from '../../../../Avatar';
import DateTime from '../../../../DateTime';
import {
  expenseHostFields,
  expensesListAdminFieldsFragment,
  expensesListFieldsFragment,
} from '../../../../expenses/graphql/fragments';
import FormattedMoneyAmount from '../../../../FormattedMoneyAmount';
import LinkCollective from '../../../../LinkCollective';
import MessageBoxGraphqlError from '../../../../MessageBoxGraphqlError';
import { ColumnHeader } from '../../../../table/ColumnHeader';
import { actionsColumn, DataTable } from '../../../../table/DataTable';
import { DashboardContext } from '../../../DashboardContext';
import { EmptyResults } from '../../../EmptyResults';
import { expenseKYCStatusFilter } from '../../../filters/ExpenseKYCStatusFilter';
import { Filterbar } from '../../../filters/Filterbar';
import { Pagination } from '../../../filters/Pagination';
import { useExpenseActions } from '../../expenses/actions';
import type { FilterMeta as CommonFilterMeta } from '../../expenses/filters';
import {
  ExpenseAccountingCategoryKinds,
  filters as commonFilters,
  schema as commonSchema,
  toVariables as commonToVariables,
} from '../../expenses/filters';

type HostExpensesQueryNode = NonNullable<HostDashboardExpensesQuery['expenses']['nodes']>[number];

const columnHelper = createColumnHelper<HostExpensesQueryNode>();

function getExpenseColumns(
  intl: IntlShape,
  host: HostDashboardExpensesQuery['host'],
): ColumnDef<HostExpensesQueryNode, unknown>[] {
  return [
    columnHelper.accessor('createdAt', {
      meta: { className: 'max-w-32', labelMsg: defineMessage({ defaultMessage: 'Date Submitted', id: 'jS+tfC' }) },
      header: ctx => <ColumnHeader {...ctx} filterKey="date" />,
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        return <DateTime className="whitespace-nowrap" dateStyle="medium" value={createdAt} />;
      },
    }),
    columnHelper.accessor('account', {
      meta: {
        className: 'max-w-10 xl:max-w-48',
        labelMsg: defineMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
      },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        const account = expense.account;
        return (
          <div className="max-w-fit">
            <LinkCollective
              collective={account}
              withHoverCard
              className="flex items-center gap-2 hover:no-underline"
              onClick={e => e.preventDefault()}
            >
              <Avatar size={24} collective={account} />
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-medium">{account.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatCollectiveType(intl, account.type)}
                </span>
              </div>
            </LinkCollective>
          </div>
        );
      },
    }),
    columnHelper.accessor('type', {
      meta: { className: 'max-w-24', labelMsg: defineMessage({ defaultMessage: 'Type', id: '+U6ozc' }) },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        return (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate">{i18nExpenseType(intl, expense.type)}</span>
            <span className="text-xs text-muted-foreground">#{expense.legacyId}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('description', {
      meta: { className: 'max-w-64 flex-1', labelMsg: defineMessage({ defaultMessage: 'Title', id: 'Title' }) },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        const submittedBy = expense.createdByAccount;
        return (
          <div className="flex flex-col">
            <span className="truncate font-medium">{expense.description}</span>
            <div className="flex items-center gap-1 overflow-hidden text-xs whitespace-nowrap text-muted-foreground">
              <FormattedMessage
                defaultMessage="Submitted by {submittedByAccount}"
                id="HJQNkj"
                values={{
                  date: <DateTime dateStyle="medium" value={expense.createdAt} />,
                  submittedByAccount: (
                    <LinkCollective
                      collective={submittedBy}
                      withHoverCard
                      className=""
                      onClick={e => e.preventDefault()}
                    >
                      <Avatar size={14} collective={submittedBy} />
                    </LinkCollective>
                  ),
                }}
              />
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('accountingCategory', {
      meta: {
        className: 'hidden lg:table-cell max-w-32',
        labelMsg: defineMessage({ defaultMessage: 'Accounting category', id: 'AddFundsModal.accountingCategory' }),
      },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        return (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div onClick={e => e.stopPropagation()} className="overflow-hidden">
            <ExpenseAccountingCategoryPill
              expense={expense as Expense}
              host={host as unknown as Host}
              account={expense.account as Account}
              canEdit={
                host !== undefined &&
                host !== null &&
                isFeatureEnabled(host, 'CHART_OF_ACCOUNTS') &&
                get(expense, 'permissions.canEditAccountingCategory', false)
              }
              editPermission={get(expense, 'permissions.editAccountingCategory')}
              allowNone
              showCodeInSelect={true}
            />
          </div>
        );
      },
    }),
    columnHelper.accessor('payee', {
      meta: {
        className: 'hidden lg:table-cell max-w-48',
        labelMsg: defineMessage({ defaultMessage: 'Payee', id: 'SecurityScope.Payee' }),
      },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        const payee = expense.payee;
        return (
          <div className="max-w-fit">
            <LinkCollective
              collective={payee}
              withHoverCard
              className="hover:no-underline"
              onClick={e => e.preventDefault()}
            >
              <div className="flex items-center gap-2">
                <Avatar size={24} collective={payee} />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium">{payee.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {intl ? formatCollectiveType(intl, payee.type) : payee.type}
                  </span>
                </div>
              </div>
            </LinkCollective>
          </div>
        );
      },
    }),
    columnHelper.accessor('status', {
      meta: { className: 'max-w-32', labelMsg: defineMessage({ defaultMessage: 'Status', id: 'tzMNF3' }) },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const status = cell.getValue();
        return (
          <div>
            <ExpenseStatusTag status={status} />
          </div>
        );
      },
    }),
    columnHelper.accessor('amount', {
      meta: {
        className: 'min-w-32 text-right',
        labelMsg: defineMessage({ defaultMessage: 'Amount', id: 'Fields.amount' }),
        align: 'right',
      },
      header: ctx => <ColumnHeader {...ctx} />,
      cell: ({ cell }) => {
        const expense = cell.row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              <FormattedMoneyAmount amount={Math.abs(expense.amount)} currency={expense.currency} />
            </span>
            <span className="text-xs text-muted-foreground">
              {i18nPayoutMethodType(intl, expense.payoutMethod?.type)}
            </span>
          </div>
        );
      },
    }),
    actionsColumn,
  ];
}

// Scoped variant of the host-wide `hostDashboardExpensesQuery`: the expenses are
// pinned to the account the detail view is showing (and its children), so the
// `hostContext`/`account` filters of the All Payment Requests dashboard are gone.
const accountPaymentRequestsQuery = gql`
  query AccountPaymentRequests(
    $hostSlug: String!
    $account: AccountReferenceInput!
    $includeChildrenExpenses: Boolean
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $types: [ExpenseType]
    $tags: [String]
    $status: [ExpenseStatusFilter]
    $amount: AmountRangeInput
    $payoutMethod: PayoutMethodReferenceInput
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $sort: ChronologicalOrderInput
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
    $fromAccounts: [AccountReferenceInput]
    $lastCommentBy: [LastCommentBy]
    $accountingCategory: [String]
    $fetchGrantHistory: Boolean!
    $kycStatus: ExpenseKYCStatusFilter
    $approvedByAccount: AccountReferenceInput
    $paidByAccount: AccountReferenceInput
    $rejectedByAccount: AccountReferenceInput
  ) {
    expenses(
      host: { slug: $hostSlug }
      account: $account
      includeChildrenExpenses: $includeChildrenExpenses
      limit: $limit
      offset: $offset
      type: $type
      types: $types
      tag: $tags
      status: $status
      amount: $amount
      payoutMethod: $payoutMethod
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $sort
      chargeHasReceipts: $chargeHasReceipts
      virtualCards: $virtualCards
      fromAccounts: $fromAccounts
      lastCommentBy: $lastCommentBy
      accountingCategory: $accountingCategory
      kycStatus: $kycStatus
      approvedByAccount: $approvedByAccount
      paidByAccount: $paidByAccount
      rejectedByAccount: $rejectedByAccount
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        ...ExpensesListFieldsFragment
        ...ExpensesListAdminFieldsFragment

        payee {
          grantHistory: expenses(status: PAID, type: GRANT, direction: SUBMITTED, limit: 1, account: $account)
            @include(if: $fetchGrantHistory) {
            totalAmount {
              amount {
                currency
                valueInCents
              }
            }
            totalCount
          }
        }
      }
    }
    host(slug: $hostSlug) {
      id
      ...ExpenseHostFields
    }
  }
  ${expensesListFieldsFragment}
  ${expensesListAdminFieldsFragment}
  ${expenseHostFields}
`;

// Account-scoped counterpart of `hostPaymentRequestsMetadataQuery`, so the view
// counts match the list above (including the account's children).
const accountPaymentRequestsMetadataQuery = gql`
  query AccountPaymentRequestsMetadata(
    $hostSlug: String!
    $account: AccountReferenceInput!
    $includeChildrenExpenses: Boolean
  ) {
    all: expenses(host: { slug: $hostSlug }, account: $account, includeChildrenExpenses: $includeChildrenExpenses) {
      totalCount
    }
    pending: expenses(
      host: { slug: $hostSlug }
      account: $account
      includeChildrenExpenses: $includeChildrenExpenses
      status: [PENDING, UNVERIFIED]
    ) {
      totalCount
    }
    approved: expenses(
      host: { slug: $hostSlug }
      account: $account
      includeChildrenExpenses: $includeChildrenExpenses
      status: [APPROVED]
    ) {
      totalCount
    }
    rejected: expenses(
      host: { slug: $hostSlug }
      account: $account
      includeChildrenExpenses: $includeChildrenExpenses
      status: [REJECTED]
    ) {
      totalCount
    }
    paid: expenses(
      host: { slug: $hostSlug }
      account: $account
      includeChildrenExpenses: $includeChildrenExpenses
      status: [PAID]
    ) {
      totalCount
    }
  }
`;

const filterSchema = commonSchema.extend({
  limit: limit.default(20),
  kycStatus: expenseKYCStatusFilter.schema,
});

type FilterValues = z.infer<typeof filterSchema>;

type FilterMeta = CommonFilterMeta & {
  hostSlug: string;
  hostedAccounts?: Array<AccountHoverCardFieldsFragment>;
  expenseTags?: string[];
  includeUncategorized?: boolean;
  hideExpensesMetaStatuses: boolean;
};

const toVariables: FiltersToVariables<FilterValues, HostDashboardExpensesQueryVariables, FilterMeta> = {
  ...commonToVariables,
  kycStatus: expenseKYCStatusFilter.toVariables,
};

const filters: FilterComponentConfigs<FilterValues, FilterMeta> = {
  ...commonFilters,
  kycStatus: expenseKYCStatusFilter.filter,
};

type PaymentRequestsProps = {
  account: CommunityAccountDetailQuery['account'];
  hostSlug: string;
  onOpenExpense: (legacyId: number | null) => void;
};

export function PaymentRequests({ account, hostSlug, onOpenExpense }: PaymentRequestsProps) {
  const intl = useIntl();
  const { account: dashboardAccount } = useContext(DashboardContext);

  const views: Views<FilterValues> = useMemo(
    () => [
      {
        id: 'all',
        label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
        filter: {},
      },
      {
        id: 'pending',
        label: intl.formatMessage({ id: 'expense.pending', defaultMessage: 'Pending' }),
        filter: { status: [ExpenseStatusFilter.PENDING] },
      },
      {
        id: 'approved',
        label: intl.formatMessage({ id: 'expense.approved', defaultMessage: 'Approved' }),
        filter: { status: [ExpenseStatusFilter.APPROVED] },
      },
      {
        id: 'rejected',
        label: intl.formatMessage({ defaultMessage: 'Rejected', id: '5qaD7s' }),
        filter: { status: [ExpenseStatusFilter.REJECTED] },
      },
      {
        id: 'paid',
        label: intl.formatMessage({ defaultMessage: 'Paid', id: 'u/vOPu' }),
        filter: { status: [ExpenseStatusFilter.PAID] },
      },
    ],
    [intl],
  );

  const hasKycFeature = isFeatureEnabled(dashboardAccount, FEATURES.KYC);

  const effectiveFilters = useMemo(() => {
    return hasKycFeature ? filters : omit(filters, 'kycStatus');
  }, [hasKycFeature]);

  const effectiveSchema = useMemo(() => {
    return hasKycFeature ? filterSchema : filterSchema.omit({ kycStatus: true });
  }, [hasKycFeature]);

  const queryFilter = useQueryFilter({
    schema: effectiveSchema,
    toVariables,
    filters: effectiveFilters,
    meta: {
      currency: dashboardAccount.currency,
      hostSlug,
      includeUncategorized: true,
      accountingCategoryKinds: ExpenseAccountingCategoryKinds,
      hideExpensesMetaStatuses: true,
    },
    views,
    skipRouter: true,
  });

  const scopedVariables = {
    hostSlug,
    account: { id: account?.id },
    includeChildrenExpenses: true,
    fetchGrantHistory: false,
  };

  const { data, error, loading, refetch } = useQuery(accountPaymentRequestsQuery, {
    variables: {
      ...scopedVariables,
      ...queryFilter.variables,
    },
    skip: !account?.id || !hostSlug,
    // Revalidate on mount so newly submitted expenses appear without a manual refresh
    fetchPolicy: 'cache-and-network',
  });

  const { data: metaData, refetch: refetchMetadata } = useQuery(accountPaymentRequestsMetadataQuery, {
    variables: scopedVariables,
    skip: !account?.id || !hostSlug,
    fetchPolicy: 'cache-and-network',
  });

  const viewsWithCount: Views<FilterValues> = useMemo(
    () =>
      views.map(view => ({
        ...view,
        count: metaData?.[view.id]?.totalCount,
      })),
    [views, metaData],
  );

  const getExpenseActions = useExpenseActions({
    refetchList: () => {
      void refetch();
      void refetchMetadata();
    },
    host: data?.host,
  });

  const expenseColumns = useMemo(() => getExpenseColumns(intl, data?.host), [data?.host, intl]);

  return (
    <div className="flex flex-col gap-4">
      <Filterbar {...queryFilter} views={viewsWithCount} />

      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && !data?.expenses?.nodes?.length ? (
        <EmptyResults
          entityType="EXPENSES"
          onResetFilters={() => queryFilter.resetFilters({})}
          hasFilters={queryFilter.hasFilters}
        />
      ) : (
        <React.Fragment>
          <DataTable
            mobileTableView
            data={data?.expenses?.nodes ?? []}
            columns={expenseColumns}
            onClickRow={row => onOpenExpense(row.original.legacyId)}
            getRowId={row => String(row.legacyId)}
            queryFilter={queryFilter}
            loading={loading && !data}
            getActions={getExpenseActions}
            nbPlaceholders={queryFilter.values.limit}
          />
          <Pagination queryFilter={queryFilter} total={data?.expenses?.totalCount} />
        </React.Fragment>
      )}
    </div>
  );
}
