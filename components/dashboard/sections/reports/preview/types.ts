import { ExpenseType, TransactionKind, TransactionType } from '../../../../../lib/graphql/types/v2/graphql';

export enum ReportSection {
  CONTRIBUTIONS = 'CONTRIBUTIONS',
  EXPENSES = 'EXPENSES',
  FEES_TIPS = 'FEES_TIPS',
  OTHER = 'OTHER',
  INCOMING = 'INCOMING', // for the "algorithmic" grouping
  OUTGOING = 'OUTGOING', // for the "algorithmic" grouping
}

export type GroupFilter = {
  kind?: TransactionKind;
  isHost?: boolean;
  isRefund?: boolean;
  type?: TransactionType;
  expenseType?: ExpenseType;
};

export type Group = {
  section?: string;
  label?: string;
  filter: GroupFilter;
  helpLabel?: string;
};
