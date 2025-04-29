import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { keyBy, truncate } from 'lodash';
import Lottie from 'lottie-react';
import { Info, MessageCircle, PauseCircle, RotateCcw, SquareSlashIcon } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import type { FilterConfig } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  OffPlatformTransactionsQuery,
  OffPlatformTransactionsQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import type { Amount, PlaidAccount, TransactionsImport } from '../../../../lib/graphql/types/v2/schema';
import { TransactionsImportRowStatus } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { i18nTransactionsRowStatus } from '../../../../lib/i18n/transactions-import-row';
import { cn, sortSelectOptions } from '../../../../lib/utils';
import { useOffPlatformTransactionsActions } from './lib/actions';
import { TransactionsImportRowFieldsFragment, TransactionsImportStatsFragment } from './lib/graphql';
import { getPossibleActionsForSelectedRows } from './lib/table-selection';

import { accountingCategoryFields } from '@/components/expenses/graphql/fragments';
import { getI18nLink } from '@/components/I18nFormatters';

import * as SyncAnimation from '../../../../public/static/animations/sync-bank-oc.json';
import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import NotFound from '../../../NotFound';
import StyledLink from '../../../StyledLink';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import {
  MultiPagesRowSelectionInitialState,
  multiPagesRowSelectionReducer,
} from '../../../table/multi-pages-selection';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { useToast } from '../../../ui/useToast';
import DashboardHeader from '../../DashboardHeader';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import { searchFilter } from '../../filters/SearchFilter';

import { TransactionsImportRowDrawer } from './TransactionsImportRowDrawer';
import { TransactionsImportRowStatusBadge } from './TransactionsImportRowStatusBadge';

const offPlatformTransactionsQuery = gql`
  query OffPlatformTransactions(
    $hostSlug: String
    $limit: Int = 50
    $offset: Int = 0
    $status: TransactionsImportRowStatus
    $searchTerm: String
    $plaidAccountId: [NonEmptyString]
    $importIds: [NonEmptyString!]
    $importId: NonEmptyString!
    $hasImportFilter: Boolean!
  ) {
    host(slug: $hostSlug) {
      id
      name
      legalName
      imageUrl
      legacyId
      slug
      currency
      type
      accountingCategories {
        totalCount
        nodes {
          id
          ...AccountingCategoryFields
        }
      }
      transactionsImports(status: ACTIVE, limit: 100) {
        nodes {
          id
          source
          name
        }
      }
      offPlatformTransactionsStats {
        ...TransactionsImportStats
      }
      offPlatformTransactions(
        limit: $limit
        offset: $offset
        status: $status
        searchTerm: $searchTerm
        accountId: $plaidAccountId
        importType: PLAID
        importId: $importIds
      ) {
        totalCount
        offset
        limit
        nodes {
          ...TransactionsImportRowFields
          assignedAccounts {
            id
            legacyId
            slug
            type
            name
            legalName
            currency
            imageUrl(height: 32)
          }
          transactionsImport {
            id
            source
            name
          }
        }
      }
    }
    transactionsImport(id: $importId) @include(if: $hasImportFilter) {
      id
      plaidAccounts {
        accountId
        mask
        name
        officialName
        subtype
        type
      }
    }
  }
  ${TransactionsImportRowFieldsFragment}
  ${accountingCategoryFields}
  ${TransactionsImportStatsFragment}
`;

// const transactionsImportLasSyncAtPollQuery = gql`
//   query TransactionsImportLastSyncAt($importId: String!) {
//     transactionsImport(id: $importId) {
//       id
//       lastSyncAt
//       isSyncing
//       lastSyncCursor
//     }
//   }
// `;

const DEFAULT_PAGE_SIZE = 50;

const getViews = intl =>
  [
    {
      id: 'ALL',
      label: intl.formatMessage({ defaultMessage: 'All', id: 'all' }),
      filter: {},
    },
    {
      id: 'PENDING',
      label: intl.formatMessage({ defaultMessage: 'Pending', id: 'eKEL/g' }),
      filter: { status: TransactionsImportRowStatus.PENDING },
    },
    {
      id: 'ON_HOLD',
      label: intl.formatMessage({ defaultMessage: 'On Hold', id: 'PQoBVd' }),
      filter: { status: TransactionsImportRowStatus.ON_HOLD },
    },
    {
      id: 'IGNORED',
      label: intl.formatMessage({ defaultMessage: 'No action', id: 'zue9QR' }),
      filter: { status: TransactionsImportRowStatus.IGNORED },
    },
    {
      id: 'LINKED',
      label: intl.formatMessage({ defaultMessage: 'Imported', id: 'transaction.imported' }),
      filter: { status: TransactionsImportRowStatus.LINKED },
    },
  ] as const;

const addCountsToViews = (views, stats) => {
  const viewIdToStatsKey = {
    PENDING: 'pending',
    IGNORED: 'ignored',
    ON_HOLD: 'onHold',
    LINKED: 'imported',
    ALL: 'total',
  };

  return views.map(view => ({ ...view, count: stats[viewIdToStatsKey[view.id]] }));
};

const rowStatusFilterSchema = z.nativeEnum(TransactionsImportRowStatus).optional();
const plaidAccountFilterSchema = isMulti(z.string()).optional();
const transactionsImportFilterSchema = isMulti(z.string()).optional();

const rowStatusFilter: FilterConfig<z.infer<typeof rowStatusFilterSchema>> = {
  schema: rowStatusFilterSchema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Status', id: 'tzMNF3' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(TransactionsImportRowStatus)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => i18nTransactionsRowStatus(intl, value),
  },
};

const plaidAccountFilter: FilterConfig<z.infer<typeof plaidAccountFilterSchema>> = {
  schema: plaidAccountFilterSchema,
  toVariables: value => ({ plaidAccountId: value }),
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Sub-account', id: '1duVXZ' }),
    static: true,
    hide: ({ meta }) => !meta.plaidAccounts || meta.plaidAccounts.length < 2,
    Component: ({ meta, ...props }) => {
      const plaidAccounts = meta.plaidAccounts as PlaidAccount[];
      return (
        <ComboSelectFilter
          isMulti
          options={plaidAccounts
            .map(plaidAccount => ({ value: plaidAccount.accountId, label: plaidAccount.name }))
            .sort(sortSelectOptions)}
          {...props}
        />
      );
    },
    valueRenderer: ({ value, meta }) => {
      const plaidAccount = meta.plaidAccounts?.find(plaidAccount => plaidAccount.accountId === value);
      return plaidAccount?.name;
    },
  },
};

const transactionsImportFilter: FilterConfig<z.infer<typeof transactionsImportFilterSchema>> = {
  schema: transactionsImportFilterSchema,
  toVariables: value => ({ import: value }),
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Connection', id: 'KtZV9p' }),
    static: true,
    Component: ({ meta, ...props }) => {
      const transactionsImports = meta.transactionsImports as TransactionsImport[];
      return (
        <ComboSelectFilter
          options={transactionsImports
            .map(transactionsImport => ({
              value: transactionsImport.id,
              label: `${transactionsImport.source} - ${transactionsImport.name}`,
            }))
            .sort(sortSelectOptions)}
          {...props}
        />
      );
    },
    valueRenderer: ({ value, meta }) => {
      const transactionsImport = meta.transactionsImports?.find(transactionsImport => transactionsImport.id === value);
      if (!transactionsImport) {
        return '';
      } else {
        return `${transactionsImport.source} - ${truncate(transactionsImport.name, { length: 15 })}`;
      }
    },
  },
};

const filters = {
  searchTerm: searchFilter.filter,
  status: rowStatusFilter.filter,
  importIds: transactionsImportFilter.filter,
  plaidAccountId: plaidAccountFilter.filter,
};

const queryFilterSchema = z.object({
  limit: integer.default(DEFAULT_PAGE_SIZE),
  offset: integer.default(0),
  searchTerm: searchFilter.schema,
  status: rowStatusFilter.schema,
  importIds: transactionsImportFilterSchema,
  plaidAccountId: plaidAccountFilter.schema,
});

const defaultFilterValues = {
  status: TransactionsImportRowStatus.PENDING,
};

export const OffPlatformTransactions = ({ accountSlug }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [focus, setFocus] = React.useState<{ rowId: string; noteForm?: boolean } | null>(null);
  const [hasNewData, setHasNewData] = React.useState(false);
  const isInitialSync = false; // TODO: Implement this

  // const apolloClient = useApolloClient();
  const [selection, dispatchSelection] = React.useReducer(
    multiPagesRowSelectionReducer,
    MultiPagesRowSelectionInitialState,
  );

  const queryFilterViews = React.useMemo(() => getViews(intl), [intl]);
  const queryFilter = useQueryFilter<typeof queryFilterSchema, OffPlatformTransactionsQueryVariables>({
    defaultFilterValues,
    schema: queryFilterSchema,
    views: queryFilterViews,
    filters,
  });

  const { data, loading, error, refetch } = useQuery<
    OffPlatformTransactionsQuery,
    OffPlatformTransactionsQueryVariables
  >(offPlatformTransactionsQuery, {
    context: API_V2_CONTEXT,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
    variables: {
      hostSlug: accountSlug,
      hasImportFilter: Boolean(queryFilter.variables.importIds?.length),
      importId: queryFilter.variables.importIds?.[0] || 'none', // Apollo validation ignores the @include directive, so we have to provide a value to skip the non-null check
      ...queryFilter.variables,
    },
  });

  const host = data?.host;
  const importRows = host?.offPlatformTransactions?.nodes ?? [];
  const selectedRowIdx = !focus ? -1 : importRows.findIndex(row => row.id === focus.rowId);
  const importData = data?.transactionsImport;

  const { getActions, setRowsStatus } = useOffPlatformTransactionsActions({ host });

  // Clear selection whenever the pagination changes
  React.useEffect(() => {
    dispatchSelection({ type: 'CLEAR' });
  }, [queryFilter.variables]);

  const filtersMeta = React.useMemo(() => {
    return {
      plaidAccounts: importData?.plaidAccounts,
      hostSlug: host?.slug,
      transactionsImports: host?.transactionsImports?.nodes,
    };
  }, [host, importData]);

  const hasPagination = host?.offPlatformTransactions?.totalCount > queryFilter.values.limit;
  // const isInitialSync = Boolean(!importData?.lastSyncAt && importData?.connectedAccount);

  return (
    <div>
      <div className="flex items-center justify-between">
        <DashboardHeader
          className="mb-6"
          title={intl.formatMessage({ defaultMessage: 'Off-platform Transactions', id: 'MlrieI' })}
          titleRoute={`/dashboard/${accountSlug}/off-platform-transactions`}
          description={
            <FormattedMessage
              defaultMessage="Platform transactions imported from <Link>connected sources.</Link>"
              id="MFxlzT"
              values={{
                Link: getI18nLink({
                  as: Link,
                  href: `/dashboard/${accountSlug}/off-platform-connections`,
                  color: 'inherit',
                  textDecoration: 'underline',
                }),
              }}
            />
          }
        />
      </div>
      {loading && !host ? (
        <LoadingPlaceholder height={300} />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !host ? (
        <NotFound />
      ) : (
        // TODO: query error
        <div>
          {/** "Refresh data" action bar */}
          {!hasNewData ? (
            <div className="h-[16px]" />
          ) : (
            <div className="sticky top-0 z-50 flex items-center justify-between rounded-none rounded-br-lg rounded-bl-lg bg-blue-500 px-4 py-2 text-sm text-white animate-in fade-in">
              <span className="flex items-center gap-2">
                <Info size={18} className="text-info" />
                <FormattedMessage
                  defaultMessage="New transactions have been synchronized."
                  id="transactions.import.newData"
                />
              </span>
              <Button
                size="sm"
                variant="ghost"
                loading={loading}
                onClick={async () => {
                  try {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    await refetch();
                    setHasNewData(false);
                  } catch (e) {
                    toast({
                      variant: 'error',
                      title: intl.formatMessage({
                        defaultMessage: 'An error occurred while refreshing the data',
                        id: '7XHoRS',
                      }),
                      message: i18nGraphqlException(intl, e),
                    });
                  }
                }}
              >
                <RotateCcw size={16} />
                &nbsp;
                <FormattedMessage defaultMessage="Refresh" id="refresh" />
              </Button>
            </div>
          )}

          <div className="px-2">
            {/** Tabs & filters */}
            <Filterbar
              className="mb-4"
              {...queryFilter}
              views={addCountsToViews(queryFilter.views, host.offPlatformTransactionsStats)}
              meta={filtersMeta}
            />

            {/** TODO Select all message */}
            {/* {size(selection.rows) === importRows.length && hasPagination && (
                  <div className="flex items-center justify-center rounded-lg bg-neutral-100 p-2 text-sm text-neutral-600">
                    {!selection.includeAllPages ? (
                      <React.Fragment>
                        <FormattedMessage
                          defaultMessage="All {count} rows on this page are selected."
                          id="qMKhWs"
                          values={{ count: importRows.length }}
                        />
                        <Button
                          variant="link"
                          size="xs"
                          onClick={() => dispatchSelection({ type: 'SELECT_ALL_PAGES' })}
                        >
                          <FormattedMessage
                            defaultMessage="Select all {count} rows."
                            id="vbHaiI"
                            values={{ count: importData.rows.totalCount }}
                          />
                        </Button>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <FormattedMessage
                          defaultMessage="All {count} rows are selected."
                          id="1bUrqi"
                          values={{ count: importData.rows.totalCount }}
                        />
                        <Button variant="link" size="xs" onClick={() => dispatchSelection({ type: 'CLEAR' })}>
                          <FormattedMessage defaultMessage="Clear selection" id="EYIw2M" />
                        </Button>
                      </React.Fragment>
                    )}
                  </div>
                )} */}

            {/** Import data table */}
            <div className="relative mt-2">
              {/* TODO {isInitialSync && (
                    <div className="absolute z-50 flex h-full w-full items-center justify-center">
                      <Lottie animationData={SyncAnimation} loop autoPlay className="max-w-[600px]" />
                    </div>
                  )} */}
              <DataTable<OffPlatformTransactionsQuery['host']['offPlatformTransactions']['nodes'][number], unknown>
                loading={loading || isInitialSync}
                getRowClassName={row =>
                  row.original.status === TransactionsImportRowStatus.IGNORED
                    ? '[&>td:nth-child(n+2):nth-last-child(n+3)]:opacity-30'
                    : ''
                }
                enableMultiRowSelection
                rowSelection={selection.rows}
                setRowSelection={rows =>
                  dispatchSelection({ type: 'SET', rows: typeof rows === 'function' ? rows(selection.rows) : rows })
                }
                data={importRows}
                getActions={getActions}
                openDrawer={row => setFocus({ rowId: row.original.id })}
                onClickRow={(row, _, e) => {
                  // Ignore click when on checkbox or "Note" icon
                  if (!(e.target as Element).closest('button')) {
                    setFocus({ rowId: row.original.id });
                  }
                }}
                emptyMessage={() => (
                  <FormattedMessage id="SectionTransactions.Empty" defaultMessage="No transactions yet." />
                )}
                columns={[
                  {
                    id: 'select',
                    header: ({ table }) =>
                      importRows.some(row => !row.expense && !row.order) ? (
                        <Checkbox
                          aria-label="Select all"
                          className="translate-y-[2px] border-neutral-500"
                          checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && 'indeterminate') ||
                            false
                          }
                          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
                        />
                      ) : null,
                    cell: ({ row }) =>
                      !row.original.expense &&
                      !row.original.order && (
                        <Checkbox
                          checked={row.getIsSelected()}
                          aria-label="Select row"
                          className="translate-y-[2px] border-neutral-500"
                          onCheckedChange={value => row.toggleSelected(!!value)}
                        />
                      ),
                  },
                  {
                    header: 'Date',
                    accessorKey: 'date',
                    cell: ({ cell }) => {
                      const date = cell.getValue() as string;
                      return <DateTime value={new Date(date)} />;
                    },
                  },
                  {
                    header: 'Source',
                    cell: ({ row }) => {
                      const transactionsImport = row.original
                        .transactionsImport as (typeof data)['host']['offPlatformTransactions']['nodes'][number]['transactionsImport'];
                      return (
                        <div>
                          <div className="mb-1 font-medium">{transactionsImport.source}</div>
                          <div className="text-sm text-neutral-500">{transactionsImport.name}</div>
                        </div>
                      );
                    },
                  },
                  {
                    header: 'Collective',
                    cell: ({ row }) => {
                      const importRow =
                        row.original as (typeof data)['host']['offPlatformTransactions']['nodes'][number];
                      const assigned = importRow.assignedAccounts;
                      if (!assigned.length) {
                        return '-';
                      } else {
                        // TODO use a dedicated component that truncates
                        return assigned.map(account => <Avatar key={account.id} collective={account} size={24} />); // TODO: Add tooltip with account name
                      }
                    },
                  },
                  {
                    header: 'Description',
                    accessorKey: 'description',
                    cell: ({ cell }) => <p className="max-w-xs">{cell.getValue() as string}</p>,
                  },
                  {
                    header: 'Amount',
                    accessorKey: 'amount',
                    cell: ({ cell }) => {
                      const amount = cell.getValue() as Amount;
                      const isCredit = amount.valueInCents > 0;
                      return (
                        <div
                          className={cn('font-semibold antialiased', isCredit ? 'text-green-600' : 'text-slate-700')}
                        >
                          {amount.valueInCents > 0 ? '+' : ''}
                          <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />
                        </div>
                      );
                    },
                  },
                  {
                    header: 'Status',
                    cell: ({ row }) => {
                      return <TransactionsImportRowStatusBadge row={row.original} />;
                    },
                  },
                  {
                    header: 'Match',
                    cell: ({ row }) => {
                      if (row.original.expense) {
                        return (
                          <StyledLink
                            className="flex items-center gap-1"
                            href={`/${row.original.expense.account.slug}/expenses/${row.original.expense.legacyId}`}
                          >
                            <Avatar collective={row.original.expense.account} size={24} />
                            <FormattedMessage
                              id="E9pJQz"
                              defaultMessage="Expense #{id}"
                              values={{ id: row.original.expense.legacyId }}
                            />
                          </StyledLink>
                        );
                      } else if (row.original.order) {
                        return (
                          <StyledLink
                            className="flex items-center gap-1"
                            href={`/${row.original.order.toAccount.slug}/contributions/${row.original.order.legacyId}`}
                          >
                            <Avatar collective={row.original.order.toAccount} size={24} />
                            <FormattedMessage
                              id="Siv4wU"
                              defaultMessage="Contribution #{id}"
                              values={{ id: row.original.order.legacyId }}
                            />
                          </StyledLink>
                        );
                      } else {
                        return '-';
                      }
                    },
                  },
                  {
                    header: 'Note',
                    accessorKey: 'note',
                    cell: ({ row, cell }) => {
                      const hasNote = Boolean(cell.getValue());
                      return (
                        <Button
                          className="relative"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setFocus({ rowId: row.original.id, noteForm: true })}
                        >
                          <MessageCircle size={16} className={hasNote ? 'text-neutral-600' : 'text-neutral-300'} />
                          {hasNote && (
                            <div className="absolute top-[6px] right-[6px] flex h-[8px] w-[8px] items-center justify-center rounded-full bg-yellow-400 text-xs text-white"></div>
                          )}
                        </Button>
                      );
                    },
                  },
                  {
                    id: 'actions',
                    ...actionsColumn,
                    header: ({ table }) => {
                      const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
                      const includeAllPages = selection.includeAllPages;
                      const rowsActions = getPossibleActionsForSelectedRows(selectedRows);
                      return (
                        <div className="flex min-w-36 justify-end">
                          {includeAllPages ||
                          rowsActions.canIgnore.length ||
                          rowsActions.canRestore.length ||
                          rowsActions.canPutOnHold.length ? (
                            <div className="flex gap-1">
                              {(includeAllPages || rowsActions.canRestore.length > 0) && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="text-xs whitespace-nowrap"
                                  onClick={async () => {
                                    await setRowsStatus(rowsActions.canRestore, TransactionsImportRowStatus.PENDING, {
                                      includeAllPages,
                                    });
                                    table.setRowSelection({});
                                  }}
                                >
                                  <SquareSlashIcon size={12} />
                                  {includeAllPages ? (
                                    <FormattedMessage defaultMessage="Restore all rows" id="8uECrb" />
                                  ) : (
                                    <FormattedMessage
                                      defaultMessage="Restore {selectedCount}"
                                      id="restore"
                                      values={{ selectedCount: rowsActions.canRestore.length }}
                                    />
                                  )}
                                </Button>
                              )}

                              {(includeAllPages || rowsActions.canIgnore.length > 0) && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="text-xs whitespace-nowrap"
                                  onClick={async () => {
                                    await setRowsStatus(rowsActions.canIgnore, TransactionsImportRowStatus.IGNORED, {
                                      includeAllPages,
                                    });
                                    table.setRowSelection({});
                                  }}
                                >
                                  <SquareSlashIcon size={12} />
                                  {includeAllPages ? (
                                    <FormattedMessage defaultMessage="No action (all)" id="UFhJFs" />
                                  ) : (
                                    <FormattedMessage
                                      defaultMessage="No action ({selectedCount})"
                                      id="B2eNk+"
                                      values={{ selectedCount: rowsActions.canIgnore.length }}
                                    />
                                  )}
                                </Button>
                              )}

                              {(includeAllPages || rowsActions.canPutOnHold.length > 0) && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="text-xs whitespace-nowrap"
                                  onClick={async () => {
                                    await setRowsStatus(rowsActions.canPutOnHold, TransactionsImportRowStatus.ON_HOLD, {
                                      includeAllPages,
                                    });
                                    table.setRowSelection({});
                                  }}
                                >
                                  <PauseCircle size={12} />
                                  {includeAllPages ? (
                                    <FormattedMessage defaultMessage="Put all on hold" id="putAllOnHold" />
                                  ) : (
                                    <FormattedMessage
                                      defaultMessage="Put on hold ({selectedCount})"
                                      id="putOnHoldCount"
                                      values={{ selectedCount: rowsActions.canPutOnHold.length }}
                                    />
                                  )}
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <FormattedMessage
                                defaultMessage="Actions"
                                id="CollectivePage.NavBar.ActionMenu.Actions"
                              />
                            </div>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
              />
              <div className="mt-8">
                <Pagination queryFilter={queryFilter} total={data?.host?.offPlatformTransactions.totalCount} />
              </div>
            </div>
          </div>
        </div>
      )}
      <TransactionsImportRowDrawer
        row={importRows?.[selectedRowIdx]}
        open={Boolean(selectedRowIdx !== -1)}
        onOpenChange={() => setFocus(null)}
        getActions={getActions}
        rowIndex={selectedRowIdx}
        autoFocusNoteForm={focus?.noteForm}
      />
    </div>
  );
};
