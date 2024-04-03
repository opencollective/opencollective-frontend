export enum ReportSection {
  CONTRIBUTIONS = 'CONTRIBUTIONS',
  EXPENSES = 'EXPENSES',
  FEES_TIPS = 'FEES_TIPS',
  OTHER = 'OTHER',
}
export type GroupFilter = {
  kind?: string; // TransactionKind;
  isHost?: boolean;
  isRefund?: boolean;
  type?: string; // TransactionType;
  expenseType?: string; // ExpenseType;
  primaryKind?: string; // TransactionKind;
};

export type Group = {
  section?: string;
  label: string;
  filter: GroupFilter;
  helpLabel?: string;
};
