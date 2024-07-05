import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { cloneDeep, set } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { formatFileSize } from '../../../../lib/file-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { Amount, Currency, TransactionsImportRowCreateInput } from '../../../../lib/graphql/types/v2/graphql';
import { TransactionsImportRowFieldsFragment } from './lib/graphql';
import { applyCSVConfig, getDefaultCSVConfig, guessCSVColumnsConfig, parseTransactionsCSVFile } from './lib/parse-csv';
import type { CSVConfig } from './lib/types';
import { ACCEPTED_DATE_FORMATS, ACCEPTED_NUMBER_FORMATS } from './lib/types';

import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import StyledLink from '../../../StyledLink';
import { DataTable } from '../../../table/DataTable';
import { Button } from '../../../ui/Button';
import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '../../../ui/DropdownMenu';
import { useStepper } from '../../../ui/Stepper';
import { useToast } from '../../../ui/useToast';

import { CSVColumnSelector } from './CSVColumnSelector';

const AmountFormatSettingsDropdownMenuContent = ({ value, onChange }) => {
  return (
    <DropdownMenuContent>
      <DropdownMenuLabel>
        <FormattedMessage defaultMessage="Number Format" id="rclAAm" />
      </DropdownMenuLabel>
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

const DateFormatSettingsDropdownMenuContent = ({ value, onChange }) => {
  return (
    <DropdownMenuContent>
      <DropdownMenuLabel>
        <FormattedMessage defaultMessage="Date Format" id="Wca/V/" />
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
        {ACCEPTED_DATE_FORMATS.map(format => (
          <DropdownMenuRadioItem key={format || 'Default'} value={format}>
            {!format ? 'Default (ISO 8601)' : format}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );
};

type ParsingResultRow = ReturnType<typeof applyCSVConfig>;

const uploadTransactionsImportMutation = gql`
  mutation UploadTransactionsImport(
    $importId: NonEmptyString!
    $csvConfig: JSONObject
    $data: [TransactionsImportRowCreateInput!]!
    $file: Upload
  ) {
    importTransactions(id: $importId, csvConfig: $csvConfig, data: $data, file: $file) {
      id
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

export const StepMapCSVColumns = ({
  importId,
  file,
  currency,
}: {
  file: File;
  importId: string;
  currency: Currency;
}) => {
  const { toast } = useToast();
  const intl = useIntl();
  const { nextStep, prevStep } = useStepper();
  const [rawCSVData, setRawCSVData] = React.useState<Record<string, string>[]>([]);
  const [nbRowsDisplayed, setNbRowsDisplayed] = React.useState(5);
  const [csvConfig, setCSVConfig] = React.useState<CSVConfig>(() => getDefaultCSVConfig(currency));
  const [parsingError, setParsingError] = React.useState<string | null>(null);
  const [importTransactions, { loading }] = useMutation(uploadTransactionsImportMutation, { context: API_V2_CONTEXT });
  const parsedData = React.useMemo<TransactionsImportRowCreateInput[]>(
    () => rawCSVData.map(row => applyCSVConfig(row, csvConfig)),
    [rawCSVData, csvConfig],
  );

  // Parse the CSV file when it changes
  React.useEffect(() => {
    if (file) {
      parseTransactionsCSVFile(file, intl)
        .then(({ delimiter, parsedCSV }) => {
          setRawCSVData(parsedCSV);
          setCSVConfig({ delimiter, columns: guessCSVColumnsConfig(parsedCSV, currency) });
        })
        .catch(e => {
          setParsingError(e);
        });
    }
  }, [intl, file, currency]);

  if (!parsedData) {
    return <LoadingPlaceholder height={300} />;
  } else if (!parsedData[0] || parsingError) {
    return (
      <div>
        {parsingError || (
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
        )}
        <Button onClick={prevStep} size="sm" variant="secondary">
          <FormattedMessage defaultMessage="Select another file" id="gj+C3v" />
        </Button>
      </div>
    );
  }

  const availableColumns = Object.keys(parsedData[0].rawValue).filter(Boolean);
  const setColumnSetting = (column, setting, value) =>
    setCSVConfig(prevConfig => {
      const newConfig = cloneDeep(prevConfig);
      set(newConfig, `columns.${column}.${setting}`, value);
      return newConfig;
    });

  return (
    <div>
      <p className="mb-4 text-sm">
        <FormattedMessage
          id="withColon"
          defaultMessage="{item}:"
          values={{ item: <FormattedMessage defaultMessage="File" id="gyrIEl" /> }}
        />
        &nbsp;
        <StyledLink openInNewTab href={URL.createObjectURL(file)}>
          {file.name} ({formatFileSize(file.size)})
        </StyledLink>
      </p>
      <DataTable
        data={parsedData.slice(0, nbRowsDisplayed)}
        columns={[
          {
            id: 'date',
            accessorKey: 'date',
            header: () => (
              <CSVColumnSelector
                label="Date"
                columns={availableColumns}
                selected={csvConfig.columns.date.target}
                onChange={value => setColumnSetting('date', 'target', value)}
                SettingsDropdownMenuContent={() => (
                  <DateFormatSettingsDropdownMenuContent
                    value={csvConfig.columns.date.format}
                    onChange={format => setColumnSetting('date', 'format', format)}
                  />
                )}
              />
            ),
            cell: ({ cell, row }) => {
              const parsedDate = cell.getValue() as ParsingResultRow['date'];
              if (!parsedDate) {
                return null;
              } else if (!parsedDate.isValid()) {
                const rawValue = row.original.rawValue[csvConfig.columns.date.target];
                return (
                  <span className="text-red-500">
                    <FormattedMessage defaultMessage="Invalid format" id="akLsfr" />: {rawValue}
                  </span>
                );
              }

              return <DateTime value={parsedDate.toDate()} timeStyle="short" />;
            },
          },
          {
            id: 'credit',
            accessorKey: 'amount',
            header: () => (
              <CSVColumnSelector
                label="Credit"
                columns={availableColumns}
                selected={csvConfig.columns.credit.target}
                onChange={value => setColumnSetting('credit', 'target', value)}
                SettingsDropdownMenuContent={() => (
                  <AmountFormatSettingsDropdownMenuContent
                    value={csvConfig.columns.credit.format}
                    onChange={format => setColumnSetting('credit', 'format', format)}
                  />
                )}
              />
            ),

            cell: ({ cell }) => {
              const parsedAmount = cell.getValue() as Amount;
              if (!parsedAmount || parsedAmount.valueInCents <= 0) {
                return null;
              }
              return <FormattedMoneyAmount amount={parsedAmount.valueInCents} currency={parsedAmount.currency} />;
            },
          },
          {
            id: 'debit',
            accessorKey: 'amount',
            header: () => (
              <CSVColumnSelector
                label="Debit"
                columns={availableColumns}
                selected={csvConfig.columns.debit.target}
                onChange={value => setColumnSetting('debit', 'target', value)}
                SettingsDropdownMenuContent={() => (
                  <AmountFormatSettingsDropdownMenuContent
                    value={csvConfig.columns.debit.format}
                    onChange={format => setColumnSetting('debit', 'format', format)}
                  />
                )}
              />
            ),

            cell: ({ cell }) => {
              const parsedAmount = cell.getValue() as Amount;
              if (!parsedAmount || parsedAmount.valueInCents >= 0) {
                return null;
              }
              return <FormattedMoneyAmount amount={parsedAmount.valueInCents} currency={parsedAmount.currency} />;
            },
          },
          {
            id: 'description',
            accessorKey: 'description',
            header: () => (
              <CSVColumnSelector
                label="Description"
                columns={availableColumns}
                selected={csvConfig.columns.description.target}
                onChange={value => setColumnSetting('description', 'target', value)}
              />
            ),
            cell: ({ cell }) => <p className="max-w-xs">{cell.getValue() as string}</p>,
          },
        ]}
        footer={
          parsedData.length > 5 && (
            <div className="flex items-center justify-center gap-2 border-t border-neutral-200 p-3 text-sm font-normal">
              <FormattedMessage
                defaultMessage="And {count} more rows..."
                id="z1ZQ8H"
                values={{ count: parsedData.length - nbRowsDisplayed }}
              />
              <Button variant="outline" size="xs" onClick={() => setNbRowsDisplayed(nbRowsDisplayed + 5)}>
                <FormattedMessage defaultMessage="Show more" id="aWpBzj" />
              </Button>
            </div>
          )
        }
      />
      <div className="my-4 flex w-full gap-2">
        <Button onClick={prevStep} size="sm" variant="secondary" disabled={loading}>
          <FormattedMessage defaultMessage="Select another file" id="gj+C3v" />
        </Button>
        <Button
          size="sm"
          loading={loading}
          onClick={async () => {
            try {
              await importTransactions({
                variables: {
                  importId,
                  csvConfig,
                  data: parsedData,
                  file,
                },
              });
              nextStep();
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
          }}
        >
          <FormattedMessage
            defaultMessage="Load {count} transactions"
            id="bX1v1a"
            values={{ count: parsedData.length }}
          />
        </Button>
      </div>
    </div>
  );
};
