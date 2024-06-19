import { parse as parseCSV } from 'csv-parse/sync';
import { deburr, uniq } from 'lodash';
import type { IntlShape } from 'react-intl';

import dayjs from '../../../../../lib/dayjs';
import type { Currency, TransactionsImportRowCreateInput } from '../../../../../lib/graphql/types/v2/graphql';
import { toNegative } from '../../../../../lib/math';

import type { CSVConfig } from './types';
import { ACCEPTED_DATE_FORMATS, ACCEPTED_NUMBER_FORMATS, CSV_DELIMITERS } from './types';

const parseAmount = (
  amountInput: string,
  format: (typeof ACCEPTED_NUMBER_FORMATS)[number],
  defaultCurrency: Currency,
) => {
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
    currency: currency || defaultCurrency,
  };
};

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
  'detail',
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

const guessDateFormat = (dateStr: string): (typeof ACCEPTED_DATE_FORMATS)[number] | undefined => {
  for (const format of ACCEPTED_DATE_FORMATS) {
    if (dayjs(dateStr, format, true).isValid()) {
      return format;
    }
  }
};

const guessNumberFormat = (numberStr: string): (typeof ACCEPTED_NUMBER_FORMATS)[number] => {
  // If the number ends with a comma + 2 digits, it's likely a decimal separator
  if (numberStr.match(/\d+,\d{2}$/)) {
    return '1.000,00';
  } else {
    return '1,000.00';
  }
};

export const parseTransactionsCSVFile = async (
  file: File,
  intl: IntlShape,
): Promise<{
  delimiter: (typeof CSV_DELIMITERS)[number];
  parsedCSV: Array<Record<string, string>>;
}> => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const csvData = reader.result as string;

      // Try to parse the CSV with different delimiters
      for (const delimiter of CSV_DELIMITERS) {
        try {
          const parsedCSV = parseCSV(csvData, { columns: true, skip_empty_lines: true, delimiter });
          resolve({ delimiter, parsedCSV });
          return;
        } catch (e) {
          continue;
        }
      }

      // If we reach this point, it means we couldn't parse the CSV with any delimiter
      reject(
        intl.formatMessage({
          defaultMessage: 'Could not parse the CSV file. Please make sure it is correctly formatted.',
          id: '6eJG5Y',
        }),
      );
    };

    reader.readAsText(file);
  });
};

export const guessCSVColumnsConfig = (
  data: Array<Record<string, string>>,
  currency: Currency,
): CSVConfig['columns'] => {
  const config: CSVConfig['columns'] = {
    date: { target: undefined, format: undefined },
    credit: { target: undefined, format: ACCEPTED_NUMBER_FORMATS[0], currency },
    debit: { target: undefined, format: ACCEPTED_NUMBER_FORMATS[0], currency },
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

export const getDefaultCSVConfig = (currency: Currency): CSVConfig => ({
  delimiter: ',',
  columns: guessCSVColumnsConfig([], currency),
});

export const applyCSVConfig = (row: Record<string, string>, csvConfig: CSVConfig): TransactionsImportRowCreateInput => {
  const columnsConfig = csvConfig.columns;
  const amountColumns = uniq([columnsConfig.credit.target, columnsConfig.debit.target]).filter(Boolean);

  // Parse amount
  let amount;
  if (amountColumns.length === 1) {
    // Credit/debit point to the same column, we'll use the sign to determine the amount
    const rawValue = row[amountColumns[0]].trim();
    const isNegative = rawValue.startsWith('-');
    const amountConfig = isNegative ? columnsConfig.debit : columnsConfig.credit;
    amount = parseAmount(rawValue, amountConfig.format, amountConfig.currency);
  } else {
    // Split Debit/Credit columns
    const rawCredit = row[columnsConfig.credit.target]?.trim();
    if (row[columnsConfig.credit.target]) {
      amount = parseAmount(rawCredit, columnsConfig.credit.format, columnsConfig.credit.currency);
      if (amount) {
        amount.valueInCents = Math.abs(amount.valueInCents);
      }
    } else if (row[columnsConfig.debit.target]) {
      const rawDebit = row[columnsConfig.debit.target].trim();
      amount = parseAmount(rawDebit, columnsConfig.debit.format, columnsConfig.debit.currency);
      if (amount) {
        amount.valueInCents = toNegative(amount.valueInCents);
      }
    }
  }

  return {
    rawValue: row,
    sourceId: `${row[columnsConfig.date.target]}|${amount?.valueInCents}|${amount?.currency}`,
    description: row[columnsConfig.description.target],
    date: dayjs(row[columnsConfig.date.target], columnsConfig.date.format),
    amount,
  };
};
