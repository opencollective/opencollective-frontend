import crypto from 'crypto';

import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { parse as parseCSV } from 'csv-parse/sync';
import { deburr, isEmpty, padStart, random, sample } from 'lodash';
import {
  ArchiveRestore,
  ArrowRight,
  Banknote,
  Cog,
  FilePenLine,
  FileSliders,
  Merge,
  Plus,
  Receipt,
  Settings,
  SquareSlashIcon,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import dayjs from '../../../../lib/dayjs';
import { i18nGraphqlException } from '../../../../lib/errors';
import { formatFileSize } from '../../../../lib/file-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { Amount, AmountInput } from '../../../../lib/graphql/types/v2/graphql';
import { cn } from '../../../../lib/utils';

import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import LinkExpense from '../../../LinkExpense';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import StyledDropzone, { DROPZONE_ACCEPT_CSV } from '../../../StyledDropzone';
import StyledLink from '../../../StyledLink';
import { DataTable } from '../../../table/DataTable';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '../../../ui/DropdownMenu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';
import type { StepItem } from '../../../ui/Stepper';
import { Step, Stepper, useStepper } from '../../../ui/Stepper';
import { useToast } from '../../../ui/useToast';
import DashboardHeader from '../../DashboardHeader';

const STEPS = [
  { id: 'import-csv', label: 'Step 1: Import CSV', icon: Upload },
  { id: 'map-csv', label: 'Step 2: Map CSV columns', icon: FileSliders },
  { id: 'process', label: 'Step 3: Edit & process data', icon: FilePenLine },
] satisfies StepItem[];

const StepButtons = ({ onComplete }) => {
  const { nextStep, prevStep, isLastStep, isOptionalStep, activeStep, stepCount } = useStepper();
  if (isLastStep) {
    return null;
  }

  return (
    <div className="mb-4 flex w-full gap-2">
      <Button onClick={prevStep} size="sm" variant="secondary">
        Prev
      </Button>
      <Button
        size="sm"
        onClick={() => {
          nextStep();
          if (activeStep === stepCount - 2) {
            onComplete?.();
          }
        }}
      >
        {isOptionalStep ? 'Skip' : 'Next'}
      </Button>
    </div>
  );
};

const StepImportCSV = ({ onFileSelected }) => {
  const { nextStep } = useStepper();

  return (
    <StyledDropzone
      accept={DROPZONE_ACCEPT_CSV}
      name="transactions-csv"
      isMulti={false}
      collectFilesOnly
      showInstructions
      maxSize={20 * 1024 * 1024}
      onSuccess={acceptedFiles => {
        onFileSelected(acceptedFiles[0]);
        nextStep();
      }}
    />
  );
};

const CSV_PREVIEW_NB_ROWS = 5;

const ACCEPTED_NUMBER_FORMATS = ['1,000.00', '1.000,00'] as const;

const AmountFormatSettingsDropdownMenuContent = ({ value, onChange }) => {
  return (
    <DropdownMenuContent>
      <DropdownMenuLabel>Number Format</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
        {ACCEPTED_NUMBER_FORMATS.map(format => (
          <DropdownMenuRadioItem key={format} value={format}>
            {format}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );
};

const ACCEPTED_DATE_FORMATS = [
  // 2021-09-08T18:16:13.203Z
  'YYYY-MM-DDTHH:mm:ss.SSS[Z]', //  ISO 8601
  'YYYY-MM-DD',
  'MM-DD-YYYY',
  'DD-MM-YYYY',
  'YYYY/MM/DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
] as const;

const DateFormatSettingsDropdownMenuContent = ({ value, onChange }) => {
  return (
    <DropdownMenuContent>
      <DropdownMenuLabel>Date Format</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
        {ACCEPTED_DATE_FORMATS.map(format => (
          <DropdownMenuRadioItem key={format} value={format}>
            {format === 'YYYY-MM-DDTHH:mm:ss.SSS[Z]' ? 'ISO 8601' : format}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );
};

const ColumnSelector = ({ label, selected, columns, onChange, SettingsDropdownMenuContent = null }) => {
  return (
    <div className="flex items-stretch">
      <div className="relative flex items-center rounded-bl-md rounded-tl-md border border-r-0 border-neutral-200 bg-neutral-100 px-3 text-sm font-medium text-neutral-700">
        {label}
      </div>
      <Select onValueChange={onChange} value={selected}>
        <SelectTrigger className={cn('rounded-none', { 'rounded-br-md rounded-tr-md': !SettingsDropdownMenuContent })}>
          <div className="truncate italic text-neutral-800">
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {columns.map(column => (
            <SelectItem value={column} key={column}>
              {column}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {SettingsDropdownMenuContent && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="rounded-bl-none rounded-tl-none border-l-0 px-2"
              aria-label="Configure"
            >
              <Settings size={16} color="#777" />
            </Button>
          </DropdownMenuTrigger>
          <SettingsDropdownMenuContent />
        </DropdownMenu>
      )}
    </div>
  );
};

// TODO add i18n aliases
const AMOUNT_ALIASES = ['amount', 'total', 'price', 'value', 'cost', 'balance', 'payment', 'sum'];
const CREDIT_ALIASES = [
  'credit',
  'in',
  'received',
  'revenue',
  'income',
  'positive',
  'profit',
  'deposit',
  ...AMOUNT_ALIASES,
];
const DEBIT_ALIASES = ['debit', 'out', 'sent', 'expense', 'negative', 'loss', 'withdrawal', ...AMOUNT_ALIASES];
const DATE_ALIASES = [
  'date',
  'time',
  'timestamp',
  'datetime',
  'created',
  'createdat',
  'insertedat',
  'updated',
  'modified',
  'posted',
  'postdate',
];
const DESCRIPTION_ALIASES = [
  'description',
  'note',
  'comment',
  'details',
  'reason',
  'message',
  'memo',
  'label',
  'name',
  'title',
  'subject',
  'body',
  'content',
];

const guessDateFormat = (dateStr: string): (typeof ACCEPTED_DATE_FORMATS)[number] => {
  for (const format of ACCEPTED_DATE_FORMATS) {
    if (dayjs(dateStr, format, true).isValid()) {
      return format;
    }
  }

  return 'YYYY-MM-DD';
};

const guessNumberFormat = (numberStr: string): (typeof ACCEPTED_NUMBER_FORMATS)[number] => {
  // If the number ends with a comma + 2 digits, it's likely a decimal separator
  if (numberStr.match(/\d+,\d{2}$/)) {
    return '1.000,00';
  } else {
    return '1,000.00';
  }
};

const guessCSVConfig = (data: Array<Record<string, string>>): ColumnsSettings => {
  const config: ColumnsSettings = {
    date: { target: undefined, format: undefined },
    credit: { target: undefined, format: ACCEPTED_NUMBER_FORMATS[0] },
    debit: { target: undefined, format: ACCEPTED_NUMBER_FORMATS[0] },
    description: { target: undefined },
  };

  if (data[0]) {
    for (const column of Object.keys(data[0])) {
      const lowerColumn = deburr(column).toLowerCase().replace(/\s/g, '');
      if (!config.date.target && DATE_ALIASES.some(alias => lowerColumn === alias)) {
        config.date.target = column;
        config.date.format = guessDateFormat(data[0][column]);
      }
      if (!config.credit.target && CREDIT_ALIASES.some(alias => lowerColumn === alias)) {
        config.credit.target = column;
        config.credit.format = guessNumberFormat(data[0][column]);
      }
      if (!config.debit.target && DEBIT_ALIASES.some(alias => lowerColumn === alias)) {
        config.debit.target = column;
        config.debit.format = guessNumberFormat(data[0][column]);
      }
      if (!config.description.target && DESCRIPTION_ALIASES.some(alias => lowerColumn === alias)) {
        config.description.target = column;
      }
    }
  }

  return config;
};

const parseCSVFile = async (file): Promise<Array<Record<string, string>>> => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const csvData = reader.result as string;
      try {
        const parsedCSV = parseCSV(csvData, { columns: true, skip_empty_lines: true });
        resolve(parsedCSV);
      } catch (e) {
        const parsedCSV = parseCSV(csvData, { columns: true, skip_empty_lines: true, delimiter: ';' });
        resolve(parsedCSV);
      }
    };

    reader.readAsText(file);
  });
};

const TransactionsImportRowFieldsFragment = gql`
  fragment TransactionsImportRowFields on TransactionsImportRow {
    id
    sourceId
    isDismissed
    description
    date
    amount {
      valueInCents
      currency
    }
    expense {
      id
      legacyId
    }
    order {
      id
      legacyId
    }
  }
`;

type CommonColumnSettings = {
  target: string;
};

type ColumnsSettings = {
  date: CommonColumnSettings & { format: (typeof ACCEPTED_DATE_FORMATS)[number] };
  credit: CommonColumnSettings & { format: string };
  debit: CommonColumnSettings & { format: string };
  description: CommonColumnSettings;
};

const StepMapCSVColumns = ({
  importId,
  file,
  onComplete,
}: {
  file: File;
  importId: string;
  onComplete: () => void;
}) => {
  const { toast } = useToast();
  const intl = useIntl();
  const { nextStep, prevStep } = useStepper();
  const [csvConfig, setCSVConfig] = React.useState<ColumnsSettings>(guessCSVConfig([]));
  const [parsedData, setParsedData] = React.useState(undefined);
  const [importTransactions, { loading }] = useMutation(
    gql`
      mutation UploadTransactionsImport(
        $importId: NonEmptyString!
        $csvConfig: JSONObject
        $data: [TransactionsImportRowInput!]!
      ) {
        importTransactions(id: $importId, csvConfig: $csvConfig, data: $data) {
          id
          rows {
            nodes {
              ...TransactionsImportRowFields
            }
          }
        }
      }
      ${TransactionsImportRowFieldsFragment}
    `,
    { context: API_V2_CONTEXT },
  );

  React.useEffect(() => {
    if (file) {
      parseCSVFile(file).then(parsedCSV => {
        setParsedData(parsedCSV);
        setCSVConfig(guessCSVConfig(parsedCSV));
      });
    }
  }, [file]);

  if (!parsedData) {
    return <LoadingPlaceholder height={300} />;
  } else if (!parsedData[0]) {
    return (
      <div>
        <p>
          <FormattedMessage
            defaultMessage="No data found in the <link>CSV file</link>."
            id="hzvqbc"
            values={{
              link: chunks => (
                <StyledLink openInNewTab href={URL.createObjectURL(file)}>
                  {chunks}
                </StyledLink>
              ),
            }}
          />
        </p>
        <Button onClick={prevStep} size="sm" variant="secondary">
          Go back
        </Button>
      </div>
    );
  }

  const availableColumns = Object.keys(parsedData[0]).filter(Boolean);
  const setColumnTarget = (column, target) =>
    setCSVConfig({ ...csvConfig, [column]: { ...csvConfig[column], target } });
  console.log({
    parsedData,
    csvConfig,
  });
  return (
    <div>
      <p className="mb-4 text-sm">
        File:{' '}
        <StyledLink openInNewTab href={URL.createObjectURL(file)}>
          {file.name} ({formatFileSize(file.size)})
        </StyledLink>
      </p>
      <DataTable
        data={parsedData.slice(0, CSV_PREVIEW_NB_ROWS)}
        columns={[
          {
            id: 'date',
            accessorKey: csvConfig.date.target,
            header: () => (
              <ColumnSelector
                label="Date"
                columns={availableColumns}
                selected={csvConfig.date.target}
                onChange={value => setColumnTarget('date', value)}
                SettingsDropdownMenuContent={() => (
                  <DateFormatSettingsDropdownMenuContent
                    value={csvConfig.date.format}
                    onChange={format => setCSVConfig({ ...csvConfig, date: { ...csvConfig.date, format } })}
                  />
                )}
              />
            ),
            cell: ({ cell }) => {
              const rawDate = cell.getValue() as string;
              if (!rawDate) {
                return null;
              }

              const parsedDate = dayjs(rawDate, csvConfig.date.format, true);
              if (!parsedDate.isValid()) {
                return (
                  <span className="text-red-500">
                    <FormattedMessage defaultMessage="Invalid format" id="akLsfr" />: {rawDate}
                  </span>
                );
              }

              return <DateTime value={parsedDate} />;
            },
          },
          {
            id: 'credit',
            accessorKey: csvConfig.credit.target,
            header: () => (
              <ColumnSelector
                label="Credit"
                columns={availableColumns}
                selected={csvConfig.credit.target}
                onChange={value => setColumnTarget('credit', value)}
                SettingsDropdownMenuContent={() => (
                  <AmountFormatSettingsDropdownMenuContent
                    value={csvConfig.credit.format}
                    onChange={format => setCSVConfig({ ...csvConfig, credit: { ...csvConfig.credit, format } })}
                  />
                )}
              />
            ),

            cell: ({ cell }) => {
              const amount = cell.getValue() as string;
              const parsedAmount = parseAmount(amount, csvConfig.credit.format);
              const debitAndCreditIsSameCol = csvConfig.credit.target === csvConfig.debit.target;
              if (!parsedAmount) {
                return null;
              } else if (debitAndCreditIsSameCol && parsedAmount.valueInCents < 0) {
                return null;
              }
              return <FormattedMoneyAmount amount={parsedAmount.valueInCents} currency={parsedAmount.currency} />;
            },
          },
          {
            id: 'debit',
            accessorKey: csvConfig.debit.target,
            header: () => (
              <ColumnSelector
                label="Debit"
                columns={availableColumns}
                selected={csvConfig.debit.target}
                onChange={value => setColumnTarget('debit', value)}
                SettingsDropdownMenuContent={() => (
                  <AmountFormatSettingsDropdownMenuContent
                    value={csvConfig.debit.format}
                    onChange={format => setCSVConfig({ ...csvConfig, debit: { ...csvConfig.debit, format } })}
                  />
                )}
              />
            ),

            cell: ({ cell }) => {
              const amount = cell.getValue() as string;
              const parsedAmount = parseAmount(amount, csvConfig.debit.format);
              const debitAndCreditIsSameCol = csvConfig.credit.target === csvConfig.debit.target;
              if (!parsedAmount) {
                return null;
              } else if (debitAndCreditIsSameCol && parsedAmount.valueInCents > 0) {
                return null;
              }

              return <FormattedMoneyAmount amount={parsedAmount.valueInCents} currency={parsedAmount.currency} />;
            },
          },
          {
            id: 'description',
            accessorKey: csvConfig.description.target,
            header: () => (
              <ColumnSelector
                label="Description"
                columns={availableColumns}
                selected={csvConfig.description.target}
                onChange={value => setColumnTarget('description', value)}
              />
            ),
          },
        ]}
        footer={
          parsedData.length > 5 && (
            <div className="flex justify-center border-t border-neutral-200 p-3 text-sm font-normal">
              And {parsedData.length - CSV_PREVIEW_NB_ROWS} more rows...
            </div>
          )
        }
      />
      <div className="my-4 flex w-full gap-2">
        <Button onClick={prevStep} size="sm" variant="secondary" disabled={loading}>
          Prev
        </Button>
        <Button
          size="sm"
          loading={loading}
          onClick={async () => {
            try {
              await importTransactions({
                variables: {
                  csvConfig,
                  data: parsedData.map(row => applyCSVConfig(row, csvConfig)),
                  importId,
                },
              });
              onComplete();
              nextStep();
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
          }}
        >
          Import
        </Button>
      </div>
    </div>
  );
};

const parseAmount = (amountInput: string, format) => {
  if (!amountInput) {
    return null;
  }

  if (format === '1.000,00') {
    amountInput = amountInput.replace(/\./g, '').replace(',', '.');
  }

  const currencyRegex = /[A-Z]{3}/;
  let currency = currencyRegex.exec(amountInput)?.[0];
  let valueInCents = Math.abs(parseFloat(amountInput) * 100);
  if (!currency) {
    if (amountInput.startsWith('$')) {
      currency = 'USD';
    } else if (amountInput.startsWith('€')) {
      currency = 'EUR';
    } else if (amountInput.startsWith('£')) {
      currency = 'GBP';
    } else if (amountInput.startsWith('¥')) {
      currency = 'JPY';
    }
  }

  // Handle sign
  if (amountInput.startsWith('-')) {
    valueInCents *= -1;
  }

  return {
    valueInCents: Math.round(valueInCents),
    currency: currency || 'USD', // TODO take from host currency + allow customization
  };
};

const applyCSVConfig = (row, columns: ColumnsSettings) => {
  const amount = parseAmount(row[columns.credit.target] || row[columns.debit.target], columns.credit.format);
  return {
    sourceId: `${row[columns.date.target]}|${amount.valueInCents}|${amount.currency}`,
    description: row[columns.description.target],
    date: dayjs(row[columns.date.target], columns.date.format).toISOString(),
    amount,
  };
};

export const TransactionsImport = ({ accountSlug, importId }) => {
  const router = useRouter();
  const { data, loading } = useQuery(
    gql`
      query TransactionsImport($importId: String!) {
        transactionsImport(id: $importId) {
          id
          source
          name
          url
          type
          csvConfig
          createdAt
          updatedAt
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
    `,
    {
      context: API_V2_CONTEXT,
      variables: { importId },
    },
  );

  const importData = data?.transactionsImport;
  const importType = importData?.type;
  const hasStepper = importType === 'CSV';
  const [ignored, setIgnored] = React.useState(new Set<number>());
  const [transactions, setTransactions] = React.useState([]);
  const [hasCompletedSteps, setHasCompletedSteps] = React.useState(false);
  const [csvFile, setCsvFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (importData && (!hasStepper || router.query.step === 'last')) {
      setHasCompletedSteps(true);
    }
  }, [importData, hasStepper, router.query.step]);

  React.useEffect(() => {
    if (importData?.rows?.nodes) {
      setTransactions(importData.rows.nodes);
    }
  }, [importData]);

  return (
    <div>
      <DashboardHeader
        title="Transactions Imports"
        subpathTitle={importData ? `${importData.source} - ${importData.name}` : `#${importId.split('-')[0]}`}
        titleRoute={`/dashboard/${accountSlug}/host-transactions/import`}
        className="mb-5"
      />
      {hasStepper && (
        <Stepper
          initialStep={router.query.step === 'last' ? STEPS.length - 1 : 0}
          steps={STEPS}
          orientation="vertical"
          className="mb-4"
        >
          {STEPS.map(stepProps => {
            return (
              <Step key={stepProps.id} {...stepProps}>
                {stepProps.id === 'import-csv' ? (
                  <StepImportCSV onFileSelected={setCsvFile} />
                ) : stepProps.id === 'map-csv' ? (
                  <StepMapCSVColumns importId={importId} file={csvFile} onComplete={() => setHasCompletedSteps(true)} />
                ) : null}
              </Step>
            );
          })}
        </Stepper>
      )}
      {hasCompletedSteps && (
        <DataTable
          loading={loading}
          getRowClassName={row =>
            ignored.has(row.index) ? '[&>td:nth-child(n+2):nth-last-child(n+3)]:opacity-30' : ''
          }
          footer={
            importType === 'MANUAL' && (
              <div className="flex justify-center border-t border-neutral-200 p-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-w-28 text-xs"
                  onClick={() =>
                    setTransactions([
                      ...transactions,
                      {
                        id: uuid(),
                      },
                    ])
                  }
                >
                  <Plus size={12} />
                  Add Transaction
                </Button>
              </div>
            )
          }
          data={transactions}
          columns={[
            {
              id: 'select',
              header: ({ table }) =>
                !transactions.length ? null : (
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
              cell: ({ cell, row }) => {
                const description = cell.getValue() as string;
                if (row.original.isImported) {
                  return description;
                }

                return (
                  <input
                    className="rounded-md border p-2"
                    value={description}
                    disabled={ignored.has(row.index)}
                    onChange={e => {
                      const newTransaction = { ...row.original, description: e.target.value };
                      const newTransactions = [...transactions];
                      newTransactions[row.index] = newTransaction;
                      setTransactions(newTransactions);
                    }}
                  />
                );
              },
            },
            {
              header: 'Account',
              accessorKey: 'account',
              cell: ({ cell }) => {
                const account = cell.getValue();
                if (!account) {
                  return '-';
                } else {
                  return <StyledLink as={LinkCollective} collective={account} />;
                }
              },
            },
            {
              header: 'Match',
              cell: ({ row }) => {
                if (row.original.expense) {
                  return (
                    <StyledLink as={LinkExpense} collective={row.original.account} expense={row.original.expense}>
                      Expense #{row.original.expense.legacyId}
                    </StyledLink>
                  );
                } else if (row.original.order) {
                  return (
                    <StyledLink as={Link} href={`/orders/${row.original.order.legacyId}`}>
                      Contribution #{row.original.order.legacyId}
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
                if (ignored.has(row.index)) {
                  return <Badge size="sm">Ignored</Badge>;
                } else if (row.original.isImported) {
                  return (
                    <Badge type="success" size="sm">
                      Imported
                    </Badge>
                  );
                } else {
                  return (
                    <Badge type="info" size="sm">
                      Pending
                    </Badge>
                  );
                }
              },
            },
            {
              id: 'actions',
              header: ({ table }) => {
                if (table.getIsSomePageRowsSelected() || table.getIsAllPageRowsSelected()) {
                  const selectedCount = table.getSelectedRowModel().rows.length;
                  const areAllDismissed = table.getSelectedRowModel().rows.every(row => ignored.has(row.index));
                  if (areAllDismissed) {
                    return (
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-xs"
                        onClick={() => {
                          setIgnored(new Set([]));
                          table.setRowSelection({});
                        }}
                      >
                        <SquareSlashIcon size={12} />
                        Revert {selectedCount}
                      </Button>
                    );
                  } else {
                    return (
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-xs"
                        onClick={() => {
                          const ignoredIndexes = table.getSelectedRowModel().rows.map(row => row.index);
                          setIgnored(new Set([...Array.from(ignored), ...ignoredIndexes]));
                          table.setRowSelection({});
                        }}
                      >
                        <SquareSlashIcon size={12} />
                        Ignore {selectedCount}
                      </Button>
                    );
                  }
                } else {
                  return <div>Actions</div>;
                }
              },
              // Align right
              meta: { className: 'text-right' },
              cell: ({ row }) => {
                const item = row.original;
                if (ignored.has(row.index)) {
                  return (
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-xs"
                      onClick={() => setIgnored(new Set(Array.from(ignored).filter(i => i !== row.index)))}
                    >
                      <ArchiveRestore size={12} />
                      Revert
                    </Button>
                  );
                }

                return (
                  <div className="flex justify-end gap-2">
                    {item.isImported || !item.amount ? null : item.amount > 0 ? (
                      <React.Fragment>
                        <Button
                          variant="outline"
                          size="xs"
                          className="text-xs"
                          onClick={() => {
                            const newTransaction = {
                              ...item,
                              isImported: true,
                              order: { legacyId: random(1000, 100000) },
                              account: { slug: 'babel', name: 'Babel' },
                            };
                            const newTransactions = [...transactions];
                            newTransactions[row.index] = newTransaction;
                            setTransactions(newTransactions);
                          }}
                        >
                          <Merge size={12} />
                          Match
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          className="text-xs"
                          onClick={() => {
                            const newTransaction = {
                              ...item,
                              isImported: true,
                              order: { legacyId: random(1000, 100000) },
                              account: { slug: 'babel', name: 'Babel' },
                            };
                            const newTransactions = [...transactions];
                            newTransactions[row.index] = newTransaction;
                            setTransactions(newTransactions);
                          }}
                        >
                          <Banknote size="14" />
                          Add Funds
                        </Button>
                      </React.Fragment>
                    ) : (
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-xs"
                        onClick={() => {
                          const newTransaction = {
                            ...item,
                            isImported: true,
                            expense: { legacyId: random(1000, 100000) },
                            account: { slug: 'babel', name: 'Babel' },
                          };
                          const newTransactions = [...transactions];
                          newTransactions[row.index] = newTransaction;
                          setTransactions(newTransactions);
                        }}
                      >
                        <Receipt size={12} />
                        Create Expense
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-xs"
                      onClick={() => {
                        if (isEmpty(item)) {
                          setTransactions(transactions.filter(t => t !== item));
                        } else {
                          setIgnored(new Set(ignored.add(row.index)));
                        }
                      }}
                    >
                      <SquareSlashIcon size={12} />
                      Revert
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      )}
    </div>
  );
};
