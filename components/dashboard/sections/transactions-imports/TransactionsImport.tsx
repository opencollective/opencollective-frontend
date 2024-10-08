import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { partition } from 'lodash';
import {
  Calendar,
  CalendarClock,
  Download,
  FilePenLine,
  FileSliders,
  RefreshCcw,
  Settings,
  SquareSlashIcon,
  Upload,
} from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatFileSize } from '../../../../lib/file-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  Amount,
  TransactionsImportQuery,
  TransactionsImportQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { useTransactionsImportActions } from './lib/actions';
import { TransactionsImportRowFieldsFragment } from './lib/graphql';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import NotFound from '../../../NotFound';
import StyledLink from '../../../StyledLink';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import type { StepItem } from '../../../ui/Stepper';
import { Step, Stepper } from '../../../ui/Stepper';
import DashboardHeader from '../../DashboardHeader';

import { StepMapCSVColumns } from './StepMapCSVColumns';
import { StepSelectCSV } from './StepSelectCSV';
import { TransactionsImportRowDrawer } from './TransactionsImportRowDrawer';
import { TransactionsImportRowStatus } from './TransactionsImportRowStatus';

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

const transactionsImportQuery = gql`
  query TransactionsImport($importId: String!) {
    transactionsImport(id: $importId) {
      id
      source
      name
      file {
        id
        url
        name
        type
        size
      }
      stats {
        total
        ignored
        expenses
        orders
        processed
      }
      type
      csvConfig
      createdAt
      updatedAt
      account {
        id
        name
        legalName
        imageUrl
        legacyId
        slug
        currency
        type
      }
      rows {
        totalCount
        offset
        limit
        nodes {
          ...TransactionsImportRowFields
        }
      }
    }
  }
  ${TransactionsImportRowFieldsFragment}
`;

export const TransactionsImport = ({ accountSlug, importId }) => {
  const intl = useIntl();
  const steps = React.useMemo(() => getSteps(intl), [intl]);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [drawerRowId, setDrawerRowId] = React.useState<string | null>(null);
  const { data, loading, error } = useQuery<TransactionsImportQuery, TransactionsImportQueryVariables>(
    transactionsImportQuery,
    {
      context: API_V2_CONTEXT,
      variables: { importId },
    },
  );

  const importData = data?.transactionsImport;
  const importType = importData?.type;
  const hasStepper = importType === 'CSV' && !importData?.rows?.totalCount;
  const importRows = importData?.rows?.nodes ?? [];
  const selectedRowIdx = importRows.findIndex(row => row.id === drawerRowId);

  const { getActions, setRowsDismissed } = useTransactionsImportActions({
    transactionsImport: importData,
    host: importData?.account,
  });

  return (
    <div>
      <DashboardHeader
        title="Transactions Imports"
        subpathTitle={importData ? `${importData.source} - ${importData.name}` : `#${importId.split('-')[0]}`}
        titleRoute={`/dashboard/${accountSlug}/host-transactions/import`}
        className="mb-5"
      />
      {loading ? (
        <LoadingPlaceholder height={300} />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !importData || importData.account.slug !== accountSlug ? (
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
                      <StepMapCSVColumns importId={importId} file={csvFile} currency={importData.account.currency} />
                    ) : null}
                  </Step>
                );
              })}
            </Stepper>
          )}
          {!hasStepper && (
            <div>
              {/** Import details (creation date, last update, file info) */}
              <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-4 text-base shadow-sm">
                <div className="flex justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <div className="font-bold">
                        <FormattedMessage defaultMessage="Created on" id="transactions.import.createdOn" />
                      </div>
                      <DateTime value={new Date(importData.createdAt)} timeStyle="short" />
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock size={16} />
                      <div className="font-bold">
                        <FormattedMessage defaultMessage="Last update" id="transactions.import.lastUpdate" />
                      </div>
                      <DateTime value={new Date(importData.updatedAt)} timeStyle="short" />
                    </div>
                  </div>
                  {importData.file && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <Download size={16} />
                        <div className="font-bold">
                          <FormattedMessage defaultMessage="File" id="gyrIEl" />
                        </div>
                      </div>
                      <a
                        className="flex gap-1 align-middle hover:underline"
                        href={importData.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="inline-block max-w-72 truncate">{importData.file.name}</span> (
                        {formatFileSize(importData.file.size)})
                      </a>
                    </div>
                  )}
                  {importData.type === 'PLAID' && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <Button size="xs" variant="outline" onClick={() => {}} disabled>
                          <RefreshCcw size={16} />
                          <FormattedMessage defaultMessage="Sync" id="dKtz/9" />
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => {}} disabled>
                          <Settings size={16} />
                          <FormattedMessage defaultMessage="Import Settings" id="Db2MC3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/** Import data table */}
              <DataTable<TransactionsImportQuery['transactionsImport']['rows']['nodes'][number], unknown>
                loading={loading}
                getRowClassName={row =>
                  row.original.isDismissed ? '[&>td:nth-child(n+2):nth-last-child(n+3)]:opacity-30' : ''
                }
                data={importRows}
                getActions={getActions}
                openDrawer={row => setDrawerRowId(row.original.id)}
                columns={[
                  {
                    id: 'select',
                    header: ({ table }) =>
                      importRows.some(row => !row.expense && !row.order) ? (
                        <Checkbox
                          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
                          aria-label="Select all"
                          className="translate-y-[2px] border-neutral-500"
                          checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && 'indeterminate') ||
                            false
                          }
                        />
                      ) : null,
                    cell: ({ row }) =>
                      !row.original.expense &&
                      !row.original.order && (
                        <Checkbox
                          checked={row.getIsSelected()}
                          onCheckedChange={value => row.toggleSelected(!!value)}
                          aria-label="Select row"
                          className="translate-y-[2px] border-neutral-500"
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
                    header: 'Amount',
                    accessorKey: 'amount',
                    cell: ({ cell }) => {
                      const amount = cell.getValue() as Amount;
                      return <FormattedMoneyAmount amount={amount.valueInCents} currency={amount.currency} />;
                    },
                  },
                  {
                    header: 'Description',
                    accessorKey: 'description',
                    cell: ({ cell }) => <p className="max-w-xs">{cell.getValue() as string}</p>,
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
                    header: 'Status',
                    cell: ({ row }) => {
                      return <TransactionsImportRowStatus row={row.original} />;
                    },
                  },
                  {
                    id: 'actions',
                    ...actionsColumn,
                    header: ({ table }) => {
                      const selectedRows = table.getSelectedRowModel().rows;
                      const unprocessedRows = selectedRows.filter(
                        ({ original }) => !original.expense && !original.order,
                      );
                      const [ignoredRows, nonIgnoredRows] = partition(unprocessedRows, row => row.original.isDismissed);
                      return (
                        <div className="flex min-w-36 justify-end">
                          {ignoredRows.length && !nonIgnoredRows.length ? (
                            //  If all non-processed rows are dismissed, show restore button
                            <Button
                              variant="outline"
                              size="xs"
                              className="whitespace-nowrap text-xs"
                              onClick={async () => {
                                const ignoredIds = ignoredRows.map(row => row.original.id);
                                await setRowsDismissed(ignoredIds, false);
                                table.setRowSelection({});
                              }}
                            >
                              <SquareSlashIcon size={12} />
                              <FormattedMessage
                                defaultMessage="Restore {selectedCount}"
                                id="restore"
                                values={{ selectedCount: ignoredRows.length }}
                              />
                            </Button>
                          ) : nonIgnoredRows.length ? (
                            // Otherwise, show ignore button
                            <Button
                              variant="outline"
                              size="xs"
                              className="whitespace-nowrap text-xs"
                              onClick={() => {
                                const ignoredIds = nonIgnoredRows.map(row => row.original.id);
                                setRowsDismissed(ignoredIds, true);
                                table.setRowSelection({});
                              }}
                            >
                              <SquareSlashIcon size={12} />
                              <FormattedMessage
                                defaultMessage="Ignore {selectedCount}"
                                id="ignore"
                                values={{ selectedCount: nonIgnoredRows.length }}
                              />
                            </Button>
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
            </div>
          )}
        </React.Fragment>
      )}
      <TransactionsImportRowDrawer
        row={importRows?.[selectedRowIdx]}
        open={Boolean(selectedRowIdx !== -1)}
        onOpenChange={() => setDrawerRowId(null)}
        getActions={getActions}
        rowIndex={selectedRowIdx}
      />
    </div>
  );
};
