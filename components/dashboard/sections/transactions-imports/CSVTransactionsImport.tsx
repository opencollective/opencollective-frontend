import React from 'react';
import { gql, useApolloClient, useQuery } from '@apollo/client';
import { truncate } from 'lodash';
import Lottie from 'lottie-react';
import {
  Calendar,
  CalendarClock,
  Download,
  FilePenLine,
  FileSliders,
  Info,
  MessageCircle,
  RotateCcw,
  Settings,
  Target,
  Upload,
} from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../../lib/errors';
import { formatFileSize } from '../../../../lib/file-utils';
import type { FilterConfig } from '../../../../lib/filters/filter-types';
import { integer } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import {
  type TransactionsImportQuery,
  type TransactionsImportQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import type { Account, Amount } from '../../../../lib/graphql/types/v2/schema';
import { TransactionsImportRowStatus } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { i18nTransactionsRowStatus } from '../../../../lib/i18n/transactions-import-row';
import { cn, sortSelectOptions } from '../../../../lib/utils';
import { useTransactionsImportActions } from './lib/actions';
import {
  TransactionsImportAssignmentFieldsFragment,
  TransactionsImportRowFieldsFragment,
  TransactionsImportStatsFragment,
} from './lib/graphql';
import { getPossibleActionsForSelectedRows } from './lib/table-selection';

import { accountingCategoryFields } from '@/components/expenses/graphql/fragments';

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
import type { StepItem } from '../../../ui/Stepper';
import { Step, Stepper } from '../../../ui/Stepper';
import { useToast } from '../../../ui/useToast';
import DashboardHeader from '../../DashboardHeader';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { Pagination } from '../../filters/Pagination';
import { searchFilter } from '../../filters/SearchFilter';

import { ImportProgressBadge } from './ImportProgressBadge';
import { StepMapCSVColumns } from './StepMapCSVColumns';
import { StepSelectCSV } from './StepSelectCSV';
import { TransactionsImportRowDrawer } from './TransactionsImportRowDrawer';
import { TransactionsImportRowsBatchActionsBar } from './TransactionsImportRowsBatchActionsBar';
import { TransactionsImportRowStatusBadge } from './TransactionsImportRowStatusBadge';
import TransactionsImportSettingsModal from './TransactionsImportSettingsModal';

const getSteps = (intl: IntlShape): StepItem[] => {
  const getPrefix = stepNum => intl.formatMessage({ defaultMessage: 'Step {stepNum}:', id: 'Z9Dody' }, { stepNum });
  return [
    {
      id: 'import-csv',
      icon: Upload,
      label: `${getPrefix(1)} ${intl.formatMessage({ defaultMessage: 'Select CSV', id: '1s14km' })}`,
    },
    {
      id: 'map-csv',
      icon: FileSliders,
      label: `${getPrefix(2)} ${intl.formatMessage({ defaultMessage: 'Map columns', id: 'rcGwE8' })}`,
    },
    {
      id: 'process',
      icon: FilePenLine,
      label: `${getPrefix(3)} ${intl.formatMessage({ defaultMessage: 'Edit & process data', id: '06H44P' })}`,
    },
  ];
};

const transactionsImportHostFieldsFragment = gql`
  fragment TransactionsImportHostFields on Host {
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
  }
  ${accountingCategoryFields}
`;

const transactionsImportQuery = gql`
  query TransactionsImport(
    $importId: NonEmptyString!
    $limit: Int = 50
    $offset: Int = 0
    $status: TransactionsImportRowStatus
    $searchTerm: String
    $fetchOnlyRowIds: Boolean!
  ) {
    transactionsImport(id: $importId) {
      id
      source
      name
      lastSyncAt
      isSyncing
      lastSyncCursor
      file {
        id
        url
        name
        type
        size
      }
      stats {
        ...TransactionsImportStats
      }
      type
      csvConfig
      createdAt
      updatedAt
      assignments {
        ...TransactionsImportAssignmentFields
      }
      plaidAccounts {
        accountId
        mask
        name
        officialName
        subtype
        type
      }
      connectedAccount {
        id
      }
      account @skip(if: $fetchOnlyRowIds) {
        id
        legacyId
        slug
        currency
        policies {
          REQUIRE_2FA_FOR_ADMINS
        }
        ... on AccountWithHost {
          host {
            ...TransactionsImportHostFields
          }
        }
        ... on Organization {
          host {
            ...TransactionsImportHostFields
          }
        }
      }
      rows(limit: $limit, offset: $offset, status: $status, searchTerm: $searchTerm) {
        totalCount
        offset
        limit
        nodes {
          id
          ...TransactionsImportRowFields @skip(if: $fetchOnlyRowIds)
          transactionsImport @skip(if: $fetchOnlyRowIds) {
            id
            source
            name
          }
        }
      }
    }
  }
  ${TransactionsImportRowFieldsFragment}
  ${transactionsImportHostFieldsFragment}
  ${TransactionsImportStatsFragment}
  ${TransactionsImportAssignmentFieldsFragment}
`;

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

const filters = {
  searchTerm: searchFilter.filter,
  status: rowStatusFilter.filter,
};

const queryFilterSchema = z.object({
  limit: integer.default(DEFAULT_PAGE_SIZE),
  offset: integer.default(0),
  searchTerm: searchFilter.schema,
  status: rowStatusFilter.schema,
});

const defaultFilterValues = {
  status: TransactionsImportRowStatus.PENDING,
};

export const CSVTransactionsImport = ({ accountSlug, importId }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const steps = React.useMemo(() => getSteps(intl), [intl]);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [focus, setFocus] = React.useState<{ rowId: string; noteForm?: boolean } | null>(null);
  const [hasNewData, setHasNewData] = React.useState(false);
  const [hasRequestedSync, setHasRequestedSync] = React.useState(false);
  const [hasSettingsModal, setHasSettingsModal] = React.useState(false);
  const apolloClient = useApolloClient();
  const [selection, dispatchSelection] = React.useReducer(
    multiPagesRowSelectionReducer,
    MultiPagesRowSelectionInitialState,
  );

  const queryFilterViews = React.useMemo(() => getViews(intl), [intl]);
  const queryFilter = useQueryFilter<typeof queryFilterSchema, TransactionsImportQueryVariables>({
    defaultFilterValues,
    schema: queryFilterSchema,
    views: queryFilterViews,
    filters,
  });

  const { data, previousData, loading, error, refetch, variables } = useQuery<
    TransactionsImportQuery,
    TransactionsImportQueryVariables
  >(transactionsImportQuery, {
    context: API_V2_CONTEXT,
    variables: { importId, ...queryFilter.variables, fetchOnlyRowIds: false },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });

  const importData = data?.transactionsImport || previousData?.transactionsImport;
  const importType = importData?.type;
  const hasStepper = !importData?.file;
  const importRows = importData?.rows?.nodes ?? [];
  const selectedRowIdx = !focus ? -1 : importRows.findIndex(row => row.id === focus.rowId);

  const { getActions, setRowsStatus } = useTransactionsImportActions({
    host: importData?.account?.['host'],
    getAllRowsIds: async () => {
      const { data, error } = await apolloClient.query<TransactionsImportQuery, TransactionsImportQueryVariables>({
        query: transactionsImportQuery,
        context: API_V2_CONTEXT,
        variables: { ...variables, limit: 100_000, fetchOnlyRowIds: true },
      });

      if (error) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
      } else {
        return data.transactionsImport.rows.nodes.map(row => row.id) || [];
      }
    },
  });

  // Clear selection whenever the pagination changes
  React.useEffect(() => {
    dispatchSelection({ type: 'CLEAR' });
  }, [queryFilter.variables]);

  const isInitialSync = Boolean(!importData?.lastSyncAt && importData?.connectedAccount);
  return (
    <div>
      <DashboardHeader
        className="mb-6"
        title="CSV Imports"
        titleRoute={`/dashboard/${accountSlug}/ledger-csv-imports`}
        subpathTitle={
          importData
            ? `${truncate(importData.source, { length: 25 })} - ${truncate(importData.name, { length: 25 })}`
            : `#${importId.split('-')[0]}`
        }
      />
      {loading && !importData ? (
        <LoadingPlaceholder height={300} />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !importData || importData.account.slug !== accountSlug || !['CSV', 'MANUAL'].includes(importType) ? (
        <NotFound />
      ) : (
        <React.Fragment>
          {hasStepper && (
            <Stepper initialStep={0} steps={steps} orientation="vertical" className="mb-4">
              {steps.map(stepProps => {
                return (
                  <Step key={stepProps.id} {...stepProps}>
                    {stepProps.id === 'import-csv' ? (
                      <StepSelectCSV onFileSelected={setCsvFile} />
                    ) : stepProps.id === 'map-csv' ? (
                      <StepMapCSVColumns
                        importId={importId}
                        file={csvFile}
                        currency={(importData.account as Account).currency}
                        onSuccess={refetch}
                      />
                    ) : null}
                  </Step>
                );
              })}
            </Stepper>
          )}
          {!hasStepper && (
            <div>
              {/** Import details (creation date, last update, file info) */}
              <div
                className={cn(
                  'border border-neutral-200 bg-white p-4 text-base shadow-xs',
                  hasNewData ? 'rounded-tl-lg rounded-tr-lg border-b-0' : 'rounded-lg',
                )}
              >
                <div className="flex justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <CalendarClock size={16} />
                        <div className="text-sm font-bold sm:text-base">
                          <FormattedMessage defaultMessage="Last update" id="transactions.import.lastUpdate" />
                        </div>
                      </div>
                      <DateTime value={new Date(importData.updatedAt)} timeStyle="short" />
                    </div>

                    <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <div className="font-bold">
                          <FormattedMessage defaultMessage="Created on" id="transactions.import.createdOn" />
                        </div>
                      </div>
                      <DateTime value={new Date(importData.createdAt)} timeStyle="short" />
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <Target size={16} />
                        <div className="font-bold">
                          <FormattedMessage defaultMessage="Processed" id="TransactionsImport.processed" />
                        </div>
                      </div>
                      <ImportProgressBadge
                        progress={!importData.stats.total ? null : importData.stats.processed / importData.stats.total}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      {importData.file && (
                        <Link
                          className="flex gap-1 align-middle hover:underline"
                          openInNewTab
                          href={importData.file.url}
                          title={importData.file.name}
                        >
                          <Button size="xs" variant="outline">
                            <Download size={16} />
                            <span className="inline-block max-w-52 truncate">{importData.file.name}</span> (
                            {formatFileSize(importData.file.size)})
                          </Button>
                        </Link>
                      )}
                      <Button size="xs" variant="outline" onClick={() => setHasSettingsModal(true)}>
                        <Settings size={16} />
                        <span className="hidden sm:inline">
                          <FormattedMessage defaultMessage="Settings" id="Settings" />
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/** "Refresh data" action bar */}
              {!hasNewData ? (
                <div className="h-[51px]" />
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
                  views={addCountsToViews(queryFilter.views, importData?.stats)}
                />

                {/** Select all message */}
                <TransactionsImportRowsBatchActionsBar
                  rows={importRows}
                  selection={selection}
                  dispatchSelection={dispatchSelection}
                  setRowsStatus={setRowsStatus}
                  totalCount={importData?.rows.totalCount}
                />

                {/** Import data table */}
                <div className="relative mt-2">
                  {isInitialSync && (
                    <div className="absolute z-50 flex h-full w-full items-center justify-center">
                      <Lottie animationData={SyncAnimation} loop autoPlay className="max-w-[600px]" />
                    </div>
                  )}
                  <DataTable<TransactionsImportQuery['transactionsImport']['rows']['nodes'][number], unknown>
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
                              className={cn(
                                'font-semibold antialiased',
                                isCredit ? 'text-green-600' : 'text-slate-700',
                              )}
                            >
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
                        header: () => (
                          <FormattedMessage defaultMessage="Actions" id="CollectivePage.NavBar.ActionMenu.Actions" />
                        ),
                      },
                    ]}
                  />
                  <div className="mt-8">
                    <Pagination queryFilter={queryFilter} total={data?.transactionsImport?.rows.totalCount} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </React.Fragment>
      )}
      <TransactionsImportRowDrawer
        row={importRows?.[selectedRowIdx]}
        open={Boolean(selectedRowIdx !== -1)}
        onOpenChange={() => setFocus(null)}
        getActions={getActions}
        rowIndex={selectedRowIdx}
        autoFocusNoteForm={focus?.noteForm}
      />
      {hasSettingsModal && (
        <TransactionsImportSettingsModal
          host={importData?.account?.['host']}
          transactionsImport={importData}
          onOpenChange={setHasSettingsModal}
          hasRequestedSync={hasRequestedSync}
          setHasRequestedSync={setHasRequestedSync}
          isOpen={hasSettingsModal}
        />
      )}
    </div>
  );
};
