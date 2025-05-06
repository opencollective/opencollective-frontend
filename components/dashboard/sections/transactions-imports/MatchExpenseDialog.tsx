import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ceil, floor, isEmpty, omit } from 'lodash';
import { Ban, Calendar, Coins, ExternalLink, Save } from 'lucide-react';
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
import type { FilterComponentConfigs, FiltersToVariables } from '@/lib/filters/filter-types';
import type { SuggestExpenseMatchQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { TransactionsImportRowAction } from '@/lib/graphql/types/v2/graphql';

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
import { DateFilterType } from '../../filters/DateFilter/schema';
import { Filterbar } from '../../filters/Filterbar';
import type { HostedAccountFilterMeta } from '../../filters/HostedAccountFilter';
import { hostedAccountsFilter } from '../../filters/HostedAccountFilter';
import * as ExpenseFilters from '../expenses/filters';
import { HostCreateExpenseModal } from '../expenses/HostCreateExpenseModal';

import { FilterWithRawValueButton } from './FilterWithRawValueButton';
import { SuggestedExpensesTable } from './SuggestedExpensesTable';
import { TransactionsImportRowDataLine } from './TransactionsImportRowDataLine';

const filterRawValueEntries = ([key, value]: [string, string], csvConfig: CSVConfig): boolean => {
  // Ignore empty values
  if (isEmpty(value)) {
    return false;
  }

  // Ignore amount and date, since they're already parsed and displayed above
  if (csvConfig) {
    const { columns } = csvConfig;
    if ([columns.credit.target, columns.debit.target, columns.date.target].includes(key)) {
      return false;
    }
  } else {
    if (['date'].includes(key)) {
      return false;
    }
  }

  return true;
};

const NB_EXPENSES_DISPLAYED = 5;

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

export const MatchExpenseDialog = ({
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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
    }),
    [row, host, accounts],
  );

  const queryFilter = useQueryFilter({
    schema: filtersSchema,
    skipRouter: true,
    toVariables: toVariables,
    filters: filters,
    meta: queryFilterMeta,
    defaultFilterValues,
  });

  const [updateRows] = useMutation(updateTransactionsImportRows, { context: API_V2_CONTEXT });
  const { data, loading, error } = useQuery(suggestExpenseMatchQuery, {
    context: API_V2_CONTEXT,
    variables: { ...queryFilter.variables, hostId: host.id },
    fetchPolicy: 'cache-and-network',
  });

  // Re-load default filters when changing row
  const { resetFilters } = queryFilter;
  React.useEffect(() => {
    resetFilters(defaultFilterValues);
  }, [defaultFilterValues, resetFilters]);

  const reset = () => {
    setSelectedExpense(null);
    setIsSubmitting(false);
    setOpen(false);
    resetFilters(defaultFilterValues);
  };

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
            <FormattedMessage defaultMessage="Match expense" id="BGB+3j" />
          </h2>
        </DialogHeader>
        <div className="text-sm">
          <Filterbar hideSeparator className="mb-4" {...queryFilter} />
          {error ? (
            <MessageBoxGraphqlError error={error} />
          ) : (
            <SuggestedExpensesTable
              loading={loading}
              selectedExpense={selectedExpense}
              setSelectedExpense={setSelectedExpense}
              expenses={data?.expenses?.nodes ?? []}
              totalExpenses={data?.expenses?.totalCount ?? 0}
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
            <strong className="text-base text-gray-700">
              <FormattedMessage defaultMessage="Imported data" id="tmfin0" />
            </strong>

            <ul className="mt-2 list-inside list-disc break-words">
              <li>
                <strong>
                  <FormattedMessage id="AddFundsModal.source" defaultMessage="Source" />
                </strong>
                : {transactionsImport.source}{' '}
                <FilterWithRawValueButton
                  onClick={() => queryFilter.setFilter('searchTerm', transactionsImport.source)}
                />
              </li>
              <li>
                <strong>
                  <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
                </strong>
                : <FormattedMoneyAmount amount={row.amount.valueInCents} currency={row.amount.currency} />{' '}
                <FilterWithRawValueButton
                  message={<FormattedMessage defaultMessage="Search amount" id="o9K20a" />}
                  SecondaryIcon={Coins}
                  onClick={() => getAmountRangeFilter(row.amount.valueInCents)}
                />
              </li>
              <li>
                <strong>
                  <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                </strong>
                : <DateTime value={row.date} />
                <FilterWithRawValueButton
                  message={<FormattedMessage defaultMessage="Search date" id="f+3xdP" />}
                  SecondaryIcon={Calendar}
                  onClick={() =>
                    queryFilter.setFilter('date', {
                      type: DateFilterType.BEFORE_OR_ON,
                      lte: row.date.split('T')[0],
                    })
                  }
                />
              </li>
              {Object.entries(row.rawValue as Record<string, string>)
                .filter(entry => filterRawValueEntries(entry, transactionsImport.csvConfig))
                .map(([key, value]) => (
                  <TransactionsImportRowDataLine key={key} value={value} labelKey={key} />
                ))}
            </ul>
          </div>
          {selectedExpense && (
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="text-base font-semibold text-neutral-700">
                <FormattedMessage defaultMessage="Selected match" id="bQndkF" />:{' '}
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
              </div>

              <ul className="mt-2 list-inside list-disc break-words">
                <li>
                  <strong>
                    <FormattedMessage id="Fields.id" defaultMessage="ID" />
                  </strong>
                  : {selectedExpense.legacyId}
                </li>
                <li>
                  <strong>
                    <FormattedMessage id="Fields.description" defaultMessage="Description" />
                  </strong>
                  : {selectedExpense.description}
                </li>
                <li>
                  <strong>
                    <FormattedMessage defaultMessage="Status" id="Fields.status" />
                  </strong>
                  : {i18nExpenseStatus(intl, selectedExpense.status)}
                </li>
                <li>
                  <strong>
                    <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                  </strong>
                  : <DateTime value={selectedExpense.createdAt} timeStyle="short" />
                </li>
                <li>
                  <strong>
                    <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
                  </strong>
                  :{' '}
                  <FormattedMoneyAmount
                    amount={selectedExpense.amountV2.valueInCents}
                    currency={selectedExpense.amountV2.currency}
                  />
                </li>
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
                {selectedExpense.items.length > 0 && (
                  <li>
                    <strong>
                      <FormattedMessage id="Fields.items" defaultMessage="Items" />
                    </strong>
                    :{' '}
                    {selectedExpense.items.length === 1 ? (
                      <span>
                        <i>
                          {selectedExpense.items[0].description || (
                            <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
                          )}
                        </i>{' '}
                        -{' '}
                        <FormattedMoneyAmount
                          amount={selectedExpense.items[0].amountV2.valueInCents}
                          currency={selectedExpense.items[0].amountV2.currency}
                        />
                      </span>
                    ) : (
                      <ul className="list-inside list-disc pl-4">
                        {selectedExpense.items.map(item => (
                          <li key={item.id}>
                            <i>
                              {item.description || (
                                <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
                              )}
                            </i>{' '}
                            -{' '}
                            <FormattedMoneyAmount
                              amount={item.amountV2.valueInCents}
                              currency={item.amountV2.currency}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
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
            disabled={!selectedExpense}
            onClick={async () => {
              try {
                setIsSubmitting(true);
                await updateRows({
                  variables: {
                    action: TransactionsImportRowAction.UPDATE_ROWS,
                    rows: [{ id: row.id, expense: { id: selectedExpense.id } }],
                  },
                });
                setOpen(false);
                toast({
                  variant: 'success',
                  message: intl.formatMessage({ defaultMessage: 'Expense linked', id: 'expense.linked' }),
                });
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
