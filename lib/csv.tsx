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
  transaction: <FormattedMessage defaultMessage="Transaction" id="1+ROfp" />,
  accounts: <FormattedMessage defaultMessage="Account" id="TwyMau" />,
  order: <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />,
  expense: <FormattedMessage id="Expense" defaultMessage="Expense" />,
  tax: <FormattedMessage defaultMessage="Tax" id="AwzkSM" />,
  legacy: <FormattedMessage id="Legacy/Deprecated" defaultMessage="Legacy/Deprecated" />,
};

export const FieldLabels: Partial<Record<CSVField, React.ReactNode>> = {
  accountingCategoryCode: <FormattedMessage defaultMessage="Accounting Category Code" id="likV1W" />,
  accountingCategoryName: <FormattedMessage defaultMessage="Accounting Category Name" id="ulLbhk" />,
  date: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
  datetime: <FormattedMessage defaultMessage="Date & Time" id="io/Qlk" />,
  effectiveDate: <FormattedMessage defaultMessage="Effective Date" id="Gh3Obs" />,
  id: <FormattedMessage defaultMessage="Transaction ID" id="oK0S4l" />,
  legacyId: <FormattedMessage defaultMessage="Legacy Transaction ID" id="/J1LvF" />,
  shortId: <FormattedMessage defaultMessage="Short Transaction ID" id="bWYUU+" />,
  shortGroup: <FormattedMessage defaultMessage="Short Group ID" id="4uWBOI" />,
  group: <FormattedMessage defaultMessage="Group ID" id="nBKj/i" />,
  description: <FormattedMessage id="Fields.description" defaultMessage="Description" />,
  type: <FormattedMessage id="transactions.type" defaultMessage="Type" />,
  kind: <FormattedMessage id="Transaction.Kind" defaultMessage="Kind" />,
  isRefund: <FormattedMessage defaultMessage="Is Refund" id="o+jEZR" />,
  isRefunded: <FormattedMessage defaultMessage="Is Refunded" id="3/XmM5" />,
  refundId: <FormattedMessage defaultMessage="Refund ID" id="INO/bh" />,
  shortRefundId: <FormattedMessage defaultMessage="Short Refund ID" id="OW15R5" />,
  displayAmount: <FormattedMessage defaultMessage="Display Amount" id="gKqXcg" />,
  amount: <FormattedMessage id="Fields.amount" defaultMessage="Amount" />,
  paymentProcessorFee: <FormattedMessage defaultMessage="Payment Processor Fee" id="pzs6YY" />,
  platformFee: <FormattedMessage defaultMessage="Platform Fee" id="SjFhQ9" />,
  hostFee: <FormattedMessage defaultMessage="Host Fee" id="NJsELs" />,
  netAmount: <FormattedMessage defaultMessage="Net Amount" id="FxUka3" />,
  balance: <FormattedMessage id="Balance" defaultMessage="Balance" />,
  currency: <FormattedMessage id="Currency" defaultMessage="Currency" />,
  accountSlug: <FormattedMessage defaultMessage="Account Handle" id="C9DEAp" />,
  accountName: <FormattedMessage defaultMessage="Account Name" id="3WkdVP" />,
  accountType: <FormattedMessage defaultMessage="Account Type" id="K1uUiB" />,
  accountEmail: <FormattedMessage defaultMessage="Account Email" id="uGu5Jg" />,
  oppositeAccountSlug: <FormattedMessage defaultMessage="Opposite Account Handle" id="LdJJpQ" />,
  oppositeAccountName: <FormattedMessage defaultMessage="Opposite Account Name" id="P5vKkd" />,
  oppositeAccountType: <FormattedMessage defaultMessage="Opposite Account Type" id="HQ/XDa" />,
  oppositeAccountEmail: <FormattedMessage defaultMessage="Opposite Account Email" id="E98WbS" />,
  hostSlug: <FormattedMessage defaultMessage="Host Handle" id="xv/T06" />,
  hostName: <FormattedMessage defaultMessage="Host Name" id="x92ME7" />,
  hostType: <FormattedMessage defaultMessage="Host Type" id="3qzqTo" />,
  orderId: <FormattedMessage defaultMessage="Contribution ID" id="cVkF3C" />,
  orderLegacyId: <FormattedMessage defaultMessage="Legacy Contribution ID" id="6o/l5L" />,
  orderFrequency: <FormattedMessage defaultMessage="Contribution Frequency" id="aAvgj8" />,
  orderMemo: <FormattedMessage defaultMessage="Contribution Memo" id="WbO05M" />,
  orderProcessedDate: <FormattedMessage defaultMessage="Contribution Processed Date" id="zeNNi6" />,
  orderCustomData: <FormattedMessage defaultMessage="Contribution Custom Data" id="OV4x2C" />,
  paymentMethodService: <FormattedMessage defaultMessage="Payment Method Service" id="QMkpv4" />,
  paymentMethodType: <FormattedMessage defaultMessage="Payment Method Type" id="N7as4F" />,
  expenseId: <FormattedMessage defaultMessage="Expense ID" id="aJWAKv" />,
  expenseLegacyId: <FormattedMessage defaultMessage="Legacy Expense ID" id="9IikCp" />,
  expenseType: <FormattedMessage defaultMessage="Expense Type" id="wbd643" />,
  expenseTags: <FormattedMessage defaultMessage="Expense Tags" id="pe+mUc" />,
  payoutMethodType: <FormattedMessage defaultMessage="Payout Method Type" id="Ko3cDv" />,
  merchantId: <FormattedMessage defaultMessage="Merchant ID" id="EvIfQD" />,
  taxAmount: <FormattedMessage defaultMessage="Tax Amount" id="i+M7sg" />,
  taxType: <FormattedMessage defaultMessage="Tax Type" id="VLk78/" />,
  taxRate: <FormattedMessage defaultMessage="Tax Rate" id="la9cZ4" />,
  taxIdNumber: <FormattedMessage defaultMessage="Tax ID Number" id="YnfjEo" />,
  debitAndCreditAmounts: <FormattedMessage defaultMessage="Debit and Credit Amounts" id="VXKn0i" />,
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
  [FIELD_OPTIONS.DEFAULT]: <FormattedMessage defaultMessage="Platform Default" id="5kf2KT" />,
  [FIELD_OPTIONS.DEFAULT_2023]: <FormattedMessage defaultMessage="Legacy Platform Default (Pre-2024)" id="JP+lOn" />,
  [FIELD_OPTIONS.NEW_PRESET]: (
    <span className="text-primary">
      <FormattedMessage defaultMessage="New Preset" id="99ZtbG" />
    </span>
  ),
  [LEGACY_FIELD_OPTIONS.CUSTOM]: <FormattedMessage defaultMessage="Custom" id="Sjo1P4" />,
};

export const GROUPS = {
  transaction: <FormattedMessage defaultMessage="Transaction" id="1+ROfp" />,
  account: <FormattedMessage defaultMessage="Account" id="TwyMau" />,
  order: <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />,
  expense: <FormattedMessage id="Expense" defaultMessage="Expense" />,
  tax: <FormattedMessage defaultMessage="Tax" id="AwzkSM" />,
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
    tooltip: (
      <FormattedMessage defaultMessage="UTC date and time yyyy-mm-ddThh:mm:ss (eg: 2024-05-20T14:37:51)" id="KySDZj" />
    ),
    label: <FormattedMessage defaultMessage="Date & Time" id="io/Qlk" />,
  },
  {
    id: 'effectiveDate',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="For transactions related to manually added funds this shows the date entered by the fiscal host admin, for all other transactions this is the same as the transaction date & time (also UTC)."
        id="qszRlM"
      />
    ),
    label: <FormattedMessage defaultMessage="Effective Date & Time" id="Hy4duK" />,
  },
  {
    id: 'legacyId',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="A unique serial transaction identifier." id="ufJYd0" />,
    label: <FormattedMessage defaultMessage="Transaction ID" id="oK0S4l" />,
  },
  {
    id: 'group',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="Transactions are often related to each other and grouped together. Related transactions will share the same Group ID. It is a 32 character alpha-numeric unique identifier."
        id="pq5Ikr"
      />
    ),
    label: <FormattedMessage defaultMessage="Group ID" id="nBKj/i" />,
  },
  {
    id: 'description',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="A textual descriptor of the transaction." id="Pdh+ep" />,
    label: <FormattedMessage id="Fields.description" defaultMessage="Description" />,
  },
  {
    id: 'type',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="A textual uppercase indicator if the transaction is a credit or a debit."
        id="sxMk1S"
      />
    ),
    label: <FormattedMessage defaultMessage="Credit/Debit" id="cSigj5" />,
  },
  {
    id: 'kind',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="See documentation for reference to transaction kinds." id="8duKGM" />,
    label: <FormattedMessage id="Transaction.Kind" defaultMessage="Kind" />,
  },
  {
    id: 'netAmount',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="The transaction value presented in a single column that holds positive numbers for credit transactions and negative numbers for debit transactions."
        id="i4IfVR"
      />
    ),
    label: <FormattedMessage defaultMessage="Amount Single Column" id="MUCUmd" />,
  },
  {
    id: 'debitAndCreditAmounts',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="The transaction value presented in separate debit and credit columns."
        id="VhwOce"
      />
    ),
    label: <FormattedMessage defaultMessage="Amount Debit/Credit Columns" id="rbN4St" />,
  },
  {
    id: 'currency',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="A 3 letter identifier of the host currency." id="J/Pgyh" />,
    label: <FormattedMessage id="Currency" defaultMessage="Currency" />,
  },
  {
    id: 'displayAmount',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="If the transaction currency is different from the host currency, this amount will show the value in which the transaction was initiated. This is a string that includes the original value and currency (eg: 1000 SK)"
        id="uNrhIZ"
      />
    ),
    label: <FormattedMessage defaultMessage="Original Currency Amount" id="J1iOIC" />,
  },
  {
    id: 'isRefund',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="Indicates “REFUND” if this transaction represents a refund (otherwise empty)."
        id="haTMSR"
      />
    ),
    label: <FormattedMessage defaultMessage="Is Refund" id="o+jEZR" />,
  },
  {
    id: 'isRefunded',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="Indicates “REFUNDED” if this transaction was refunded (otherwise empty)."
        id="0Eavm2"
      />
    ),
    label: <FormattedMessage defaultMessage="Is Refunded" id="3/XmM5" />,
  },
  {
    id: 'accountingCategoryCode',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="The code of the accounting category from the chart of accounts to which the transaction is related."
        id="f5A9ME"
      />
    ),
    label: <FormattedMessage defaultMessage="Accounting Category Code" id="likV1W" />,
  },
  {
    id: 'accountingCategoryName',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="The name of the accounting category from the chart of accounts to which the transaction is related."
        id="XK8i/f"
      />
    ),
    label: <FormattedMessage defaultMessage="Accounting Category Name" id="ulLbhk" />,
  },
  {
    id: 'merchantId',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="A unique identifier provided by the payment processor for a transaction on their platform."
        id="p4M9u0"
      />
    ),
    label: <FormattedMessage defaultMessage="Merchant ID" id="EvIfQD" />,
  },
  {
    id: 'paymentMethodService',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="The payment processor associated to the transaction (eg: Stripe, Paypal, Wise, Open Collective, Other)."
        id="ssBTh2"
      />
    ),
    label: <FormattedMessage defaultMessage="Payment Processor" id="WM5yCZ" />,
  },
  {
    id: 'paymentMethodType',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="The payment method associated to the transaction (eg: Credit Card, Balance)"
        id="TA1v9N"
      />
    ),
    label: <FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />,
  },
  {
    id: 'accountSlug',
    group: 'account',
    tooltip: (
      <FormattedMessage
        defaultMessage="The handle (URL identifier on the website) for the transaction account."
        id="QGJ3Z6"
      />
    ),
    label: <FormattedMessage defaultMessage="Account Handle" id="C9DEAp" />,
  },
  {
    id: 'accountName',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="The full name of the transaction account." id="a3eXJv" />,
    label: <FormattedMessage defaultMessage="Account Name" id="3WkdVP" />,
  },
  {
    id: 'accountType',
    group: 'account',
    tooltip: (
      <FormattedMessage
        defaultMessage="The type of transaction account (person, organization, collective, host, fund, etc.)"
        id="Yv8Wbt"
      />
    ),
    label: <FormattedMessage defaultMessage="Account Type" id="K1uUiB" />,
  },
  {
    id: 'accountEmail',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="A contact email for the account (for individuals only)." id="nbe++n" />,
    label: <FormattedMessage defaultMessage="Account Email" id="uGu5Jg" />,
  },
  {
    id: 'oppositeAccountSlug',
    group: 'account',
    tooltip: (
      <FormattedMessage
        defaultMessage="The handle (URL identifier on the website) for the transaction opposite account."
        id="l/JVrq"
      />
    ),
    label: <FormattedMessage defaultMessage="Opposite Account Handle" id="LdJJpQ" />,
  },
  {
    id: 'oppositeAccountName',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="The full name of the transaction opposite account." id="7zWixh" />,
    label: <FormattedMessage defaultMessage="Opposite Account Name" id="P5vKkd" />,
  },
  {
    id: 'oppositeAccountType',
    group: 'account',
    tooltip: (
      <FormattedMessage
        defaultMessage="The type of the transaction opposite account (person, organization, collective, host, fund, etc.)"
        id="sgVok2"
      />
    ),
    label: <FormattedMessage defaultMessage="Opposite Account Type" id="HQ/XDa" />,
  },
  {
    id: 'oppositeAccountEmail',
    group: 'account',
    tooltip: (
      <FormattedMessage
        defaultMessage="A contact email for the opposite account (for individuals only).."
        id="fG5bjt"
      />
    ),
    label: <FormattedMessage defaultMessage="Opposite Account Email" id="E98WbS" />,
  },
  {
    id: 'orderLegacyId',
    group: 'order',
    tooltip: (
      <FormattedMessage
        defaultMessage="A unique platform serial identifier for a recurring contribution."
        id="YRbKvY"
      />
    ),
    label: <FormattedMessage defaultMessage="Contribution ID" id="cVkF3C" />,
  },
  {
    id: 'orderMemo',
    group: 'order',
    tooltip: (
      <FormattedMessage
        defaultMessage="Text descriptor attached by fiscal host admins to added funds and pending contributions."
        id="IpHuhY"
      />
    ),
    label: <FormattedMessage defaultMessage="Contribution Memo" id="WbO05M" />,
  },
  {
    id: 'orderFrequency',
    group: 'order',
    tooltip: (
      <FormattedMessage
        defaultMessage="The frequency of the contribution (eg: one time, monthly, yearly)."
        id="Wazs0c"
      />
    ),
    label: <FormattedMessage defaultMessage="Contribution Frequency" id="aAvgj8" />,
  },
  {
    id: 'orderCustomData',
    group: 'order',
    tooltip: <FormattedMessage defaultMessage="Additional contribution metadata." id="WbW/6b" />,
    label: <FormattedMessage defaultMessage="Contribution Custom Data" id="OV4x2C" />,
  },
  {
    id: 'expenseLegacyId',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="A unique platform identifier for an expense." id="ndQbVX" />,
    label: <FormattedMessage defaultMessage="Expense ID" id="aJWAKv" />,
  },
  {
    id: 'expenseType',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="Invoice/Receipt/Grant/Platform Settlement" id="nKqSHB" />,
    label: <FormattedMessage defaultMessage="Expense Type" id="wbd643" />,
  },
  {
    id: 'expenseTags',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="Tags that are applied to the expense." id="RKpJ1S" />,
    label: <FormattedMessage defaultMessage="Expense Tags" id="pe+mUc" />,
  },
  {
    id: 'taxType',
    group: 'tax',
    tooltip: <FormattedMessage defaultMessage="eg: VAT, GST, etc." id="rg47YZ" />,
    label: <FormattedMessage defaultMessage="Tax Type" id="VLk78/" />,
  },
  {
    id: 'taxRate',
    group: 'tax',
    tooltip: (
      <FormattedMessage
        defaultMessage="Floating number expressing the tax percentage rate (eg: 20% = 0.2)."
        id="6hAx2q"
      />
    ),
    label: <FormattedMessage defaultMessage="Tax Rate" id="la9cZ4" />,
  },
  {
    id: 'taxIdNumber',
    group: 'tax',
    tooltip: <FormattedMessage defaultMessage="For contributions: the contributor tax ID." id="sPZVmW" />,
    label: <FormattedMessage defaultMessage="Tax ID Number" id="YnfjEo" />,
  },
  {
    id: 'date',
    group: 'legacy',
    tooltip: <FormattedMessage defaultMessage="date only yyyy-mm-dd (eg: 2024-05-20)" id="xqzsep" />,
    label: <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
  },
  {
    id: 'id',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="A unique 32 character identifier (previously names as Contribution ID)"
        id="PtUfDA"
      />
    ),
    label: <FormattedMessage defaultMessage="Transaction GraphQL ID" id="gPmHZC" />,
  },
  {
    id: 'shortId',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="An 8 character alpha-numeric unique transaction identifier." id="dxKB8J" />
    ),
    label: <FormattedMessage defaultMessage="Short Transaction ID" id="bWYUU+" />,
  },
  {
    id: 'shortGroup',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="An 8 character alpha-numeric identifier for the transaction group."
        id="yjJINH"
      />
    ),
    label: <FormattedMessage defaultMessage="Short Group ID" id="4uWBOI" />,
  },
  {
    id: 'shortRefundId',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="If “IsRefunded” indicates “true” then this ID will reference the 8 character alpha-numeric unique transaction ID of the refund transaction (which will indicate “IsRefund” as “true”)."
        id="5cIM9E"
      />
    ),
    label: <FormattedMessage defaultMessage="Short Refund Transaction ID" id="z9PsQI" />,
  },
  {
    id: 'amount',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="Up until and including the year 2023 payment processor fees and taxes were stored as transaction fields. The gross amount is equal to the transaction amount plus the payment processor fees plus the taxes."
        id="8wmqUO"
      />
    ),
    label: <FormattedMessage defaultMessage="Gross Amount" id="bwZInO" />,
  },
  {
    id: 'paymentProcessorFee',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="Up until and including the year 2023 payment processor fees were stored as a transaction field. In 2024 this was changed and payment processor fees are separate transactions."
        id="l7fiJ5"
      />
    ),
    label: <FormattedMessage defaultMessage="Payment Processor Fee" id="pzs6YY" />,
  },
  {
    id: 'expenseId',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="A unique 32 character identifier (previously names as Contribution ID)"
        id="PtUfDA"
      />
    ),
    label: <FormattedMessage defaultMessage="Expense GraphQL ID" id="VQNNKj" />,
  },
  {
    id: 'payoutMethodType',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="Indicates the original payment method type selected by the expense submitter. May be different from actual payment method type."
        id="cQYwAf"
      />
    ),
    label: <FormattedMessage defaultMessage="Expense Payout Method Type" id="06CHAp" />,
  },
  {
    id: 'platformFee',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="Up until and including the year 2022, platform fees were stored as a transaction field. In 2023 this was changed and platform fees are separate transactions."
        id="pQB5Gx"
      />
    ),
    label: <FormattedMessage defaultMessage="Platform Fee" id="SjFhQ9" />,
  },
  {
    id: 'hostFee',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="For contributions before June 2022 the host fee was recorded as a transaction column in the host currency."
        id="rlWQ/t"
      />
    ),
    label: <FormattedMessage defaultMessage="Host Fee" id="NJsELs" />,
  },
  {
    id: 'orderId',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="A unique 32 character identifier (previously names as Contribution ID)"
        id="PtUfDA"
      />
    ),
    label: <FormattedMessage defaultMessage="Contribution GraphQL ID" id="19sed6" />,
  },

  // New Fields
  {
    id: 'refundLegacyId',
    group: 'transaction',
    label: <FormattedMessage defaultMessage="Refund Transaction ID" id="Rxym6C" />,
  },
  {
    id: 'expenseTotalAmount',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="A sum of the expense line items." id="DbeRk+" />,
    label: <FormattedMessage defaultMessage="Expense Total Amount" id="SMZxQE" />,
  },
  {
    id: 'expenseCurrency',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="The currency in which the expense was submitted" id="JmgISf" />,
    label: <FormattedMessage defaultMessage="Expense Currency" id="3135/i" />,
  },
  {
    id: 'expenseSubmittedByHandle',
    group: 'expense',
    tooltip: (
      <FormattedMessage
        defaultMessage="A unique platform slug for the user account that submitted the expense."
        id="vA2baN"
      />
    ),
    label: <FormattedMessage defaultMessage="Expense Submitted By Handle" id="oaI4cl" />,
  },
  {
    id: 'expenseApprovedByHandle',
    group: 'expense',
    tooltip: (
      <FormattedMessage
        defaultMessage="A unique platform slug for the user account that approved the expense."
        id="wMmL7u"
      />
    ),
    label: <FormattedMessage defaultMessage="Expense Approved By Handle" id="M6G/Sk" />,
  },
  {
    id: 'expensePaidByHandle',
    group: 'expense',
    tooltip: (
      <FormattedMessage
        defaultMessage="A unique platform slug for the user account that paid the expense."
        id="ZP0mkD"
      />
    ),
    label: <FormattedMessage defaultMessage="Expense Paid By Handle" id="NaeCZ+" />,
  },

  // Deprecated
  {
    id: 'refundId',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Refund ID" id="INO/bh" />,
  },
  {
    id: 'balance',
    group: 'legacy',
    label: <FormattedMessage id="Balance" defaultMessage="Balance" />,
  },
  {
    id: 'hostSlug',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Host Handle" id="xv/T06" />,
  },
  {
    id: 'hostName',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Host Name" id="x92ME7" />,
  },
  {
    id: 'hostType',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Host Type" id="3qzqTo" />,
  },
  {
    id: 'orderProcessedDate',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Contribution Processed Date" id="zeNNi6" />,
  },
  {
    id: 'taxAmount',
    group: 'legacy',
    label: <FormattedMessage defaultMessage="Tax Amount" id="i+M7sg" />,
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
  'taxAmount',
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
