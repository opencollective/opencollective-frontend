import React from 'react';
import { difference } from 'lodash';
import { FormattedMessage } from 'react-intl';

export const AVERAGE_TRANSACTIONS_PER_MINUTE = 8240;

// Fields that are not available when exporting transactions from the host dashboard
export const HOST_OMITTED_FIELDS = ['balance', 'hostSlug', 'hostName', 'hostType'];

type CSVField =
  | 'date'
  | 'datetime'
  | 'id'
  | 'legacyId'
  | 'shortId'
  | 'shortGroup'
  | 'group'
  | 'description'
  | 'type'
  | 'kind'
  | 'isRefund'
  | 'isRefunded'
  | 'refundId'
  | 'shortRefundId'
  | 'displayAmount'
  | 'amount'
  | 'paymentProcessorFee'
  | 'platformFee'
  | 'hostFee'
  | 'netAmount'
  | 'balance'
  | 'currency'
  | 'accountSlug'
  | 'accountName'
  | 'accountType'
  | 'accountEmail'
  | 'oppositeAccountSlug'
  | 'oppositeAccountName'
  | 'oppositeAccountType'
  | 'oppositeAccountEmail'
  | 'hostSlug'
  | 'hostName'
  | 'hostType'
  | 'orderId'
  | 'orderLegacyId'
  | 'orderFrequency'
  | 'orderProcessedDate'
  | 'orderCustomData'
  | 'paymentMethodService'
  | 'paymentMethodType'
  | 'expenseId'
  | 'expenseLegacyId'
  | 'expenseType'
  | 'expenseTags'
  | 'payoutMethodType'
  | 'merchantId'
  | 'orderMemo'
  | 'taxAmount'
  | 'taxType'
  | 'taxRate'
  | 'taxIdNumber';

export const FIELD_GROUPS: Record<string, readonly CSVField[]> = {
  transaction: [
    'date',
    'datetime',
    'id',
    'legacyId',
    'shortId',
    'shortGroup',
    'group',
    'description',
    'type',
    'kind',
    'isRefund',
    'isRefunded',
    'refundId',
    'shortRefundId',
    'displayAmount',
    'amount',
    'paymentProcessorFee',
    'netAmount',
    'balance',
    'currency',
  ],
  accounts: [
    'accountSlug',
    'accountName',
    'accountType',
    'accountEmail',
    'oppositeAccountSlug',
    'oppositeAccountName',
    'oppositeAccountType',
    'oppositeAccountEmail',
    'hostSlug',
    'hostName',
    'hostType',
  ],
  order: [
    'orderId',
    'orderLegacyId',
    'orderMemo',
    'orderFrequency',
    'orderProcessedDate',
    'orderCustomData',
    'paymentMethodService',
    'paymentMethodType',
  ],
  expense: ['expenseId', 'expenseLegacyId', 'expenseType', 'expenseTags', 'payoutMethodType', 'merchantId'],
  tax: ['taxAmount', 'taxType', 'taxRate', 'taxIdNumber'],
  legacy: ['platformFee', 'hostFee'],
};

export const FIELD_GROUPS_2024 = {
  transaction: [...difference(FIELD_GROUPS.transaction, ['paymentProcessorFee'])],
  accounts: [...FIELD_GROUPS.accounts],
  order: [...FIELD_GROUPS.order],
  expense: [...FIELD_GROUPS.expense],
  tax: [...FIELD_GROUPS.tax],
  legacy: [...FIELD_GROUPS.legacy, 'paymentProcessorFee'],
};

export const FieldGroupLabels: Record<keyof typeof FIELD_GROUPS, React.ReactNode> = {
  transaction: <FormattedMessage defaultMessage="Transaction" />,
  accounts: <FormattedMessage defaultMessage="Account" />,
  order: <FormattedMessage defaultMessage="Contribution" />,
  expense: <FormattedMessage id="Expense" defaultMessage="Expense" />,
  tax: <FormattedMessage defaultMessage="Tax" />,
  legacy: <FormattedMessage id="Legacy/Deprecated" defaultMessage="Legacy/Deprecated" />,
};

export const DEFAULT_FIELDS = [
  'datetime',
  'shortId',
  'shortGroup',
  'description',
  'type',
  'kind',
  'isRefund',
  'isRefunded',
  'shortRefundId',
  'displayAmount',
  'amount',
  'paymentProcessorFee',
  'netAmount',
  'balance',
  'currency',
  'accountSlug',
  'accountName',
  'oppositeAccountSlug',
  'oppositeAccountName',
  // Payment Method (for orders)
  'paymentMethodService',
  'paymentMethodType',
  // Type and Payout Method (for expenses)
  'expenseType',
  'expenseTags',
  'payoutMethodType',
  // Extra fields
  'merchantId',
  'orderMemo',
];

export const DEFAULT_FIELDS_2024 = difference(DEFAULT_FIELDS, ['paymentProcessorFee']);

export const FieldLabels: Record<CSVField, React.ReactNode> = {
  date: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
  datetime: <FormattedMessage defaultMessage="Date & Time" />,
  id: <FormattedMessage defaultMessage="Transaction ID" />,
  legacyId: <FormattedMessage defaultMessage="Legacy Transaction ID" />,
  shortId: <FormattedMessage defaultMessage="Short Transaction ID" />,
  shortGroup: <FormattedMessage defaultMessage="Short Group ID" />,
  group: <FormattedMessage defaultMessage="Group ID" />,
  description: <FormattedMessage id="Fields.description" defaultMessage="Description" />,
  type: <FormattedMessage id="transactions.type" defaultMessage="Type" />,
  kind: <FormattedMessage id="Transaction.Kind" defaultMessage="Kind" />,
  isRefund: <FormattedMessage defaultMessage="Is Refund" />,
  isRefunded: <FormattedMessage defaultMessage="Is Refunded" />,
  refundId: <FormattedMessage defaultMessage="Refund ID" />,
  shortRefundId: <FormattedMessage defaultMessage="Short Refund ID" />,
  displayAmount: <FormattedMessage defaultMessage="Display Amount" />,
  amount: <FormattedMessage id="Fields.amount" defaultMessage="Amount" />,
  paymentProcessorFee: <FormattedMessage defaultMessage="Payment Processor Fee" />,
  platformFee: <FormattedMessage defaultMessage="Platform Fee" />,
  hostFee: <FormattedMessage defaultMessage="Host Fee" />,
  netAmount: <FormattedMessage defaultMessage="Net Amount" />,
  balance: <FormattedMessage id="Balance" defaultMessage="Balance" />,
  currency: <FormattedMessage id="Currency" defaultMessage="Currency" />,
  accountSlug: <FormattedMessage defaultMessage="Account Handle" />,
  accountName: <FormattedMessage defaultMessage="Account Name" />,
  accountType: <FormattedMessage defaultMessage="Account Type" />,
  accountEmail: <FormattedMessage defaultMessage="Account Email" />,
  oppositeAccountSlug: <FormattedMessage defaultMessage="Opposite Account Handle" />,
  oppositeAccountName: <FormattedMessage defaultMessage="Opposite Account Name" />,
  oppositeAccountType: <FormattedMessage defaultMessage="Opposite Account Type" />,
  oppositeAccountEmail: <FormattedMessage defaultMessage="Opposite Account Email" />,
  hostSlug: <FormattedMessage defaultMessage="Host Handle" />,
  hostName: <FormattedMessage defaultMessage="Host Name" />,
  hostType: <FormattedMessage defaultMessage="Host Type" />,
  orderId: <FormattedMessage defaultMessage="Contribution ID" />,
  orderLegacyId: <FormattedMessage defaultMessage="Legacy Contribution ID" />,
  orderFrequency: <FormattedMessage defaultMessage="Contribution Frequency" />,
  orderMemo: <FormattedMessage defaultMessage="Contribution Memo" />,
  orderProcessedDate: <FormattedMessage defaultMessage="Contribution Processed Date" />,
  orderCustomData: <FormattedMessage defaultMessage="Contribution Custom Data" />,
  paymentMethodService: <FormattedMessage defaultMessage="Payment Method Service" />,
  paymentMethodType: <FormattedMessage defaultMessage="Payment Method Type" />,
  expenseId: <FormattedMessage defaultMessage="Expense ID" />,
  expenseLegacyId: <FormattedMessage defaultMessage="Legacy Expense ID" />,
  expenseType: <FormattedMessage defaultMessage="Expense Type" />,
  expenseTags: <FormattedMessage defaultMessage="Expense Tags" />,
  payoutMethodType: <FormattedMessage defaultMessage="Payout Method Type" />,
  merchantId: <FormattedMessage defaultMessage="Merchant ID" />,
  taxAmount: <FormattedMessage defaultMessage="Tax Amount" />,
  taxType: <FormattedMessage defaultMessage="Tax Type" />,
  taxRate: <FormattedMessage defaultMessage="Tax Rate" />,
  taxIdNumber: <FormattedMessage defaultMessage="Tax ID Number" />,
};

export enum FIELD_OPTIONS {
  DEFAULT = 'DEFAULT',
  CUSTOM = 'CUSTOM',
}

const FieldOptionsLabels = {
  [FIELD_OPTIONS.DEFAULT]: <FormattedMessage defaultMessage="Default" />,
  [FIELD_OPTIONS.CUSTOM]: <FormattedMessage defaultMessage="Custom" />,
};

export const FieldOptions = Object.keys(FIELD_OPTIONS).map(value => ({ value, label: FieldOptionsLabels[value] }));

export enum CSV_VERSIONS {
  VERSION_2023 = 'VERSION_2023',
  VERSION_2024 = 'VERSION_2024',
}

const CsvVersionsLabels = {
  [CSV_VERSIONS.VERSION_2023]: <FormattedMessage defaultMessage="Version 2023 (Payment Processor Fees as column)" />,
  [CSV_VERSIONS.VERSION_2024]: <FormattedMessage defaultMessage="Version 2024 (Payment Processor Fees as row)" />,
};

export const CsvVersions = Object.keys(CSV_VERSIONS).map(value => ({ value, label: CsvVersionsLabels[value] }));
