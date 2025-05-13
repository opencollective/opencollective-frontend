import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ceil, floor, isEmpty, isObject, omit } from 'lodash';
import { Ban, ChevronDown, ChevronUp, ExternalLink, Save } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { Account, Host, TransactionsImport, TransactionsImportRow } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { i18nExpenseStatus } from '../../../../lib/i18n/expense';
import { updateTransactionsImportRows } from './lib/graphql';
import type { CSVConfig } from './lib/types';
import { ExpenseMetaStatuses } from '@/lib/expense';
import type { FilterComponentConfigs, FiltersToVariables } from '@/lib/filters/filter-types';
import type {
  SuggestContributionMatchQueryVariables,
  SuggestExpenseMatchQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import { ExpenseStatusFilter, TransactionsImportRowAction } from '@/lib/graphql/types/v2/graphql';

import Image from '@/components/Image';
import { DataList, DataListItem, NestedObjectDataListItem } from '@/components/ui/DataList';
import { Separator } from '@/components/ui/Separator';

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
import * as ExpenseFilters from '../expenses/filters';
import { HostCreateExpenseModal } from '../expenses/HostCreateExpenseModal';

import { SuggestedContributionsTable } from './SuggestedContributionsTable';
import { SuggestedExpensesTable } from './SuggestedExpensesTable';

const NB_EXPENSES_DISPLAYED = 5;

enum TabType {
  EXPENSES_PAID = 'Paid expenses',
  EXPENSES_UNPAID = 'Unpaid expenses',
  CONTRIBUTIONS = 'Contributions',
}

const filtersSchema = ExpenseFilters.schema.extend({
  limit: integer.default(NB_EXPENSES_DISPLAYED),
  account: isMulti(z.string()).optional(),
});

type FiltersMeta = ExpenseFilters.FilterMeta & HostedAccountFilterMeta;

const toVariables: FiltersToVariables<z.infer<typeof filtersSchema>, SuggestExpenseMatchQueryVariables, FiltersMeta> = {
  ...ExpenseFilters.toVariables,
  account: hostedAccountsFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof filtersSchema>, FiltersMeta> = {
  searchTerm: ExpenseFilters.filters.searchTerm,
  account: {
    ...hostedAccountsFilter.filter,
    getDisallowEmpty: ({ meta }) => Boolean(meta?.hostedAccounts?.length), // Disable clearing accounts if provided by the parent
  },
  ...omit(ExpenseFilters.filters, ['account', 'searchTerm']),
};

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

const suggestExpenseMatchQuery = gql`
  query SuggestExpenseMatch(
    $hostId: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $status: [ExpenseStatusFilter!]
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $payoutMethodType: PayoutMethodType
    $account: [AccountReferenceInput!]
  ) {
    expenses(
      host: { id: $hostId }
      status: $status
      dateFrom: $dateFrom
      dateTo: $dateTo
      minAmount: $minAmount
      maxAmount: $maxAmount
      searchTerm: $searchTerm
      offset: $offset
      limit: $limit
      payoutMethodType: $payoutMethodType
      accounts: $account
      includeChildrenExpenses: true
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

const suggestContributionMatchQuery = gql`
  query SuggestContributionMatch(
    $hostId: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $status: [OrderStatus!]
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: DateTime
    $dateTo: DateTime
    $paymentMethod: PaymentMethodType
    $account: [AccountReferenceInput!]
  ) {
    account(slug: $hostId) {
      id
      orders(
        status: $status
        dateFrom: $dateFrom
        dateTo: $dateTo
        minAmount: $minAmount
        maxAmount: $maxAmount
        searchTerm: $searchTerm
        offset: $offset
        limit: $limit
        paymentMethod: $paymentMethod
        hostedAccounts: $account
        includeChildrenAccounts: true
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

const recursivelyRemoveEmptyValues = (obj: Record<string, any>): Record<string, any> => {
  if (!isObject(obj) || isEmpty(obj)) {
    return obj;
  }

  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (isObject(value) && !Array.isArray(value)) {
        const nestedValue = recursivelyRemoveEmptyValues(value);
        if (!isEmpty(nestedValue)) {
          acc[key] = nestedValue;
        }
      } else if (!isEmpty(value)) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>,
  );
};

const removeEmptyValues = (entry: [string, unknown]): [string, unknown] => {
  if (isObject(entry[1]) && !isEmpty(entry[1])) {
    return [entry[0], recursivelyRemoveEmptyValues(entry[1])];
  } else {
    return entry;
  }
};

const filterRawValueEntries = ([key, value]: [string, string], csvConfig: CSVConfig): boolean => {
  // Ignore empty values
  if (isEmpty(value)) {
    return false;
  }

  if (csvConfig) {
    const { columns } = csvConfig;
    if ([columns.credit.target, columns.debit.target, columns.date.target].includes(key)) {
      return false;
    }
  } else {
    if (
      [
        // Ignore columns that are already displayed
        'date',
        'description',
        'amount',
        // Ignore some irrelevant columns
        'personal_finance_category',
        'personal_finance_category_icon_url',
      ].includes(key)
    ) {
      return false;
    }
  }

  return true;
};

const getViews = intl => [
  {
    id: TabType.EXPENSES_PAID,
    label: intl.formatMessage({ defaultMessage: 'Paid expenses', id: 'MAuJ5K' }),
    filter: {
      status: [ExpenseStatusFilter.PAID],
    },
  },
  {
    id: TabType.EXPENSES_UNPAID,
    label: intl.formatMessage({ defaultMessage: 'Unpaid expenses', id: '+6XGpX' }),
    filter: {
      status: Object.values(omit(ExpenseStatusFilter, [ExpenseStatusFilter.PAID, ...ExpenseMetaStatuses])),
    },
  },
  {
    id: TabType.CONTRIBUTIONS,
    label: intl.formatMessage({ defaultMessage: 'Outgoing contributions', id: 'outgoingContributions' }),
    filter: {},
  },
];

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
  const [hasViewMore, setHasViewMore] = React.useState(false);
  const intl = useIntl();

  const defaultFilterValues = React.useMemo(
    () => ({
      amount: getAmountRangeFilter(row.amount.valueInCents),
      account: accounts?.map(account => account.slug),
    }),
    [row, accounts],
  );

  const queryFilterMeta = React.useMemo(
    () => ({
      currency: row.amount.currency,
      hostSlug: host.slug,
      hostedAccounts: accounts,
      disableHostedAccountsSearch: Boolean(accounts?.length),
      hideExpensesMetaStatuses: true,
    }),
    [row, host, accounts],
  );

  const views = React.useMemo(() => getViews(intl), [intl]);
  const queryFilter = useQueryFilter<
    typeof filtersSchema,
    SuggestExpenseMatchQueryVariables | SuggestContributionMatchQueryVariables
  >({
    schema: filtersSchema,
    skipRouter: true,
    toVariables: toVariables,
    filters: filters,
    meta: queryFilterMeta,
    defaultFilterValues,
    views: views,
  });

  const [updateRows] = useMutation(updateTransactionsImportRows, { context: API_V2_CONTEXT });

  // Query for expenses
  const {
    data: expensesData,
    loading: expensesLoading,
    error: expensesError,
  } = useQuery(suggestExpenseMatchQuery, {
    context: API_V2_CONTEXT,
    variables: { ...queryFilter.variables, hostId: host.id },
    fetchPolicy: 'cache-and-network',
    skip: queryFilter.activeViewId === TabType.CONTRIBUTIONS,
  });

  // Query for contributions
  const {
    data: contributionsData,
    loading: contributionsLoading,
    error: contributionsError,
  } = useQuery(suggestContributionMatchQuery, {
    context: API_V2_CONTEXT,
    variables: { ...queryFilter.variables, hostId: host.slug },
    fetchPolicy: 'cache-and-network',
    skip: queryFilter.activeViewId !== TabType.CONTRIBUTIONS,
  });

  // Determine current data, loading and error states based on active content type
  const loading = queryFilter.activeViewId === TabType.CONTRIBUTIONS ? contributionsLoading : expensesLoading;
  const error = queryFilter.activeViewId === TabType.CONTRIBUTIONS ? contributionsError : expensesError;

  // Re-load default filters when changing row
  const { resetFilters } = queryFilter;
  React.useEffect(() => {
    resetFilters(defaultFilterValues);
  }, [defaultFilterValues, resetFilters]);

  const reset = () => {
    setSelectedExpense(null);
    setSelectedContribution(null);
    setIsSubmitting(false);
    setOpen(false);
    resetFilters(defaultFilterValues);
  };

  // When switching tab, clear selection
  React.useEffect(() => {
    setSelectedExpense(null);
    setSelectedContribution(null);
  }, [queryFilter.activeViewId]);

  return (
    <Dialog
      {...props}
      onOpenChange={() => {
        if (isSubmitting) {
          return;
        } else {
          reset();
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
          <Filterbar hideSeparator className="mb-4" {...queryFilter} />
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
            <div className="mb-2 text-base font-semibold text-gray-700">
              <FormattedMessage defaultMessage="Imported data" id="tmfin0" />
            </div>

            <DataList className="rounded bg-slate-50 p-4 pb-1">
              <DataListItem
                label={<FormattedMessage id="Fields.amount" defaultMessage="Amount" />}
                value={<FormattedMoneyAmount amount={row.amount.valueInCents} currency={row.amount.currency} />}
                labelClassName="basis-1/3 min-w-auto max-w-auto"
              />
              <DataListItem
                label={<FormattedMessage defaultMessage="Date" id="P7PLVj" />}
                value={<DateTime value={row.date} />}
                labelClassName="basis-1/3 min-w-auto max-w-auto"
              />
              <DataListItem
                label={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
                value={row.description}
                itemClassName="truncate max-w-full"
                labelClassName="basis-1/3 min-w-auto max-w-auto"
                showValueAsItemTitle
              />
              <DataListItem
                label={<FormattedMessage id="Fields.source" defaultMessage="Source" />}
                value={transactionsImport.source}
                itemClassName="truncate max-w-full"
                labelClassName="basis-1/3 min-w-auto max-w-auto"
                showValueAsItemTitle
              />
              <DataListItem
                label={<FormattedMessage defaultMessage="Transaction ID" id="oK0S4l" />}
                value={row.sourceId}
                itemClassName="truncate max-w-full"
                labelClassName="basis-1/3 min-w-auto max-w-auto"
                showValueAsItemTitle
              />
              {hasViewMore &&
                Object.entries(row.rawValue as Record<string, string>)
                  .map(entry => removeEmptyValues(entry))
                  .filter(entry => filterRawValueEntries(entry, transactionsImport.csvConfig))
                  .map(([key, value]) => (
                    <NestedObjectDataListItem
                      key={key}
                      label={key}
                      itemClassName="truncate max-w-full"
                      labelClassName="basis-1/3 min-w-auto max-w-auto"
                      value={value}
                      showValueAsItemTitle
                    />
                  ))}
              <div className="mt-2 flex flex-col items-center gap-1">
                <Separator />
                <Button
                  variant="ghost"
                  className="h-auto w-full text-xs font-normal"
                  onClick={() => {
                    setHasViewMore(!hasViewMore);
                  }}
                >
                  {hasViewMore ? (
                    <React.Fragment>
                      <FormattedMessage defaultMessage="View less" id="EVFai9" />
                      <ChevronUp size={16} />
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <FormattedMessage defaultMessage="View more" id="34Up+l" />
                      <ChevronDown size={16} />
                    </React.Fragment>
                  )}
                </Button>
              </div>
            </DataList>
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
                    defaultMessage="Select an item from the table above to match it against the imported transaction or <Link>Create Expense</Link>."
                    id="+C8/GG"
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
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-base font-semibold text-neutral-700">
                <FormattedMessage defaultMessage="Selected match" id="bQndkF" />:{' '}
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
                    href={`/${selectedContribution.toAccount.slug}/orders/${selectedContribution.legacyId}`}
                    className="text-sm underline"
                    openInNewTab
                  >
                    <FormattedMessage
                      defaultMessage="Contribution #{id}"
                      id="contribution.id"
                      values={{ id: selectedContribution.legacyId }}
                    />
                    &nbsp;
                    <ExternalLink size={14} className="inline" />
                  </Link>
                )}
              </div>

              <ul className="mt-2 list-inside list-disc break-words">
                <li>
                  <strong>
                    <FormattedMessage id="Fields.id" defaultMessage="ID" />
                  </strong>
                  : {selectedExpense ? selectedExpense.legacyId : selectedContribution.legacyId}
                </li>
                <li>
                  <strong>
                    <FormattedMessage id="Fields.description" defaultMessage="Description" />
                  </strong>
                  : {selectedExpense ? selectedExpense.description : selectedContribution.description}
                </li>
                <li>
                  <strong>
                    <FormattedMessage defaultMessage="Status" id="Fields.status" />
                  </strong>
                  : {selectedExpense ? i18nExpenseStatus(intl, selectedExpense.status) : selectedContribution.status}
                </li>
                <li>
                  <strong>
                    <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                  </strong>
                  :{' '}
                  <DateTime
                    value={selectedExpense ? selectedExpense.createdAt : selectedContribution.createdAt}
                    timeStyle="short"
                  />
                </li>
                <li>
                  <strong>
                    <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
                  </strong>
                  :{' '}
                  {selectedExpense ? (
                    <FormattedMoneyAmount
                      amount={selectedExpense.amountV2.valueInCents}
                      currency={selectedExpense.amountV2.currency}
                    />
                  ) : (
                    <FormattedMoneyAmount
                      amount={selectedContribution.totalAmount.valueInCents}
                      currency={selectedContribution.totalAmount.currency}
                    />
                  )}
                </li>
                {selectedExpense ? (
                  <React.Fragment>
                    <li>
                      <strong>
                        <FormattedMessage id="SecurityScope.Payee" defaultMessage="Payee" />
                      </strong>
                      : <LinkCollective collective={selectedExpense.payee} />
                    </li>
                    <li>
                      <strong>
                        <FormattedMessage id="TwyMau" defaultMessage="Account" />
                      </strong>
                      : <LinkCollective collective={selectedExpense.account} />
                    </li>
                    {selectedExpense.payoutMethod && (
                      <li>
                        <strong>
                          <FormattedMessage defaultMessage="Payout method" id="ExpenseForm.PayoutOptionLabel" />
                        </strong>
                        : {selectedExpense.payoutMethod.type}
                      </li>
                    )}
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <li>
                      <strong>
                        <FormattedMessage defaultMessage="From" id="dM+p3/" />
                      </strong>
                      : <LinkCollective collective={selectedContribution.fromAccount} />
                    </li>
                    <li>
                      <strong>
                        <FormattedMessage defaultMessage="To" id="to" />
                      </strong>
                      : <LinkCollective collective={selectedContribution.toAccount} />
                    </li>
                    {selectedContribution.paymentMethod && (
                      <li>
                        <strong>
                          <FormattedMessage defaultMessage="Payment method" id="paymentMethod" />
                        </strong>
                        : {selectedContribution.paymentMethod.type}
                      </li>
                    )}
                  </React.Fragment>
                )}
              </ul>
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
