import { ExpenseType, TransactionKind, TransactionType } from '../../../../../../lib/graphql/types/v2/graphql';

import { Group, ReportSection } from '../types';

import { checkGroupsMutualExclusivity } from './check-groups';

// TODO: Internationalization before launching preview feature as default
export const predefinedGroups: Group[] = [
  {
    section: ReportSection.CONTRIBUTIONS,
    label: 'Contributions',
    filter: { kind: TransactionKind.CONTRIBUTION, type: TransactionType.CREDIT, isRefund: false },
  },
  {
    section: ReportSection.CONTRIBUTIONS,
    label: 'Refunded contributions',
    filter: { kind: TransactionKind.CONTRIBUTION, type: TransactionType.DEBIT, isRefund: true },
  },
  {
    section: ReportSection.CONTRIBUTIONS,
    label: 'Added funds',
    filter: { kind: TransactionKind.ADDED_FUNDS, type: TransactionType.CREDIT, isRefund: false },
  },
  {
    section: ReportSection.CONTRIBUTIONS,
    label: 'Refunded Added funds',
    filter: { kind: TransactionKind.ADDED_FUNDS, type: TransactionType.CREDIT, isRefund: true },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid Grants',
    filter: {
      kind: TransactionKind.EXPENSE,
      expenseType: ExpenseType.GRANT,
      type: TransactionType.DEBIT,
      isRefund: false,
    },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid Invoices',
    filter: {
      kind: TransactionKind.EXPENSE,
      expenseType: ExpenseType.INVOICE,
      type: TransactionType.DEBIT,
      isRefund: false,
    },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid Reimbursements',
    filter: {
      kind: TransactionKind.EXPENSE,
      expenseType: ExpenseType.RECEIPT,
      type: TransactionType.DEBIT,
      isRefund: false,
    },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid Virtual Card Charges',
    filter: {
      kind: TransactionKind.EXPENSE,
      expenseType: ExpenseType.CHARGE,
      type: TransactionType.DEBIT,
      isRefund: false,
    },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Paid unclassified expenses',
    filter: {
      kind: TransactionKind.EXPENSE,
      expenseType: ExpenseType.UNCLASSIFIED,
      type: TransactionType.DEBIT,
      isRefund: false,
    },
  },
  {
    section: ReportSection.EXPENSES,
    label: 'Expenses marked as unpaid',
    filter: { kind: TransactionKind.EXPENSE, type: TransactionType.CREDIT, isRefund: true },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Payment processor fees',
    filter: { kind: TransactionKind.PAYMENT_PROCESSOR_FEE },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Host Fees Paid',
    filter: { kind: TransactionKind.HOST_FEE, isRefund: false, type: TransactionType.DEBIT },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Collected Host Fees',
    filter: { kind: TransactionKind.HOST_FEE, isRefund: false, type: TransactionType.CREDIT },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Refunded Host Fees',
    filter: { kind: TransactionKind.HOST_FEE, isRefund: true },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Paid Platform Settlements',
    filter: { kind: TransactionKind.EXPENSE, type: TransactionType.DEBIT, expenseType: ExpenseType.SETTLEMENT },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Platform Fees Paid',
    filter: { kind: TransactionKind.HOST_FEE_SHARE },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Platform Fees Debt',
    filter: { kind: TransactionKind.HOST_FEE_SHARE_DEBT },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Platform Tips Debt',
    filter: { kind: TransactionKind.PLATFORM_TIP_DEBT },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Lost disputed payment processor fees',
    filter: { kind: TransactionKind.PAYMENT_PROCESSOR_DISPUTE_FEE },
  },
  {
    section: ReportSection.FEES_TIPS,
    label: 'Covered Payment processor fees',
    filter: { kind: TransactionKind.PAYMENT_PROCESSOR_COVER },
  },
  {
    section: ReportSection.OTHER,
    label: 'Balance transfer',
    filter: { kind: TransactionKind.BALANCE_TRANSFER },
  },
  {
    section: ReportSection.OTHER,
    label: 'Outgoing Added Funds',
    filter: { kind: TransactionKind.ADDED_FUNDS, type: TransactionType.DEBIT },
  },
  {
    section: ReportSection.OTHER,
    label: 'Outgoing Contributions',
    filter: { kind: TransactionKind.CONTRIBUTION, type: TransactionType.DEBIT, isRefund: false },
  },
  {
    section: ReportSection.OTHER,
    label: 'Refunded outgoing contributions',
    filter: { kind: TransactionKind.CONTRIBUTION, type: TransactionType.CREDIT, isRefund: true },
  },
  {
    section: ReportSection.OTHER,
    label: 'Collected Expenses',
    filter: { kind: TransactionKind.EXPENSE, type: TransactionType.CREDIT, isRefund: false },
  },
  {
    section: ReportSection.OTHER,
    label: 'Prepaid payment method',
    filter: { kind: TransactionKind.PREPAID_PAYMENT_METHOD },
  },
];

// Check that the report groups are mutually exclusive, otherwise throw an error
checkGroupsMutualExclusivity(predefinedGroups);
