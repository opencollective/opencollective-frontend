import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ceil, floor, omit, pick } from 'lodash';
import { ArrowLeft, ArrowRight, Ban, ExternalLink, Save } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import type { Account, Host, TransactionsImport, TransactionsImportRow } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { updateTransactionsImportRows } from './lib/graphql';
import { getMatchInfo } from './lib/match';
import type { FilterComponentConfigs, FiltersToVariables } from '@/lib/filters/filter-types';
import type {
  FindExpenseMatchForOffPlatformCreditQuery,
  FindExpenseMatchForOffPlatformCreditQueryVariables,
  FindOrderMatchForOffPlatformCreditQuery,
  FindOrderMatchForOffPlatformCreditQueryVariables,
  TransactionsImportStats,
} from '@/lib/graphql/types/v2/graphql';
import { ExpenseStatusFilter, OrderStatus, TransactionsImportRowAction } from '@/lib/graphql/types/v2/graphql';

import {
  confirmContributionFieldsFragment,
  ConfirmContributionForm,
} from '@/components/contributions/ConfirmContributionForm';
import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import Image from '@/components/Image';
import OrderStatusTag from '@/components/orders/OrderStatusTag';
import { DataList, DataListItem } from '@/components/ui/DataList';

import { accountHoverCardFields } from '../../../AccountHoverCard';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import type { BaseModalProps } from '../../../ModalContext';
import { useModal } from '../../../ModalContext';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogHeader } from '../../../ui/Dialog';
import { useToast } from '../../../ui/useToast';
import { AmountFilterType } from '../../filters/AmountFilter/schema';
import { Filterbar } from '../../filters/Filterbar';
import type { HostedAccountFilterMeta } from '../../filters/HostedAccountFilter';
import { hostedAccountsFilter } from '../../filters/HostedAccountFilter';
import * as contributionsFilters from '../contributions/filters';
import * as ExpenseFilters from '../expenses/filters';
import { HostCreateExpenseModal } from '../expenses/HostCreateExpenseModal';

import { ImportedTransactionDataList } from './ImportedTransactionDataList';
import { MatchBadge } from './MatchBadge';
import { SuggestedContributionsTable } from './SuggestedContributionsTable';
import { SuggestedExpensesTable } from './SuggestedExpensesTable';

const NB_EXPENSES_DISPLAYED = 5;

enum TabType {
  EXPECTED_FUNDS = 'Expected funds',
  CONTRIBUTIONS = 'Contributions',
  EXPENSES = 'Expenses',
}

type FiltersMeta = ExpenseFilters.FilterMeta & HostedAccountFilterMeta;

/**
 * Returns a value range filter that matches the given value.
 * The precision is calculated on -/+20% of the original amount, then rounded based on the number
 * of decimals in the value: 123 would be rounded to -2 (=100), 123456 would be rounded to -5 (=100000).
 */
const getAmountRangeFilter = (valueInCents: number) => {
  const precision = Math.min(1 - Math.floor(Math.log10(Math.abs(valueInCents))), -2);
  return {
    type: AmountFilterType.IS_BETWEEN,
    gte: floor(Math.abs(valueInCents) * 0.8, precision),
    lte: ceil(Math.abs(valueInCents) * 1.2, precision),
  };
};

const findExpenseMatchForOffPlatformCreditQuery = gql`
  query FindExpenseMatchForOffPlatformCredit(
    $hostId: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $status: [ExpenseStatusFilter]
    $amount: AmountRangeInput
    $dateFrom: DateTime
    $dateTo: DateTime
    $payoutMethodType: PayoutMethodType
    $account: [AccountReferenceInput!]
    $sort: ChronologicalOrderInput
    $type: ExpenseType
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
    $lastCommentBy: [LastCommentBy]
    $accountingCategory: [String]
  ) {
    expenses(
      fromAccount: { id: $hostId }
      status: $status
      dateFrom: $dateFrom
      dateTo: $dateTo
      amount: $amount
      searchTerm: $searchTerm
      offset: $offset
      limit: $limit
      payoutMethodType: $payoutMethodType
      fromAccounts: $account
      includeChildrenExpenses: true
      orderBy: $sort
      type: $type
      chargeHasReceipts: $chargeHasReceipts
      virtualCards: $virtualCards
      lastCommentBy: $lastCommentBy
      accountingCategory: $accountingCategory
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        legacyId
        amountV2 {
          value
          valueInCents
          currency
        }
        status
        description
        createdAt
        incurredAt
        payoutMethod {
          id
          type
        }
        items {
          id
          description
          amountV2 {
            valueInCents
            currency
          }
        }
        payee {
          id
          name
          slug
          type
          imageUrl
          ...AccountHoverCardFields
        }
        account {
          id
          slug
          name
          type
          imageUrl
          ...AccountHoverCardFields
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

const findOrderMatchForOffPlatformCreditQuery = gql`
  query FindOrderMatchForOffPlatformCredit(
    $hostId: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $status: [OrderStatus!]
    $amount: AmountRangeInput
    $dateFrom: DateTime
    $dateTo: DateTime
    $account: [AccountReferenceInput!]
    $orderBy: ChronologicalOrderInput
  ) {
    account(slug: $hostId) {
      id
      orders(
        status: $status
        dateFrom: $dateFrom
        dateTo: $dateTo
        amount: $amount
        searchTerm: $searchTerm
        offset: $offset
        limit: $limit
        hostedAccounts: $account
        includeChildrenAccounts: true
        includeHostedAccounts: true
        filter: INCOMING
        orderBy: $orderBy
      ) {
        totalCount
        offset
        limit
        nodes {
          id
          legacyId
          status
          description
          createdAt
          processedAt
          paymentMethod {
            id
            service
            type
          }
          fromAccount {
            id
            name
            slug
            type
            imageUrl
            ...AccountHoverCardFields
          }
          toAccount {
            id
            slug
            name
            type
            imageUrl
            ...AccountHoverCardFields
          }
          ...ConfirmContributionFields
        }
      }
    }
  }
  ${accountHoverCardFields}
  ${confirmContributionFieldsFragment}
`;

const getDefaultFilterValues = (
  row: TransactionsImportRow,
  accounts: Pick<Account, 'slug'>[],
  activeViewId: TabType,
  host: Pick<Host, 'currency'>,
) => {
  const filters = {
    amount: { ...getAmountRangeFilter(row.amount.valueInCents), currency: host.currency },
    account: accounts?.map(account => account.slug),
  };

  if (activeViewId === TabType.CONTRIBUTIONS) {
    filters['status'] = Object.values(
      omit(OrderStatus, [
        OrderStatus.PENDING,
        OrderStatus.EXPIRED,
        OrderStatus.NEW,
        OrderStatus.PROCESSING,
        OrderStatus.REQUIRE_CLIENT_CONFIRMATION,
      ]),
    );
  } else if (activeViewId === TabType.EXPECTED_FUNDS) {
    filters['status'] = [OrderStatus.PENDING];
  } else if (activeViewId === TabType.EXPENSES) {
    filters['status'] = [];
  }

  return filters;
};

const useMatchCreditDialogQueryFilter = (
  activeViewId: TabType,
  row: TransactionsImportRow,
  host: Pick<Host, 'id' | 'slug' | 'currency'>,
  accounts: Pick<Account, 'slug'>[],
) => {
  const intl = useIntl();
  const views = React.useMemo(
    () => [
      {
        id: TabType.EXPECTED_FUNDS,
        label: intl.formatMessage({ defaultMessage: 'Expected funds', id: 'expectedFunds' }),
        filter: {
          status: [OrderStatus.PENDING],
        },
      },
      {
        id: TabType.CONTRIBUTIONS,
        label: intl.formatMessage({ defaultMessage: 'Contributions', id: 'Contributions' }),
        filter: {
          status: [OrderStatus.PAID, OrderStatus.PENDING, OrderStatus.EXPIRED],
        },
      },
      {
        id: TabType.EXPENSES,
        label: intl.formatMessage({ defaultMessage: 'Expenses', id: 'Expenses' }),
        filter: {
          status: [ExpenseStatusFilter.PAID],
        },
      },
    ],
    [intl],
  );

  const defaultFilterValues = React.useMemo(
    () => getDefaultFilterValues(row, accounts, activeViewId, host),
    [row, accounts, activeViewId, host],
  );

  const queryFilterMeta = React.useMemo(() => {
    const meta = {
      currency: row.amount.currency,
      hostSlug: host.slug,
      hostedAccounts: accounts,
      disableHostedAccountsSearch: Boolean(accounts?.length),
      accountingCategoryKinds: ExpenseFilters.ExpenseAccountingCategoryKinds,
    };

    return meta;
  }, [row, host, accounts]);

  const { filters, toVariables, schema } = React.useMemo(() => {
    const commonSchemaOptions = {
      limit: integer.default(NB_EXPENSES_DISPLAYED),
      account: isMulti(z.string()).optional(),
    };

    let schema;
    const toVariables: FiltersToVariables<
      z.infer<typeof schema>,
      FindOrderMatchForOffPlatformCreditQueryVariables | FindExpenseMatchForOffPlatformCreditQueryVariables,
      FiltersMeta
    > = {
      account: hostedAccountsFilter.toVariables,
    };
    const filters: FilterComponentConfigs<z.infer<typeof schema>, FiltersMeta> = {};

    if (activeViewId === TabType.EXPENSES) {
      Object.assign(filters, omit(ExpenseFilters.filters, ['account']));
      Object.assign(toVariables, omit(ExpenseFilters.toVariables, ['account']));
      schema = ExpenseFilters.schema.extend(omit(commonSchemaOptions, ['account']));
    } else {
      Object.assign(filters, omit(contributionsFilters.filters, ['account']));
      Object.assign(toVariables, omit(contributionsFilters.toVariables, ['account']));
      filters.account = {
        ...hostedAccountsFilter.filter,
        getDisallowEmpty: ({ meta }) => Boolean(meta?.hostedAccounts?.length), // Disable clearing accounts if provided by the parent
      };
      schema = contributionsFilters.schema.extend(commonSchemaOptions);
    }

    return { filters, toVariables, schema };
  }, [activeViewId]);

  const queryFilter = useQueryFilter<
    typeof schema,
    FindExpenseMatchForOffPlatformCreditQueryVariables | FindOrderMatchForOffPlatformCreditQueryVariables
  >({
    schema,
    skipRouter: true,
    filters,
    meta: queryFilterMeta,
    defaultFilterValues,
    views: views,
    activeViewId,
    toVariables,
  });

  // Re-apply default filters after changing view
  React.useEffect(() => {
    queryFilter.resetFilters({
      ...getDefaultFilterValues(row, accounts, activeViewId, host),
      ...pick(queryFilter.values, ['account', 'amount', 'dateFrom', 'dateTo']),
    });
  }, [activeViewId]); // eslint-disable-line react-hooks/exhaustive-deps

  return queryFilter;
};

type ExpenseMatch = FindExpenseMatchForOffPlatformCreditQuery['expenses']['nodes'][number];
type ContributionMatch = FindOrderMatchForOffPlatformCreditQuery['account']['orders']['nodes'][number];

export const MatchCreditDialog = ({
  accounts,
  host,
  row,
  transactionsImport,
  setOpen,
  onCloseFocusRef,
  onAddFundsClick,
  ...props
}: {
  accounts: Pick<Account, 'slug'>[];
  host: Pick<Host, 'id'> & React.ComponentProps<typeof HostCreateExpenseModal>['host'];
  row: TransactionsImportRow;
  transactionsImport: Pick<TransactionsImport, 'id' | 'source' | 'csvConfig'>;
  onCloseFocusRef: React.MutableRefObject<HTMLElement>;
  onAddFundsClick: () => void;
} & BaseModalProps) => {
  const { toast } = useToast();
  const { showModal } = useModal();
  const [selectedExpense, setSelectedExpense] = React.useState<ExpenseMatch | null>(null);
  const [selectedContribution, setSelectedContribution] = React.useState<ContributionMatch | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const intl = useIntl();
  const [activeViewId, setActiveViewId] = React.useState(TabType.EXPECTED_FUNDS);
  const matchInfo = getMatchInfo(row, selectedExpense, selectedContribution);
  const [updateRows] = useMutation(updateTransactionsImportRows);
  const queryFilter = useMatchCreditDialogQueryFilter(activeViewId, row, host, accounts);
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Query for expenses
  const {
    data: expensesData,
    loading: expensesLoading,
    error: expensesError,
  } = useQuery(findExpenseMatchForOffPlatformCreditQuery, {
    variables: { ...queryFilter.variables, hostId: host.id },
    fetchPolicy: 'cache-and-network',
    skip: queryFilter.activeViewId !== TabType.EXPENSES,
  });

  // Query for contributions
  const {
    data: contributionsData,
    loading: contributionsLoading,
    error: contributionsError,
    client,
  } = useQuery(findOrderMatchForOffPlatformCreditQuery, {
    variables: { ...queryFilter.variables, hostId: host.slug },
    fetchPolicy: 'cache-and-network',
    skip: queryFilter.activeViewId === TabType.EXPENSES,
  });

  // Determine current data, loading and error states based on active content type
  const loading = queryFilter.activeViewId === TabType.EXPENSES ? expensesLoading : contributionsLoading;
  const error = queryFilter.activeViewId === TabType.EXPENSES ? expensesError : contributionsError;

  // When switching tab, clear selection
  React.useEffect(() => {
    setSelectedExpense(null);
    setSelectedContribution(null);
  }, [queryFilter.activeViewId]);

  React.useEffect(() => {
    if (props.open) {
      queryFilter.resetFilters(getDefaultFilterValues(row, accounts, activeViewId, host));
    }
  }, [props.open]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    if (isSubmitting) {
      return;
    } else {
      setIsConfirming(false);
      setSelectedExpense(null);
      setSelectedContribution(null);
      setActiveViewId(TabType.EXPECTED_FUNDS);
      queryFilter.resetFilters(getDefaultFilterValues(row, accounts, activeViewId, host));
      setOpen(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog {...props} onOpenChange={close}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <h2 className="text-xl font-bold">
            <FormattedMessage defaultMessage="Match Credit" id="matchCredit" />
          </h2>
        </DialogHeader>
        {isConfirming ? (
          <ConfirmContributionForm
            order={selectedContribution}
            onSubmit={() => setIsSubmitting(true)}
            onFailure={() => setIsSubmitting(false)}
            onSuccess={() => {
              // Update row
              client.cache.modify({
                id: client.cache.identify(row),
                fields: { order: () => selectedContribution },
              });

              // Update transactions import stats
              client.cache.modify({
                id: client.cache.identify(transactionsImport),
                fields: {
                  stats: (stats: TransactionsImportStats): TransactionsImportStats => {
                    return {
                      ...stats,
                      imported: stats.imported + 1,
                      processed: stats.processed + 1,
                      orders: stats.orders + 1,
                    };
                  },
                },
              });

              // Close modal
              close();
            }}
            initialValues={{
              amountReceived: row.amount.valueInCents,
              processedAt: row.date.split('T')[0],
              transactionsImportRow: row,
            }}
            footer={
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsConfirming(false)}>
                  <ArrowLeft size={16} className="mr-2" />
                  <FormattedMessage id="Back" defaultMessage="Back" />
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  <Save size={16} className="mr-2" />
                  <FormattedMessage id="save" defaultMessage="Save" />
                </Button>
              </div>
            }
          />
        ) : (
          <React.Fragment>
            <div className="mt-4">
              <Filterbar
                hideSeparator
                className="mb-5"
                {...queryFilter}
                primaryFilters={['searchTerm', 'sort', 'orderBy']} // Sort filter has a different name for contributions and expenses
                primaryFilterClassName="grid-cols-[8fr_2fr]"
                onViewChange={view => {
                  setActiveViewId(view.id as TabType);
                  queryFilter.resetFilters({
                    ...pick(queryFilter.values, ['account', 'amount', 'dateFrom', 'dateTo']),
                  });
                }}
                activeViewId={activeViewId}
                resetFilters={filter => {
                  queryFilter.resetFilters({
                    ...getDefaultFilterValues(row, accounts, activeViewId, host),
                    ...filter,
                    ...pick(queryFilter.values, ['account', 'amount', 'dateFrom', 'dateTo']),
                  });
                }}
              />
              {error ? (
                <MessageBoxGraphqlError error={error} />
              ) : queryFilter.activeViewId === TabType.EXPENSES ? (
                <SuggestedExpensesTable<ExpenseMatch>
                  loading={loading}
                  selectedExpense={selectedExpense}
                  setSelectedExpense={setSelectedExpense}
                  expenses={expensesData?.expenses?.nodes ?? []}
                  totalExpenses={expensesData?.expenses?.totalCount ?? 0}
                  queryFilter={queryFilter}
                  onCreateExpenseClick={() => {
                    setOpen(false);
                    showModal(
                      HostCreateExpenseModal,
                      { host, onCloseFocusRef, transactionsImport, transactionsImportRow: row },
                      'host-create-expense-modal',
                    );
                  }}
                />
              ) : (
                <SuggestedContributionsTable
                  loading={loading}
                  selectedContribution={selectedContribution}
                  setSelectedContribution={setSelectedContribution}
                  contributions={contributionsData?.account?.orders?.nodes ?? []}
                  totalContributions={contributionsData?.account?.orders?.totalCount ?? 0}
                  queryFilter={queryFilter}
                  onAddFundsClick={() => {
                    setOpen(false);
                    onAddFundsClick();
                  }}
                />
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 text-base font-semibold text-neutral-700">
                  <FormattedMessage defaultMessage="Imported data" id="tmfin0" />
                </div>
                <ImportedTransactionDataList
                  row={row}
                  transactionsImport={transactionsImport}
                  matchInfo={matchInfo}
                  collapsible
                />
              </div>
              {!(selectedExpense || selectedContribution) ? (
                <div className="flex flex-col rounded-lg border border-gray-200 p-4">
                  <div className="mb-3 grow-0 text-base font-semibold text-neutral-700">
                    <FormattedMessage defaultMessage="Selected: None" id="rTeNRu" />
                  </div>
                  <div className="flex grow flex-col items-center justify-center gap-4 rounded bg-slate-50 p-4 text-center">
                    <Image alt="" width={125} height={125} src="/static/images/no-results.png" />
                    <div>
                      <FormattedMessage
                        defaultMessage="Select an item from the table above to match it against the imported transaction or <Link>add funds</Link>."
                        id="6ez1/V"
                        values={{
                          Link: chunks => (
                            <Button
                              variant="link"
                              className="h-auto p-0 text-xs font-normal text-neutral-800 underline hover:text-neutral-600"
                              onClick={() => {
                                onAddFundsClick();
                              }}
                            >
                              {chunks}
                            </Button>
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 p-4 pt-2">
                  <div className="mt-[2px] mb-[2px] flex items-center justify-between">
                    <div className="text-base font-semibold text-neutral-700">
                      <FormattedMessage defaultMessage="Selected:" id="wQANAe" />{' '}
                      {selectedExpense ? (
                        <Link
                          href={`/${selectedExpense.account.slug}/expenses/${selectedExpense.legacyId}`}
                          className="text-sm underline"
                          openInNewTab
                        >
                          <FormattedMessage
                            defaultMessage="Expense #{id}"
                            id="E9pJQz"
                            values={{ id: selectedExpense.legacyId }}
                          />
                          &nbsp;
                          <ExternalLink size={14} className="inline" />
                        </Link>
                      ) : (
                        <Link
                          href={`/${selectedContribution.toAccount.slug}/incoming-contributions/${selectedContribution.legacyId}`}
                          className="text-sm underline"
                          openInNewTab
                        >
                          <FormattedMessage
                            defaultMessage="Contribution #{id}"
                            id="Siv4wU"
                            values={{ id: selectedContribution.legacyId }}
                          />
                          &nbsp;
                          <ExternalLink size={14} className="inline" />
                        </Link>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      className="text-slate-700 uppercase underline"
                      size="sm"
                      onClick={() => {
                        if (selectedExpense) {
                          setSelectedExpense(null);
                        }
                        if (selectedContribution) {
                          setSelectedContribution(null);
                        }
                      }}
                    >
                      <FormattedMessage defaultMessage="Clear" id="/GCoTA" />
                    </Button>
                  </div>

                  <DataList className="rounded bg-slate-50 p-4">
                    <DataListItem
                      label={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}
                      labelClassName="basis-1/3 min-w-auto max-w-auto"
                      value={
                        <MatchBadge hasMatch={matchInfo?.amount}>
                          <FormattedMoneyAmount
                            amount={
                              selectedExpense
                                ? selectedExpense?.amountV2.valueInCents
                                : selectedContribution?.totalAmount.valueInCents
                            }
                            currency={
                              selectedExpense
                                ? selectedExpense?.amountV2.currency
                                : selectedContribution?.totalAmount.currency
                            }
                          />
                        </MatchBadge>
                      }
                    />
                    <DataListItem
                      label={<FormattedMessage defaultMessage="Date" id="expense.incurredAt" />}
                      labelClassName="basis-1/3 min-w-auto max-w-auto"
                      value={
                        <MatchBadge hasMatch={matchInfo?.date}>
                          <DateTime
                            value={selectedExpense ? selectedExpense?.incurredAt : selectedContribution?.createdAt}
                          />
                        </MatchBadge>
                      }
                    />
                    {selectedExpense ? (
                      <React.Fragment>
                        <DataListItem
                          label={<FormattedMessage defaultMessage="Account" id="TwyMau" />}
                          value={
                            <LinkCollective
                              collective={selectedExpense.account}
                              className="flex items-center gap-2"
                              openInNewTab
                            >
                              {selectedExpense.account.name}
                            </LinkCollective>
                          }
                          itemClassName="truncate max-w-full"
                          labelClassName="basis-1/3 min-w-auto max-w-auto"
                        />
                        <DataListItem
                          label={<FormattedMessage defaultMessage="Payee" id="SecurityScope.Payee" />}
                          value={
                            <LinkCollective
                              collective={selectedExpense.payee}
                              className="flex items-center gap-2"
                              openInNewTab
                            >
                              {selectedExpense.payee.name}
                            </LinkCollective>
                          }
                          itemClassName="truncate max-w-full"
                          labelClassName="basis-1/3 min-w-auto max-w-auto"
                        />
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <DataListItem
                          label={<FormattedMessage defaultMessage="From" id="dM+p3/" />}
                          value={
                            <LinkCollective
                              collective={selectedContribution.fromAccount}
                              className="flex items-center gap-2"
                              openInNewTab
                            />
                          }
                          itemClassName="truncate max-w-full"
                          labelClassName="basis-1/3 min-w-auto max-w-auto"
                        />
                        <DataListItem
                          label={<FormattedMessage defaultMessage="To" id="To" />}
                          value={
                            <LinkCollective
                              collective={selectedContribution.toAccount}
                              className="flex items-center gap-2"
                              openInNewTab
                            />
                          }
                          itemClassName="truncate max-w-full"
                          labelClassName="basis-1/3 min-w-auto max-w-auto"
                        />
                      </React.Fragment>
                    )}
                    <DataListItem
                      label={<FormattedMessage defaultMessage="Status" id="tzMNF3" />}
                      itemClassName="truncate max-w-full"
                      labelClassName="basis-1/3 min-w-auto max-w-auto"
                      value={
                        selectedExpense ? (
                          <ExpenseStatusTag status={selectedExpense.status} />
                        ) : (
                          <OrderStatusTag status={selectedContribution.status} />
                        )
                      }
                    />
                    <DataListItem
                      label={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
                      value={selectedExpense?.description || selectedContribution?.description}
                      itemClassName="truncate max-w-full"
                      labelClassName="basis-1/3 min-w-auto max-w-auto"
                      showValueAsItemTitle
                    />
                  </DataList>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                <Ban size={16} className="mr-2" />
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </Button>
              {selectedContribution && selectedContribution.status === OrderStatus.PENDING ? (
                <Button disabled={!selectedContribution} onClick={() => setIsConfirming(true)}>
                  <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!selectedExpense && !selectedContribution}
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      if (queryFilter.activeViewId === TabType.EXPENSES && selectedExpense) {
                        await updateRows({
                          variables: {
                            action: TransactionsImportRowAction.UPDATE_ROWS,
                            rows: [{ id: row.id, expense: { id: selectedExpense.id } }],
                          },
                        });
                        toast({
                          variant: 'success',
                          message: intl.formatMessage({ defaultMessage: 'Expense linked', id: 'expense.linked' }),
                        });
                      } else if (
                        (queryFilter.activeViewId === TabType.CONTRIBUTIONS ||
                          queryFilter.activeViewId === TabType.EXPECTED_FUNDS) &&
                        selectedContribution
                      ) {
                        await updateRows({
                          variables: {
                            action: TransactionsImportRowAction.UPDATE_ROWS,
                            rows: [{ id: row.id, order: { id: selectedContribution.id } }],
                          },
                        });
                        toast({
                          variant: 'success',
                          message: intl.formatMessage({
                            defaultMessage: 'Contribution linked',
                            id: 'contribution.linked',
                          }),
                        });
                      }
                      setOpen(false);
                    } catch (error) {
                      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  <Save size={16} className="mr-2" />
                  <FormattedMessage id="save" defaultMessage="Save" />
                </Button>
              )}
            </div>
          </React.Fragment>
        )}
      </DialogContent>
    </Dialog>
  );
};
