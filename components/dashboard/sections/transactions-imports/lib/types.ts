import type { Currency } from '../../../../../lib/graphql/types/v2/schema';

export const ACCEPTED_DATE_FORMATS = [
  undefined, // ISO 8601
  'YYYY-MM-DD',
  'MM-DD-YYYY',
  'DD-MM-YYYY',
  'YYYY/MM/DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
] as const;

export const ACCEPTED_NUMBER_FORMATS = ['1,000.00', '1.000,00'] as const;

export const CSV_DELIMITERS = [',', ';', '\t', '|'] as const;

// Must match the one defined in api/server/graphql/v2/object/TransactionsImportRow.ts
export const DEFAULT_ASSIGNMENT_ACCOUNT_ID = '__default__';

type CommonColumnSettings = {
  target: string;
};

type AmountColumnSettings = CommonColumnSettings & {
  format: (typeof ACCEPTED_NUMBER_FORMATS)[number];
  currency: Currency;
};

export type CSVConfig = {
  delimiter: (typeof CSV_DELIMITERS)[number];
  columns: {
    date: CommonColumnSettings & { format: (typeof ACCEPTED_DATE_FORMATS)[number] };
    credit: AmountColumnSettings;
    debit: AmountColumnSettings;
    description: CommonColumnSettings;
  };
};
