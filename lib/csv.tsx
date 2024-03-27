import React from 'react';
import { FormattedMessage } from 'react-intl';

export const AVERAGE_TRANSACTIONS_PER_MINUTE = 8240;

// Fields that are not available when exporting transactions from the host dashboard
export const HOST_OMITTED_FIELDS = ['balance', 'hostSlug', 'hostName', 'hostType'];

export type CSVField =
  | 'accountingCategoryCode'
  | 'accountingCategoryName'
  | 'date'
  | 'datetime'
  | 'effectiveDate'
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
  | 'taxIdNumber'
  | 'debitAndCreditAmounts'
  | 'refundLegacyId'
  | 'expenseTotalAmount'
  | 'expenseCurrency'
  | 'expenseSubmittedByHandle'
  | 'expenseApprovedByHandle'
  | 'expensePaidByHandle';

const FIELD_GROUPS: Record<string, readonly CSVField[]> = {
  transaction: [
    'date',
    'datetime',
    'effectiveDate',
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
    'accountingCategoryCode',
    'accountingCategoryName',
    'debitAndCreditAmounts',
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

export const FIELD_GROUPS_2024: Record<string, readonly CSVField[]> = {
  transaction: FIELD_GROUPS.transaction.filter(field => field !== 'paymentProcessorFee'),
  accounts: FIELD_GROUPS.accounts,
  order: FIELD_GROUPS.order,
  expense: FIELD_GROUPS.expense,
  tax: FIELD_GROUPS.tax.filter(field => field !== 'taxAmount'),
  legacy: [...FIELD_GROUPS.legacy, 'paymentProcessorFee', 'taxAmount'],
};

export const FieldGroupLabels: Record<keyof typeof FIELD_GROUPS, React.ReactNode> = {
  transaction: <FormattedMessage defaultMessage="Transaction" />,
  accounts: <FormattedMessage defaultMessage="Account" />,
  order: <FormattedMessage defaultMessage="Contribution" />,
  expense: <FormattedMessage id="Expense" defaultMessage="Expense" />,
  tax: <FormattedMessage defaultMessage="Tax" />,
  legacy: <FormattedMessage id="Legacy/Deprecated" defaultMessage="Legacy/Deprecated" />,
};

export const FieldLabels: Partial<Record<CSVField, React.ReactNode>> = {
  accountingCategoryCode: <FormattedMessage defaultMessage="Accounting Category Code" />,
  accountingCategoryName: <FormattedMessage defaultMessage="Accounting Category Name" />,
  date: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
  datetime: <FormattedMessage defaultMessage="Date & Time" />,
  effectiveDate: <FormattedMessage defaultMessage="Effective Date" />,
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
  debitAndCreditAmounts: <FormattedMessage defaultMessage="Debit and Credit Amounts" />,
};

export enum FIELD_OPTIONS {
  DEFAULT = 'DEFAULT',
  DEFAULT_2023 = 'DEFAULT_2023',
  NEW_PRESET = 'NEW_PRESET',
}

export enum LEGACY_FIELD_OPTIONS {
  DEFAULT = 'DEFAULT',
  CUSTOM = 'CUSTOM',
}

export const FieldOptionsLabels = {
  [FIELD_OPTIONS.DEFAULT]: <FormattedMessage defaultMessage="Platform Default" />,
  [FIELD_OPTIONS.DEFAULT_2023]: <FormattedMessage defaultMessage="Legacy Platform Export Set (Pre-2024)" />,
  [FIELD_OPTIONS.NEW_PRESET]: (
    <span className="text-primary">
      <FormattedMessage defaultMessage="New Preset" />
    </span>
  ),
  [LEGACY_FIELD_OPTIONS.CUSTOM]: <FormattedMessage defaultMessage="Custom" />,
};

export const GROUPS = {
  transaction: <FormattedMessage defaultMessage="Transaction" />,
  account: <FormattedMessage defaultMessage="Account" />,
  order: <FormattedMessage defaultMessage="Contribution" />,
  expense: <FormattedMessage id="Expense" defaultMessage="Expense" />,
  tax: <FormattedMessage defaultMessage="Tax" />,
  legacy: <FormattedMessage id="Legacy/Deprecated" defaultMessage="Legacy/Deprecated" />,
};

export const FIELDS: Array<{
  id: CSVField;
  group: keyof typeof GROUPS;
  tooltip?: React.ReactNode;
  label: React.ReactNode;
}> = [
  {
    id: 'datetime',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="UTC date and time yyyy-mm-ddThh:mm:ss (eg: 2024-05-20T14:37:51)" />,
    label: <FormattedMessage defaultMessage="Date & Time" />,
  },
  {
    id: 'effectiveDate',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="For transactions related to manually added funds this shows the date entered by the fiscal host admin, for all other transactions this is the same as the transaction date & time (also UTC). " />
    ),
    label: <FormattedMessage defaultMessage="Effective Date & Time" />,
  },
  {
    id: 'legacyId',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="A unique serial transaction identifier." />,
    label: <FormattedMessage defaultMessage="Transaction ID" />,
  },
  {
    id: 'group',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="Transactions are often related to each other and grouped together. Related transactions will share the same Group ID. It is a 32 character alpha-numeric unique identifier." />
    ),
    label: <FormattedMessage defaultMessage="Group ID" />,
  },
  {
    id: 'description',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="A textual descriptor of the transaction." />,
    label: <FormattedMessage id="Fields.description" defaultMessage="Description" />,
  },
  {
    id: 'type',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="A textual uppercase indicator if the transaction is a credit or a debit." />
    ),
    label: <FormattedMessage defaultMessage="Credit/Debit" />,
  },
  {
    id: 'kind',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="See documentation for reference to transaction kinds. " />,
    label: <FormattedMessage id="Transaction.Kind" defaultMessage="Kind" />,
  },
  {
    id: 'netAmount',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="The transaction value presented in a single column that holds positive numbers for credit transactions and negative numbers for debit transactions." />
    ),
    label: <FormattedMessage defaultMessage="Amount Single Column" />,
  },
  {
    id: 'debitAndCreditAmounts',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="The transaction value presented in separate debit and credit columns." />
    ),
    label: <FormattedMessage defaultMessage="Amount Debit/Credit Columns" />,
  },
  {
    id: 'currency',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="A 3 letter identifier of the host currency." />,
    label: <FormattedMessage id="Currency" defaultMessage="Currency" />,
  },
  {
    id: 'displayAmount',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="If the transaction currency is different from the host currency, this amount will show the value in which the transaction was initiated. This is a string that includes the original value and currency (eg: 1000 SK)" />
    ),
    label: <FormattedMessage defaultMessage="Original Currency Amount" />,
  },
  {
    id: 'isRefund',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="Indicates “REFUND” if this transaction represents a refund (otherwise empty)." />
    ),
    label: <FormattedMessage defaultMessage="Is Refund" />,
  },
  {
    id: 'isRefunded',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="Indicates “REFUNDED” if this transaction was refunded (otherwise empty)." />
    ),
    label: <FormattedMessage defaultMessage="Is Refunded" />,
  },
  {
    id: 'accountingCategoryCode',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="The code of the accounting category from the chart of accounts to which the transaction is related." />
    ),
    label: <FormattedMessage defaultMessage="Accounting Category Code" />,
  },
  {
    id: 'accountingCategoryName',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="The name of the accounting category from the chart of accounts to which the transaction is related." />
    ),
    label: <FormattedMessage defaultMessage="Accounting Category Name" />,
  },
  {
    id: 'merchantId',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="A unique identifier provided by the payment processor for a transaction on their platform." />
    ),
    label: <FormattedMessage defaultMessage="Merchant ID" />,
  },
  {
    id: 'paymentMethodService',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="The payment processor associated to the transaction (eg: Stripe, Paypal, Wise, Open Collective, Other)." />
    ),
    label: <FormattedMessage defaultMessage="Payment Processor" />,
  },
  {
    id: 'paymentMethodType',
    group: 'transaction',
    tooltip: (
      <FormattedMessage defaultMessage="The payment method associated to the transaction (eg: Credit Card, Balance)" />
    ),
    label: <FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />,
  },
  {
    id: 'accountSlug',
    group: 'account',
    tooltip: (
      <FormattedMessage defaultMessage="The handle (URL identifier on the website) for the transaction account." />
    ),
    label: <FormattedMessage defaultMessage="Account Handle" />,
  },
  {
    id: 'accountName',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="The full name of the transaction account." />,
    label: <FormattedMessage defaultMessage="Account Name" />,
  },
  {
    id: 'accountType',
    group: 'account',
    tooltip: (
      <FormattedMessage defaultMessage="The type of transaction account (person, organization, collective, host, fund, etc.)" />
    ),
    label: <FormattedMessage defaultMessage="Account Type" />,
  },
  {
    id: 'accountEmail',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="A contact email for the account (for individuals only)." />,
    label: <FormattedMessage defaultMessage="Account Email" />,
  },
  {
    id: 'oppositeAccountSlug',
    group: 'account',
    tooltip: (
      <FormattedMessage defaultMessage="The handle (URL identifier on the website) for the transaction opposite account." />
    ),
    label: <FormattedMessage defaultMessage="Opposite Account Handle" />,
  },
  {
    id: 'oppositeAccountName',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="The full name of the transaction opposite account." />,
    label: <FormattedMessage defaultMessage="Opposite Account Name" />,
  },
  {
    id: 'oppositeAccountType',
    group: 'account',
    tooltip: (
      <FormattedMessage defaultMessage="The type of the transaction opposite account (person, organization, collective, host, fund, etc.)" />
    ),
    label: <FormattedMessage defaultMessage="Opposite Account Type" />,
  },
  {
    id: 'oppositeAccountEmail',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="A contact email for the opposite account (for individuals only).." />,
    label: <FormattedMessage defaultMessage="Opposite Account Email" />,
  },
  {
    id: 'orderLegacyId',
    group: 'order',
    tooltip: <FormattedMessage defaultMessage="A unique platform serial identifier for a recurring contribution." />,
    label: <FormattedMessage defaultMessage="Contribution ID" />,
  },
  {
    id: 'orderMemo',
    group: 'order',
    tooltip: (
      <FormattedMessage defaultMessage="Text descriptor attached by fiscal host admins to added funds and pending contributions." />
    ),
    label: <FormattedMessage defaultMessage="Contribution Memo" />,
  },
  {
    id: 'orderFrequency',
    group: 'order',
    tooltip: <FormattedMessage defaultMessage="The frequency of the contribution (eg: one time, monthly, yearly)." />,
    label: <FormattedMessage defaultMessage="Contribution Frequency" />,
  },
  {
    id: 'orderCustomData',
    group: 'order',
    tooltip: <FormattedMessage defaultMessage="Additional contribution metadata." />,
    label: <FormattedMessage defaultMessage="Contribution Custom Data" />,
  },
  {
    id: 'expenseLegacyId',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="A unique platform identifier for an expense." />,
    label: <FormattedMessage defaultMessage="Expense ID" />,
  },
  {
    id: 'expenseType',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="Invoice/Receipt/Grant/Platform Settlement" />,
    label: <FormattedMessage defaultMessage="Expense Type" />,
  },
  {
    id: 'expenseTags',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="Tags that are applied to the expense." />,
    label: <FormattedMessage defaultMessage="Expense Tags" />,
  },
  {
    id: 'taxType',
    group: 'tax',
    tooltip: <FormattedMessage defaultMessage="eg: VAT, GST, etc." />,
    label: <FormattedMessage defaultMessage="Tax Type" />,
  },
  {
    id: 'taxRate',
    group: 'tax',
    tooltip: <FormattedMessage defaultMessage="Floating number expressing the tax percentage rate (eg: 20% = 0.2)." />,
    label: <FormattedMessage defaultMessage="Tax Rate" />,
  },
  {
    id: 'taxIdNumber',
    group: 'tax',
    tooltip: <FormattedMessage defaultMessage="For contributions: the contributor tax ID." />,
    label: <FormattedMessage defaultMessage="Tax ID Number" />,
  },
  {
    id: 'date',
    group: 'legacy',
    tooltip: <FormattedMessage defaultMessage="date only yyyy-mm-dd (eg: 2024-05-20)" />,
    label: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
  },
  {
    id: 'id',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="A unique 32 character identifier (previously names as Contribution ID)" />
    ),
    label: <FormattedMessage defaultMessage="Transaction GraphQL ID" />,
  },
  {
    id: 'shortId',
    group: 'legacy',
    tooltip: <FormattedMessage defaultMessage="An 8 character alpha-numeric unique transaction identifier." />,
    label: <FormattedMessage defaultMessage="Short Transaction ID" />,
  },
  {
    id: 'shortGroup',
    group: 'legacy',
    tooltip: <FormattedMessage defaultMessage="An 8 character alpha-numeric identifier for the transaction group." />,
    label: <FormattedMessage defaultMessage="Short Group ID" />,
  },
  {
    id: 'shortRefundId',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="If “IsRefunded” indicates “true” then this ID will reference the 8 character alpha-numeric unique transaction ID of the refund transaction (which will indicate “IsRefund” as “true”)." />
    ),
    label: <FormattedMessage defaultMessage="Short Refund Transaction ID" />,
  },
  {
    id: 'amount',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="Up until and including the year 2023 payment processor fees and taxes were stored as transaction fields. The gross amount is equal to the transaction amount plus the payment processor fees plus the taxes." />
    ),
    label: <FormattedMessage defaultMessage="Gross Amount" />,
  },
  {
    id: 'paymentProcessorFee',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="Up until and including the year 2023 payment processor fees were stored as a transaction field. In 2024 this was changed and payment processor fees are separate transactions." />
    ),
    label: <FormattedMessage defaultMessage="Payment Processor Fee" />,
  },
  {
    id: 'expenseId',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="A unique 32 character identifier (previously names as Contribution ID) " />
    ),
    label: <FormattedMessage defaultMessage="Expense GraphQL ID" />,
  },
  {
    id: 'payoutMethodType',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="Indicates the original payment method type selected by the expense submitter. May be different from actual payment method type." />
    ),
    label: <FormattedMessage defaultMessage="Expense Payout Method Type" />,
  },
  {
    id: 'platformFee',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="Up until and including the year 2022, platform fees were stored as a transaction field. In 2023 this was changed and platform fees are separate transactions." />
    ),
    label: <FormattedMessage defaultMessage="Platform Fee" />,
  },
  {
    id: 'hostFee',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="For contributions before June 2022 the host fee was recorded as a transaction column in the host currency." />
    ),
    label: <FormattedMessage defaultMessage="Host Fee" />,
  },
  {
    id: 'orderId',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="A unique 32 character identifier (previously names as Contribution ID) " />
    ),
    label: <FormattedMessage defaultMessage="Contribution GraphQL ID" />,
  },

  // New Fields
  {
    id: 'refundLegacyId',
    group: 'transaction',
    label: <FormattedMessage defaultMessage="Refund Transaction ID" />,
  },
  {
    id: 'expenseTotalAmount',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="A sum of the expense line items." />,
    label: <FormattedMessage defaultMessage="Expense Total Amount" />,
  },
  {
    id: 'expenseCurrency',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="The currency in which the expense was submitted" />,
    label: <FormattedMessage defaultMessage="Expense Currency" />,
  },
  {
    id: 'expenseSubmittedByHandle',
    group: 'expense',
    tooltip: (
      <FormattedMessage defaultMessage="A unique platform slug for the user account that submitted the expense." />
    ),
    label: <FormattedMessage defaultMessage="Expense Submitted By Handle" />,
  },
  {
    id: 'expenseApprovedByHandle',
    group: 'expense',
    tooltip: (
      <FormattedMessage defaultMessage="A unique platform slug for the user account that approved the expense." />
    ),
    label: <FormattedMessage defaultMessage="Expense Approved By Handle" />,
  },
  {
    id: 'expensePaidByHandle',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="A unique platform slug for the user account that paid the expense." />,
    label: <FormattedMessage defaultMessage="Expense Paid By Handle" />,
  },

  // Deprecated
  {
    id: 'refundId',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Refund ID" />,
  },
  {
    id: 'balance',
    group: 'legacy',
    label: <FormattedMessage id="Balance" defaultMessage="Balance" />,
  },
  {
    id: 'hostSlug',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Host Handle" />,
  },
  {
    id: 'hostName',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Host Name" />,
  },
  {
    id: 'hostType',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Host Type" />,
  },
  {
    id: 'orderProcessedDate',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Contribution Processed Date" />,
  },
  {
    id: 'taxAmount',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Tax Amount" />,
  },
];

export const GROUP_FIELDS = Object.keys(GROUPS).reduce((dict, groupId) => {
  return { ...dict, [groupId]: FIELDS.filter(f => f.group === groupId).map(f => f.id) };
}, {});

export const DEFAULT_FIELDS_2023: Array<CSVField> = [
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

const DEFAULT_FIELDS: Array<CSVField> = [
  'effectiveDate',
  'legacyId',
  'description',
  'type',
  'kind',
  'group',
  'netAmount',
  'currency',
  'isRefund',
  'isRefunded',
  'refundId',
  'accountSlug',
  'accountName',
  'oppositeAccountSlug',
  'oppositeAccountName',
  'paymentMethodService',
  'paymentMethodType',
  'orderMemo',
  'expenseType',
  'expenseTags',
  'payoutMethodType',
  'accountingCategoryCode',
  'accountingCategoryName',
  'merchantId',
];

export const PLATFORM_PRESETS = {
  DEFAULT: { fields: DEFAULT_FIELDS, flattenTaxesAndPaymentProcessorFees: false },
  DEFAULT_2023: { fields: DEFAULT_FIELDS_2023, flattenTaxesAndPaymentProcessorFees: true },
};
