import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { fromPairs, omit, partition } from 'lodash';
import {
  ArchiveRestore,
  Banknote,
  Calendar,
  CalendarClock,
  Download,
  FilePenLine,
  FileSliders,
  Merge,
  Receipt,
  SquareSlashIcon,
  Upload,
} from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { formatFileSize } from '../../../../lib/file-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { Amount, TransactionsImportRow } from '../../../../lib/graphql/types/v2/graphql';
import { TransactionsImportRowFieldsFragment, updateTransactionsImportRows } from './lib/graphql';

import Avatar from '../../../Avatar';
import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import NotFound from '../../../NotFound';
import StyledLink from '../../../StyledLink';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import type { StepItem } from '../../../ui/Stepper';
import { Step, Stepper } from '../../../ui/Stepper';
import { useToast } from '../../../ui/useToast';
import DashboardHeader from '../../DashboardHeader';

import { AddFundsModalFromImportRow } from './AddFundsModalFromTransactionsImportRow';
import { MatchContributionDialog } from './MatchContributionDialog';
import { StepMapCSVColumns } from './StepMapCSVColumns';
import { StepSelectCSV } from './StepSelectCSV';

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

type OperationType = 'ignore' | 'add-funds' | 'match';
type RowsOperationsState = Record<string, OperationType>;

const isOperationWithModal = (operation: OperationType): operation is 'add-funds' | 'match' => {
  return ['add-funds', 'match'].includes(operation);
};

const getModalToDisplay = (operations: RowsOperationsState, importRows: TransactionsImportRow[] | undefined) => {
  const entry = Object.entries(operations).find(([, op]) => isOperationWithModal(op));
  if (!entry) {
    return null;
  }

  const [rowId, operation] = entry;
  const row = importRows?.find(r => r.id === rowId);
  if (!row) {
    return null;
  }

  return { row, operation };
};

export const TransactionsImport = ({ accountSlug, importId }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const steps = React.useMemo(() => getSteps(intl), [intl]);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);
  const [currentOperations, setCurrentOperations] = React.useState<RowsOperationsState>({});
  const [updateRows] = useMutation(updateTransactionsImportRows, { context: API_V2_CONTEXT });
  const { data, loading, error } = useQuery(transactionsImportQuery, {
    context: API_V2_CONTEXT,
    variables: { importId },
  });
  const importData = data?.transactionsImport;
  const importType = importData?.type;
  const hasStepper = importType === 'CSV' && !importData?.rows?.totalCount;
  const importRows = importData?.rows?.nodes;
  const modalInfo = getModalToDisplay(currentOperations, importRows);
  const setRowsDismissed = async (rowIds: string[], isDismissed: boolean) => {
    const newOperations: RowsOperationsState = fromPairs(rowIds.map(id => [id, 'ignore']));
    setCurrentOperations(operations => ({ ...operations, ...newOperations }));
    try {
      await updateRows({
        variables: {
          importId,
          rows: rowIds.map(id => ({ id, isDismissed })),
        },
      });
    } catch (error) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
    } finally {
      setCurrentOperations(operations => omit(operations, rowIds));
    }
  };

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
                </div>
              </div>

              {/** Import data table */}
              <DataTable<TransactionsImportRow, unknown>
                loading={loading}
                getRowClassName={row =>
                  row.original.isDismissed ? '[&>td:nth-child(n+2):nth-last-child(n+3)]:opacity-30' : ''
                }
                data={importRows}
                columns={[
                  {
                    id: 'select',
                    header: ({ table }) =>
                      !importRows.length ? null : (
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
                      ),
                    cell: ({ row }) => (
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
                            href={`${row.original.expense.account.slug}/expenses/${row.original.expense.legacyId}`}
                          >
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
                      if (row.original.isDismissed) {
                        return (
                          <Badge size="sm">
                            <FormattedMessage defaultMessage="Ignored" id="transaction.ignored" />
                          </Badge>
                        );
                      } else if (row.original.expense || row.original.order) {
                        return (
                          <Badge type="success" size="sm">
                            <FormattedMessage defaultMessage="Imported" id="transaction.imported" />
                          </Badge>
                        );
                      } else {
                        return (
                          <Badge type="info" size="sm">
                            <FormattedMessage defaultMessage="Pending" id="transaction.pending" />
                          </Badge>
                        );
                      }
                    },
                  },
                  {
                    id: 'actions',
                    header: ({ table }) => {
                      if (table.getIsSomePageRowsSelected() || table.getIsAllPageRowsSelected()) {
                        const selectedRows = table.getSelectedRowModel().rows;
                        const unprocessedRows = selectedRows.filter(
                          ({ original }) => !original.expense && !original.order,
                        );
                        const [ignoredRows, nonIgnoredRows] = partition(
                          unprocessedRows,
                          row => row.original.isDismissed,
                        );

                        if (ignoredRows.length && !nonIgnoredRows.length) {
                          // If all non-processed rows are dismissed, show restore button
                          return (
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
                          );
                        } else if (nonIgnoredRows.length) {
                          // Otherwise, show ignore button
                          return (
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
                          );
                        }
                      } else {
                        return (
                          <div>
                            <FormattedMessage defaultMessage="Actions" id="CollectivePage.NavBar.ActionMenu.Actions" />
                          </div>
                        );
                      }
                    },
                    meta: { className: 'text-right' },
                    cell: ({ row }) => {
                      const item = row.original;
                      const isImported = Boolean(item.expense || item.order);
                      return (
                        <div className="flex justify-end gap-2">
                          {/** Create/Match */}
                          {isImported ? null : item.isDismissed ? ( // We don't support reverting imported rows yet
                            <Button
                              variant="outline"
                              size="xs"
                              className="text-xs"
                              disabled={Boolean(currentOperations[item.id] || modalInfo)}
                              loading={currentOperations[item.id] === 'ignore'}
                              onClick={() => setRowsDismissed([item.id], false)}
                            >
                              <ArchiveRestore size={12} />
                              <FormattedMessage defaultMessage="Revert" id="amT0Gh" />
                            </Button>
                          ) : (
                            <React.Fragment>
                              {/** Contributions */}
                              {item.amount.valueInCents > 0 && (
                                <React.Fragment>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    className="text-xs"
                                    onClick={() => setCurrentOperations({ ...currentOperations, [item.id]: 'match' })}
                                    disabled={Boolean(modalInfo)}
                                  >
                                    <Merge size={12} />
                                    <FormattedMessage defaultMessage="Match" id="contribution.match" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    className="whitespace-nowrap text-xs"
                                    disabled={Boolean(modalInfo)}
                                    onClick={() =>
                                      setCurrentOperations({ ...currentOperations, [item.id]: 'add-funds' })
                                    }
                                  >
                                    <Banknote size="14" />
                                    <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
                                  </Button>
                                </React.Fragment>
                              )}
                              {/** Expenses */}
                              {item.amount.valueInCents < 0 && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="whitespace-nowrap text-xs"
                                  disabled
                                  onClick={() => {}}
                                >
                                  <Receipt size={12} />
                                  <FormattedMessage defaultMessage="Create Expense" id="IqqndK" />
                                </Button>
                              )}
                              {/** Ignore */}
                              <Button
                                variant="outline"
                                size="xs"
                                className="min-w-20 text-xs"
                                disabled={Boolean(currentOperations[item.id] || modalInfo)}
                                loading={currentOperations[item.id] === 'ignore'}
                                onClick={() => setRowsDismissed([item.id], !item.isDismissed)}
                              >
                                <SquareSlashIcon size={12} />
                                <FormattedMessage defaultMessage="Ignore" id="paBpxN" />
                              </Button>
                            </React.Fragment>
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
      {modalInfo &&
        (modalInfo.operation === 'add-funds' ? (
          <AddFundsModalFromImportRow
            transactionsImport={importData}
            row={modalInfo.row}
            onClose={() => setCurrentOperations(omit(currentOperations, modalInfo.row.id))}
          />
        ) : modalInfo.operation === 'match' ? (
          <MatchContributionDialog
            transactionsImport={importData}
            host={importData.account}
            row={modalInfo.row}
            onClose={() => setCurrentOperations(omit(currentOperations, modalInfo.row.id))}
          />
        ) : null)}
    </div>
  );
};
