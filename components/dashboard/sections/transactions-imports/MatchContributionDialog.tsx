import React from 'react';
import { gql, useApolloClient, useMutation, useQuery } from '@apollo/client';
import { ceil, floor, isEmpty, omit } from 'lodash';
import { ArrowLeft, ArrowRight, Ban, Calendar, Coins, ExternalLink, Save } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  Account,
  TransactionsImport,
  TransactionsImportRow,
  TransactionsImportStats,
} from '../../../../lib/graphql/types/v2/schema';
import { OrderStatus } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { i18nOrderStatus } from '../../../../lib/i18n/order';
import { i18nPendingOrderPaymentMethodTypes } from '../../../../lib/i18n/pending-order-payment-method-type';
import { updateTransactionsImportRows } from './lib/graphql';
import type { CSVConfig } from './lib/types';
import { TransactionsImportRowAction } from '@/lib/graphql/types/v2/graphql';

import { accountHoverCardFields } from '../../../AccountHoverCard';
import {
  confirmContributionFieldsFragment,
  ConfirmContributionForm,
} from '../../../contributions/ConfirmContributionForm';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import type { BaseModalProps } from '../../../ModalContext';
import { Button } from '../../../ui/Button';
import { Dialog, DialogContent, DialogHeader } from '../../../ui/Dialog';
import { useToast } from '../../../ui/useToast';
import { AmountFilterType } from '../../filters/AmountFilter/schema';
import { DateFilterType } from '../../filters/DateFilter/schema';
import { expectedFundsFilter } from '../../filters/ExpectedFundsFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountsFilter } from '../../filters/HostedAccountFilter';
import * as ContributionFilters from '../contributions/filters';

import { FilterWithRawValueButton } from './FilterWithRawValueButton';
import { SuggestedContributionsTable } from './SuggestedContributionsTable';
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

const NB_CONTRIBUTIONS_DISPLAYED = 5;

const filtersSchema = ContributionFilters.schema.extend({
  limit: integer.default(NB_CONTRIBUTIONS_DISPLAYED),
  expectedFundsFilter: expectedFundsFilter.schema.default(null), // To make sure the filter is displayed even when "Expected Funds" is set to "All" (default)
  account: isMulti(z.string()).optional(),
});

const toVariables = {
  ...ContributionFilters.toVariables,
  account: hostedAccountsFilter.toVariables,
};

const filters = {
  searchTerm: ContributionFilters.filters.searchTerm,
  account: {
    ...hostedAccountsFilter.filter,
    getDisallowEmpty: ({ meta }) => Boolean(meta?.hostedAccounts?.length), // Disable clearing accounts if provided by the parent
  },
  ...omit(ContributionFilters.filters, ['account', 'searchTerm']),
};

const suggestContributionMatchQuery = gql`
  query SuggestContributionMatch(
    $hostId: String!
    $searchTerm: String
    $offset: Int
    $limit: Int
    $frequency: [ContributionFrequency]
    $status: [OrderStatus!]
    $onlySubscriptions: Boolean
    $minAmount: Int
    $maxAmount: Int
    $paymentMethod: [PaymentMethodReferenceInput]
    $dateFrom: DateTime
    $dateTo: DateTime
    $expectedDateFrom: DateTime
    $expectedDateTo: DateTime
    $expectedFundsFilter: ExpectedFundsFilter
    $account: [AccountReferenceInput!]
  ) {
    account(id: $hostId) {
      id
      orders(
        filter: INCOMING
        includeIncognito: true
        includeHostedAccounts: true
        status: $status
        frequency: $frequency
        onlySubscriptions: $onlySubscriptions
        dateFrom: $dateFrom
        dateTo: $dateTo
        expectedDateFrom: $expectedDateFrom
        expectedDateTo: $expectedDateTo
        minAmount: $minAmount
        maxAmount: $maxAmount
        searchTerm: $searchTerm
        offset: $offset
        limit: $limit
        paymentMethod: $paymentMethod
        expectedFundsFilter: $expectedFundsFilter
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
          platformTipAmount {
            value
            valueInCents
          }
          pendingContributionData {
            expectedAt
            paymentMethod
            ponumber
            memo
            fromAccountInfo {
              name
              email
            }
          }
          status
          description
          createdAt
          processedAt
          tier {
            id
            name
          }
          paymentMethod {
            id
            service
            type
          }
          fromAccount {
            id
            name
            legalName
            slug
            isIncognito
            type
            ...AccountHoverCardFields
            ... on Individual {
              isGuest
            }
          }
          toAccount {
            id
            slug
            name
            legalName
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

/**
 * Returns a value range filter that matches the given value.
 * The precision is calculated on -/+20% of the original amount, then rounded based on the number
 * of decimals in the value: 123 would be rounded to -2 (=100), 123456 would be rounded to -5 (=100000).
 */
const getAmountRangeFilter = (valueInCents: number) => {
  const precision = Math.min(1 - Math.floor(Math.log10(valueInCents)), -2);
  return {
    type: AmountFilterType.IS_BETWEEN,
    gte: floor(valueInCents * 0.8, precision),
    lte: ceil(valueInCents * 1.2, precision),
  };
};

export const MatchContributionDialog = ({
  host,
  row,
  transactionsImport,
  setOpen,
  onAddFundsClick,
  accounts,
  ...props
}: {
  accounts: Pick<Account, 'id' | 'slug'>[];
  host: Account;
  row: TransactionsImportRow;
  transactionsImport: Pick<TransactionsImport, 'id' | 'source' | 'csvConfig'>;
  onAddFundsClick: () => void;
} & BaseModalProps) => {
  const client = useApolloClient();
  const { toast } = useToast();
  const [selectedContribution, setSelectedContribution] = React.useState(null);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const intl = useIntl();
  const defaultFilterValues = React.useMemo(
    () => ({
      amount: getAmountRangeFilter(row.amount.valueInCents),
      status: [OrderStatus.PENDING],
      expectedFundsFilter: null,
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
  const { data, loading, error } = useQuery(suggestContributionMatchQuery, {
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
    setSelectedContribution(null);
    setIsConfirming(false);
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
            <FormattedMessage defaultMessage="Match contribution" id="c7INEq" />
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
              reset();
              setOpen(false);
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
            <div className="text-sm">
              <Filterbar hideSeparator className="mb-4" {...queryFilter} />
              {error ? (
                <MessageBoxGraphqlError error={error} />
              ) : (
                <SuggestedContributionsTable
                  selectedContribution={selectedContribution}
                  setSelectedContribution={setSelectedContribution}
                  loading={loading}
                  contributions={data?.account?.orders?.nodes ?? []}
                  totalContributions={data?.account?.orders?.totalCount ?? 0}
                  queryFilter={queryFilter}
                  onAddFundsClick={onAddFundsClick}
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
              {selectedContribution && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="text-base font-semibold text-neutral-700">
                    <FormattedMessage defaultMessage="Selected match" id="bQndkF" />:{' '}
                    <Link
                      href={`/${selectedContribution.toAccount.slug}/contributions/${selectedContribution.legacyId}`}
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
                  </div>

                  <ul className="mt-2 list-inside list-disc break-words">
                    <li>
                      <strong>
                        <FormattedMessage id="Fields.id" defaultMessage="ID" />
                      </strong>
                      : {selectedContribution.legacyId}
                    </li>
                    <li>
                      <strong>
                        <FormattedMessage id="Fields.description" defaultMessage="Description" />
                      </strong>
                      : {selectedContribution.description}
                    </li>
                    <li>
                      <strong>
                        <FormattedMessage defaultMessage="Status" id="order.status" />
                      </strong>
                      : {i18nOrderStatus(intl, selectedContribution.status)}
                    </li>
                    <li>
                      <strong>
                        <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                      </strong>
                      : <DateTime value={selectedContribution.createdAt} timeStyle="short" />
                    </li>
                    <li>
                      <strong>
                        <FormattedMessage defaultMessage="Amount" id="Fields.amount" />
                      </strong>
                      :{' '}
                      <FormattedMoneyAmount
                        amount={selectedContribution.totalAmount.valueInCents}
                        currency={selectedContribution.totalAmount.currency}
                      />
                      {selectedContribution.platformTipAmount?.valueInCents > 0 && (
                        <span className="text-sm text-gray-500">
                          <FormattedMessage
                            id="OrderBudgetItem.Tip"
                            defaultMessage="(includes {amount} platform tip)"
                            values={{
                              amount: (
                                <FormattedMoneyAmount
                                  amount={selectedContribution.platformTipAmount.valueInCents}
                                  currency={selectedContribution.platformTipAmount.currency}
                                  precision={2}
                                />
                              ),
                            }}
                          />
                        </span>
                      )}
                    </li>
                    <li>
                      <strong>
                        <FormattedMessage defaultMessage="From" id="dM+p3/" />
                      </strong>
                      : <LinkCollective collective={selectedContribution.fromAccount} />
                    </li>
                    <li>
                      <strong>
                        <FormattedMessage id="To" defaultMessage="To" />
                      </strong>
                      : <LinkCollective collective={selectedContribution.toAccount} />
                    </li>
                    {selectedContribution.tier && (
                      <li>
                        <strong>
                          <FormattedMessage defaultMessage="Tier" id="b07w+D" />
                        </strong>
                        : {selectedContribution.tier.name}
                      </li>
                    )}
                    {selectedContribution.pendingContributionData && (
                      <React.Fragment>
                        {selectedContribution.pendingContributionData.paymentMethod && (
                          <li>
                            <strong>
                              <FormattedMessage defaultMessage="Payment method" id="Fields.paymentMethod" />
                            </strong>
                            :{' '}
                            {intl.formatMessage(
                              i18nPendingOrderPaymentMethodTypes[
                                selectedContribution.pendingContributionData.paymentMethod
                              ] ?? 'UNKNOWN',
                            )}
                          </li>
                        )}
                        {selectedContribution.pendingContributionData.expectedAt && (
                          <li>
                            <strong>
                              <FormattedMessage defaultMessage="Expected date" id="OUzCHW" />
                            </strong>
                            : <DateTime value={selectedContribution.pendingContributionData.expectedAt} />
                          </li>
                        )}
                        {selectedContribution.pendingContributionData.ponumber && (
                          <li>
                            <strong>
                              <FormattedMessage defaultMessage="PO number" id="yoQCPC" />
                            </strong>
                            : {selectedContribution.pendingContributionData.ponumber}
                          </li>
                        )}
                        {selectedContribution.pendingContributionData.memo && (
                          <li>
                            <strong>
                              <FormattedMessage defaultMessage="Memo" id="D5NqQO" />
                            </strong>
                            : {selectedContribution.pendingContributionData.memo}
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
              {!selectedContribution?.status || selectedContribution.status === OrderStatus.PENDING ? (
                <Button disabled={!selectedContribution} onClick={() => setIsConfirming(true)}>
                  <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  loading={isSubmitting}
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      await updateRows({
                        variables: {
                          action: TransactionsImportRowAction.UPDATE_ROWS,
                          rows: [{ id: row.id, order: { id: selectedContribution.id } }],
                        },
                      });
                      setOpen(false);
                      toast({
                        variant: 'success',
                        message: intl.formatMessage({ defaultMessage: 'Contribution linked', id: '7OXZmC' }),
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
              )}
            </div>
          </React.Fragment>
        )}
      </DialogContent>
    </Dialog>
  );
};
