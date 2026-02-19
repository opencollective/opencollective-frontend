import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ceil, floor, omit, pick } from 'lodash';
import { Ban, ExternalLink, Save } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import type {
  Account,
  FindContributionsMatchForOffPlatformDebitQueryVariables,
  FindExpenseMatchForOffPlatformDebitQueryVariables,
  Host,
  TransactionsImport,
  TransactionsImportRow,
} from '../../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { updateTransactionsImportRows } from './lib/graphql';
import { getMatchInfo } from './lib/match';
import { ExpenseMetaStatuses } from '@/lib/expense';
import type { FilterComponentConfigs, FiltersToVariables } from '@/lib/filters/filter-types';
import {
  ExpenseStatus,
  ExpenseStatusFilter,
  OrderStatus,
  TransactionsImportRowAction,
} from '@/lib/graphql/types/v2/graphql';

import ExpenseStatusTag from '@/components/expenses/ExpenseStatusTag';
import Image from '@/components/Image';
import MessageBox from '@/components/MessageBox';
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
  EXPENSES_UNPAID = 'Unpaid expenses',
  EXPENSES_PAID = 'Paid expenses',
  CONTRIBUTIONS = 'Contributions',
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

const findExpenseMatchForOffPlatformDebitQuery = gql`
  query FindExpenseMatchForOffPlatformDebit(
    $hostId: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $status: [ExpenseStatusFilter!]
    $amount: AmountRangeInput
    $dateFrom: DateTime
    $dateTo: DateTime
    $payoutMethodType: PayoutMethodType
    $account: [AccountReferenceInput!]
    $sort: ChronologicalOrderInput
  ) {
    expenses(
      host: { id: $hostId }
      status: $status
      dateFrom: $dateFrom
      dateTo: $dateTo
      amount: $amount
      searchTerm: $searchTerm
      offset: $offset
      limit: $limit
      payoutMethodType: $payoutMethodType
      accounts: $account
      includeChildrenExpenses: true
      orderBy: $sort
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

const findContributionsMatchForOffPlatformDebitQuery = gql`
  query FindContributionsMatchForOffPlatformDebit(
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
        filter: OUTGOING
        orderBy: $orderBy
      ) {
        totalCount
        offset
        limit
        nodes {
          id
          legacyId
          totalAmount {
            value
            valueInCents
            currency
          }
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
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

const getDefaultFilterValues = (
  row: TransactionsImportRow,
  accounts: Pick<Account, 'slug'>[],
  activeViewId: TabType,
  host: Pick<Host, 'id' | 'slug' | 'currency'>,
) => {
  const filters = {
    amount: { ...getAmountRangeFilter(row.amount.valueInCents), currency: host.currency },
    account: accounts?.map(account => account.slug),
  };

  if (activeViewId === TabType.EXPENSES_UNPAID) {
    filters['status'] = Object.values(omit(ExpenseStatusFilter, [ExpenseStatusFilter.PAID, ...ExpenseMetaStatuses]));
  } else if (activeViewId === TabType.EXPENSES_PAID) {
    filters['status'] = [ExpenseStatusFilter.PAID];
  } else if (activeViewId === TabType.CONTRIBUTIONS) {
    filters['status'] = [OrderStatus.PAID, OrderStatus.PENDING, OrderStatus.EXPIRED];
  }

  return filters;
};

const useMatchDebitDialogQueryFilter = (
  activeViewId: TabType,
  row: TransactionsImportRow,
  host: Pick<Host, 'id' | 'slug' | 'currency'>,
  accounts: Pick<Account, 'slug'>[],
) => {
  const intl = useIntl();
  const views = React.useMemo(
    () => [
      {
        id: TabType.EXPENSES_UNPAID,
        label: intl.formatMessage({ defaultMessage: 'Non-paid expenses', id: '4FkMOJ' }),
        filter: {
          status: Object.values(omit(ExpenseStatusFilter, [ExpenseStatusFilter.PAID, ...ExpenseMetaStatuses])),
        },
      },
      {
        id: TabType.EXPENSES_PAID,
        label: intl.formatMessage({ defaultMessage: 'Paid expenses', id: 'MAuJ5K' }),
        filter: {
          status: [ExpenseStatusFilter.PAID],
        },
      },
      {
        id: TabType.CONTRIBUTIONS,
        label: intl.formatMessage({ defaultMessage: 'Outgoing contributions', id: 'outgoingContributions' }),
        filter: {},
      },
    ],
    [intl],
  );

  const defaultFilterValues = React.useMemo(
    () => getDefaultFilterValues(row, accounts, activeViewId, host),
    [row, accounts, activeViewId],
  );

  const queryFilterMeta = React.useMemo(() => {
    const meta = {
      currency: row.amount.currency,
      hostSlug: host.slug,
      hostedAccounts: accounts,
      disableHostedAccountsSearch: Boolean(accounts?.length),
      accountingCategoryKinds: ExpenseFilters.ExpenseAccountingCategoryKinds,
    };

    if (activeViewId === TabType.EXPENSES_UNPAID || activeViewId === TabType.EXPENSES_PAID) {
      meta['hideExpensesMetaStatuses'] = true;
    }

    return meta;
  }, [row, host, accounts, activeViewId]);

  const { filters, toVariables, schema } = React.useMemo(() => {
    const commonSchemaOptions = {
      limit: integer.default(NB_EXPENSES_DISPLAYED),
      account: isMulti(z.string()).optional(),
    };

    let schema;
    const toVariables: FiltersToVariables<
      z.infer<typeof schema>,
      FindExpenseMatchForOffPlatformDebitQueryVariables | FindContributionsMatchForOffPlatformDebitQueryVariables,
      FiltersMeta
    > = {
      account: hostedAccountsFilter.toVariables,
    };
    const filters: FilterComponentConfigs<z.infer<typeof schema>, FiltersMeta> = {
      account: {
        ...hostedAccountsFilter.filter,
        getDisallowEmpty: ({ meta }) => Boolean(meta?.hostedAccounts?.length), // Disable clearing accounts if provided by the parent
      },
    };

    if (activeViewId === TabType.EXPENSES_UNPAID || activeViewId === TabType.EXPENSES_PAID) {
      Object.assign(filters, omit(ExpenseFilters.filters, ['account']));
      Object.assign(toVariables, omit(ExpenseFilters.toVariables, ['account']));
      schema = ExpenseFilters.schema.extend(commonSchemaOptions);
    } else if (activeViewId === TabType.CONTRIBUTIONS) {
      Object.assign(filters, omit(contributionsFilters.filters, ['account']));
      Object.assign(toVariables, omit(contributionsFilters.toVariables, ['account']));
      schema = contributionsFilters.schema.extend(commonSchemaOptions);
    }

    return { filters, toVariables, schema };
  }, [activeViewId]);

  const queryFilter = useQueryFilter<
    typeof schema,
    FindExpenseMatchForOffPlatformDebitQueryVariables | FindContributionsMatchForOffPlatformDebitQueryVariables
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

export const MatchDebitDialog = ({
  accounts,
  host,
  row,
  transactionsImport,
  setOpen,
  onCloseFocusRef,
  ...props
}: {
  accounts: Pick<Account, 'slug'>[];
  host: Pick<Host, 'id'> & React.ComponentProps<typeof HostCreateExpenseModal>['host'];
  row: TransactionsImportRow;
  transactionsImport: Pick<TransactionsImport, 'id' | 'source' | 'csvConfig'>;
  onCloseFocusRef: React.MutableRefObject<HTMLElement>;
} & BaseModalProps) => {
  const { toast } = useToast();
  const { showModal } = useModal();
  const [selectedExpense, setSelectedExpense] = React.useState(null);
  const [selectedContribution, setSelectedContribution] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const intl = useIntl();
  const [activeViewId, setActiveViewId] = React.useState(TabType.EXPENSES_UNPAID);
  const matchInfo = getMatchInfo(row, selectedExpense, selectedContribution);
  const [updateRows] = useMutation(updateTransactionsImportRows);
  const queryFilter = useMatchDebitDialogQueryFilter(activeViewId, row, host, accounts);

  // Query for expenses
  const {
    data: expensesData,
    loading: expensesLoading,
    error: expensesError,
  } = useQuery(findExpenseMatchForOffPlatformDebitQuery, {
    variables: { ...queryFilter.variables, hostId: host.id },
    fetchPolicy: 'cache-and-network',
    skip: queryFilter.activeViewId === TabType.CONTRIBUTIONS,
  });

  // Query for contributions
  const {
    data: contributionsData,
    loading: contributionsLoading,
    error: contributionsError,
  } = useQuery(findContributionsMatchForOffPlatformDebitQuery, {
    variables: { ...queryFilter.variables, hostId: host.slug },
    fetchPolicy: 'cache-and-network',
    skip: queryFilter.activeViewId !== TabType.CONTRIBUTIONS,
  });

  // Determine current data, loading and error states based on active content type
  const loading = queryFilter.activeViewId === TabType.CONTRIBUTIONS ? contributionsLoading : expensesLoading;
  const error = queryFilter.activeViewId === TabType.CONTRIBUTIONS ? contributionsError : expensesError;

  // When switching tab, clear selection
  React.useEffect(() => {
    setSelectedExpense(null);
    setSelectedContribution(null);
  }, [queryFilter.activeViewId]);

  // When opening the modal, make sure we reset the filters to their default values
  React.useEffect(() => {
    if (props.open) {
      queryFilter.resetFilters(getDefaultFilterValues(row, accounts, activeViewId, host));
    }
  }, [props.open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog
      {...props}
      onOpenChange={() => {
        if (isSubmitting) {
          return;
        } else {
          setSelectedExpense(null);
          setSelectedContribution(null);
          setIsSubmitting(false);
          setOpen(false);
          setActiveViewId(TabType.EXPENSES_UNPAID);
          queryFilter.resetFilters(getDefaultFilterValues(row, accounts, activeViewId, host));
        }
      }}
    >
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <h2 className="text-xl font-bold">
            <FormattedMessage defaultMessage="Match Debit" id="matchDebit" />
          </h2>
        </DialogHeader>
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
          ) : queryFilter.activeViewId === TabType.CONTRIBUTIONS ? (
            <SuggestedContributionsTable
              loading={loading}
              selectedContribution={selectedContribution}
              setSelectedContribution={setSelectedContribution}
              contributions={contributionsData?.account?.orders?.nodes ?? []}
              totalContributions={contributionsData?.account?.orders?.totalCount ?? 0}
              queryFilter={queryFilter}
              onAddFundsClick={() => {
                setOpen(false);
                // Handle add funds click
              }}
            />
          ) : (
            <SuggestedExpensesTable
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
                    defaultMessage="Select an item from the table above to match it against the imported transaction or <Link>create a new Expense</Link>."
                    id="yUTCoY"
                    values={{
                      Link: chunks => (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs font-normal text-neutral-800 underline hover:text-neutral-600"
                          onClick={() => {
                            setOpen(false);
                            showModal(
                              HostCreateExpenseModal,
                              { host, onCloseFocusRef, transactionsImport, transactionsImportRow: row },
                              'host-create-expense-modal',
                            );
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
                      href={`/${selectedContribution.toAccount.slug}/outgoing-contributions/${selectedContribution.legacyId}`}
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

              {Boolean(
                selectedExpense &&
                [
                  ExpenseStatus.PENDING,
                  ExpenseStatus.DRAFT,
                  ExpenseStatus.INVITE_DECLINED,
                  ExpenseStatus.REJECTED,
                  ExpenseStatus.SPAM,
                  ExpenseStatus.UNVERIFIED,
                ].includes(selectedExpense.status),
              ) && (
                <MessageBox type="warning" className="mt-4">
                  <strong>
                    <FormattedMessage defaultMessage="This expense has not been approved" id="DJnUUS" />
                  </strong>
                  <p className="mt-2">
                    <FormattedMessage
                      defaultMessage="You are matching a bank transaction with an expense that has not been approved by the collective admin. If you match this expense it will override the approval process and mark the expense as paid. The collective admins will be informed."
                      id="6ymIia"
                    />
                  </p>
                </MessageBox>
              )}
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <Ban size={16} className="mr-2" />
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!selectedExpense && !selectedContribution}
            onClick={async () => {
              try {
                setIsSubmitting(true);
                if (queryFilter.activeViewId !== TabType.CONTRIBUTIONS && selectedExpense) {
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
                } else if (queryFilter.activeViewId === TabType.CONTRIBUTIONS && selectedContribution) {
                  await updateRows({
                    variables: {
                      action: TransactionsImportRowAction.UPDATE_ROWS,
                      rows: [{ id: row.id, order: { id: selectedContribution.id } }],
                    },
                  });
                  toast({
                    variant: 'success',
                    message: intl.formatMessage({ defaultMessage: 'Contribution linked', id: 'contribution.linked' }),
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
