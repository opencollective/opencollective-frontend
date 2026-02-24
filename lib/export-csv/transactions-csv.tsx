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
  | 'refundKind'
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
  | 'parentAccountSlug'
  | 'parentAccountName'
  | 'parentAccountType'
  | 'parentAccountEmail'
  | 'oppositeParentAccountSlug'
  | 'oppositeParentAccountName'
  | 'oppositeParentAccountType'
  | 'oppositeParentAccountEmail'
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
  | 'expensePaidByHandle'
  | 'expenseReference'
  | 'expenseTransferReference'
  | 'importSourceName'
  | 'importSourceId'
  | 'importSourceDescription'
  | 'importSourceAmount'
  | 'importSourceDate'
  | 'importSourceData'
  | 'orderContributorAddress'
  | 'orderContributorCountry'
  | 'expensePayeeAddress'
  | 'expensePayeeCountry'
  | 'isReverse'
  | 'isReversed'
  | 'reverseId'
  | 'reverseLegacyId'
  | 'reverseKind';

export const FieldLabels: Partial<Record<CSVField, React.ReactNode>> = {
  accountingCategoryCode: 'Accounting Category Code',
  accountingCategoryName: 'Accounting Category Name',
  date: 'Date',
  datetime: 'Date & Time',
  effectiveDate: 'Effective Date',
  id: 'Transaction ID',
  legacyId: 'Legacy Transaction ID',
  shortId: 'Short Transaction ID',
  shortGroup: 'Short Group ID',
  group: 'Group ID',
  description: 'Description',
  type: 'Type',
  kind: 'Kind',
  isRefund: 'Is Refund',
  isRefunded: 'Is Refunded',
  refundId: 'Refund ID',
  shortRefundId: 'Short Refund ID',
  refundKind: 'Refund Kind',
  displayAmount: 'Display Amount',
  amount: 'Amount',
  paymentProcessorFee: 'Payment Processor Fee',
  platformFee: 'Platform Fee',
  hostFee: 'Host Fee',
  netAmount: 'Net Amount',
  balance: 'Balance',
  currency: 'Currency',
  accountSlug: 'Account Handle',
  accountName: 'Account Name',
  accountType: 'Account Type',
  accountEmail: 'Account Email',
  oppositeAccountSlug: 'Opposite Account Handle',
  oppositeAccountName: 'Opposite Account Name',
  oppositeAccountType: 'Opposite Account Type',
  oppositeAccountEmail: 'Opposite Account Email',
  parentAccountSlug: 'Parent Account Handle',
  parentAccountName: 'Parent Account Name',
  parentAccountType: 'Parent Account Type',
  parentAccountEmail: 'Parent Account Email',
  oppositeParentAccountSlug: 'Opposite Parent Account Handle',
  oppositeParentAccountName: 'Opposite Parent Account Name',
  oppositeParentAccountType: 'Opposite Parent Account Type',
  oppositeParentAccountEmail: 'Opposite Parent Account Email',
  hostSlug: 'Host Handle',
  hostName: 'Host Name',
  hostType: 'Host Type',
  orderId: 'Contribution ID',
  orderLegacyId: 'Legacy Contribution ID',
  orderFrequency: 'Contribution Frequency',
  orderMemo: 'Contribution Memo',
  orderProcessedDate: 'Contribution Processed Date',
  orderCustomData: 'Contribution Custom Data',
  paymentMethodService: 'Payment Method Service',
  paymentMethodType: 'Payment Method Type',
  expenseId: 'Expense ID',
  expenseLegacyId: 'Legacy Expense ID',
  expenseType: 'Expense Type',
  expenseTags: 'Expense Tags',
  payoutMethodType: 'Payout Method Type',
  merchantId: 'Merchant ID',
  taxAmount: 'Tax Amount',
  taxType: 'Tax Type',
  taxRate: 'Tax Rate',
  taxIdNumber: 'Tax ID Number',
  debitAndCreditAmounts: 'Debit and Credit Amounts',
};

export enum FIELD_OPTIONS {
  DEFAULT = 'DEFAULT',
  DEFAULT_2023 = 'DEFAULT_2023',
  NEW_PRESET = 'NEW_PRESET',
}

export const FieldOptionsLabels = {
  [FIELD_OPTIONS.DEFAULT]: <FormattedMessage defaultMessage="Platform Default" id="5kf2KT" />,
  [FIELD_OPTIONS.DEFAULT_2023]: <FormattedMessage defaultMessage="Legacy Platform Default (Pre-2024)" id="JP+lOn" />,
  [FIELD_OPTIONS.NEW_PRESET]: (
    <span className="text-primary">
      <FormattedMessage defaultMessage="New Preset" id="99ZtbG" />
    </span>
  ),
};

export const GROUPS = {
  transaction: <FormattedMessage defaultMessage="Transaction" id="1+ROfp" />,
  account: <FormattedMessage defaultMessage="Account" id="TwyMau" />,
  order: <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />,
  expense: <FormattedMessage id="Expense" defaultMessage="Expense" />,
  tax: <FormattedMessage defaultMessage="Tax" id="AwzkSM" />,
  imports: <FormattedMessage defaultMessage="Imported data" id="tmfin0" />,
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
    label: 'Date & Time',
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
    label: 'Effective Date & Time',
  },
  {
    id: 'legacyId',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="A unique serial transaction identifier." id="ufJYd0" />,
    label: 'Transaction ID',
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
    label: 'Group ID',
  },
  {
    id: 'description',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="A textual descriptor of the transaction." id="Pdh+ep" />,
    label: 'Description',
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
    label: 'Credit/Debit',
  },
  {
    id: 'kind',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="See documentation for reference to transaction kinds." id="8duKGM" />,
    label: 'Kind',
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
    label: 'Amount Single Column',
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
    label: 'Amount Debit/Credit Columns',
  },
  {
    id: 'currency',
    group: 'transaction',
    tooltip: <FormattedMessage defaultMessage="A 3 letter identifier of the host currency." id="J/Pgyh" />,
    label: 'Currency',
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
    label: 'Original Currency Amount',
  },

  {
    id: 'isReverse',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="Indicates “REVERSE” if this transaction represents a reverse (otherwise empty)."
        id="A8J/np"
      />
    ),
    label: 'Is Reverse',
  },
  {
    id: 'isReversed',
    group: 'transaction',
    tooltip: (
      <FormattedMessage
        defaultMessage="Indicates “REVERSED” if this transaction was reversed (otherwise empty)."
        id="pYbc8f"
      />
    ),
    label: 'Is Reversed',
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
    label: 'Accounting Category Code',
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
    label: 'Accounting Category Name',
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
    label: 'Merchant ID',
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
    label: 'Payment Processor',
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
    label: 'Payment Method',
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
    label: 'Account Handle',
  },
  {
    id: 'accountName',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="The full name of the transaction account." id="a3eXJv" />,
    label: 'Account Name',
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
    label: 'Account Type',
  },
  {
    id: 'accountEmail',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="A contact email for the account (for individuals only)." id="nbe++n" />,
    label: 'Account Email',
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
    label: 'Opposite Account Handle',
  },
  {
    id: 'oppositeAccountName',
    group: 'account',
    tooltip: <FormattedMessage defaultMessage="The full name of the transaction opposite account." id="7zWixh" />,
    label: 'Opposite Account Name',
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
    label: 'Opposite Account Type',
  },
  {
    id: 'oppositeAccountEmail',
    group: 'account',
    tooltip: (
      <FormattedMessage defaultMessage="A contact email for the opposite account (for individuals only)." id="fG5bjt" />
    ),
    label: 'Opposite Account Email',
  },

  {
    id: 'parentAccountSlug',
    group: 'account',
    label: 'Parent Account Handle',
    tooltip: (
      <FormattedMessage
        defaultMessage="The handle (URL identifier on the website) for the parent account, if it exists."
        id="EbIAqw"
      />
    ),
  },
  {
    id: 'parentAccountName',
    group: 'account',
    label: 'Parent Account Name',
    tooltip: <FormattedMessage defaultMessage="The full name of the parent account, if it exists." id="tjroCC" />,
  },
  {
    id: 'parentAccountType',
    group: 'account',
    label: 'Parent Account Type',
    tooltip: (
      <FormattedMessage
        defaultMessage="The type of the parent account (person, organization, collective, host, fund, etc.)"
        id="Zkrf1y"
      />
    ),
  },
  {
    id: 'parentAccountEmail',
    group: 'account',
    label: 'Parent Account Email',
    tooltip: (
      <FormattedMessage defaultMessage="A contact email for the parent account (for individuals only)." id="sGtR3j" />
    ),
  },
  {
    id: 'oppositeParentAccountSlug',
    group: 'account',
    label: 'Opposite Parent Account Handle',
    tooltip: (
      <FormattedMessage
        defaultMessage="The handle (URL identifier on the website) for the opposite parent account, if it exists."
        id="EwFdb6"
      />
    ),
  },
  {
    id: 'oppositeParentAccountName',
    group: 'account',
    label: 'Opposite Parent Account Name',
    tooltip: (
      <FormattedMessage defaultMessage="The full name of the opposite parent account, if it exists." id="lClEDA" />
    ),
  },
  {
    id: 'oppositeParentAccountType',
    group: 'account',
    label: 'Opposite Parent Account Type',
    tooltip: (
      <FormattedMessage
        defaultMessage="The type of the opposite parent account (person, organization, collective, host, fund, etc.)"
        id="71u3AU"
      />
    ),
  },
  {
    id: 'oppositeParentAccountEmail',
    group: 'account',
    label: 'Opposite Parent Account Email',
    tooltip: (
      <FormattedMessage
        defaultMessage="A contact email for the opposite parent account (for individuals only)."
        id="hBFcf+"
      />
    ),
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
    label: 'Contribution ID',
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
    label: 'Contribution Memo',
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
    label: 'Contribution Frequency',
  },
  {
    id: 'orderCustomData',
    group: 'order',
    tooltip: <FormattedMessage defaultMessage="Additional contribution metadata." id="WbW/6b" />,
    label: 'Contribution Custom Data',
  },
  {
    id: 'orderContributorAddress',
    group: 'order',
    label: 'Contributor Address',
  },
  {
    id: 'orderContributorCountry',
    group: 'order',
    label: 'Contributor Country',
  },
  {
    id: 'expenseLegacyId',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="A unique platform identifier for an expense." id="ndQbVX" />,
    label: 'Expense ID',
  },
  {
    id: 'expenseType',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="Invoice/Receipt/Grant/Platform Settlement" id="nKqSHB" />,
    label: 'Expense Type',
  },
  {
    id: 'expenseTags',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="Tags that are applied to the expense." id="RKpJ1S" />,
    label: 'Expense Tags',
  },
  {
    id: 'taxType',
    group: 'tax',
    tooltip: <FormattedMessage defaultMessage="eg: VAT, GST, etc." id="rg47YZ" />,
    label: 'Tax Type',
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
    label: 'Tax Rate',
  },
  {
    id: 'taxIdNumber',
    group: 'tax',
    tooltip: <FormattedMessage defaultMessage="For contributions: the contributor tax ID." id="sPZVmW" />,
    label: 'Tax ID Number',
  },
  {
    id: 'date',
    group: 'legacy',
    tooltip: <FormattedMessage defaultMessage="date only yyyy-mm-dd (eg: 2024-05-20)" id="xqzsep" />,
    label: 'Date',
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
    label: 'Transaction GraphQL ID',
  },
  {
    id: 'shortId',
    group: 'legacy',
    tooltip: (
      <FormattedMessage defaultMessage="An 8 character alpha-numeric unique transaction identifier." id="dxKB8J" />
    ),
    label: 'Short Transaction ID',
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
    label: 'Short Group ID',
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
    label: 'Gross Amount',
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
    label: 'Payment Processor Fee',
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
    label: 'Expense GraphQL ID',
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
    label: 'Expense Payout Method Type',
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
    label: 'Platform Fee',
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
    label: 'Host Fee',
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
    label: 'Contribution GraphQL ID',
  },

  // New Fields
  {
    id: 'reverseLegacyId',
    group: 'transaction',
    label: 'Reverse Transaction ID',
  },
  {
    id: 'reverseKind',
    group: 'transaction',
    label: 'Reverse Kind',
    tooltip: (
      <FormattedMessage
        defaultMessage="The kind of reverse issued tracks the reason why the transaction was returned."
        id="eHIFuv"
      />
    ),
  },
  {
    id: 'expenseTotalAmount',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="A sum of the expense line items." id="DbeRk+" />,
    label: 'Expense Total Amount',
  },
  {
    id: 'expenseCurrency',
    group: 'expense',
    tooltip: <FormattedMessage defaultMessage="The currency in which the expense was submitted" id="JmgISf" />,
    label: 'Expense Currency',
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
    label: 'Expense Submitted By Handle',
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
    label: 'Expense Approved By Handle',
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
    label: 'Expense Paid By Handle',
  },
  {
    id: 'expenseReference',
    group: 'expense',
    label: 'Expense Reference Number',
    tooltip: (
      <FormattedMessage defaultMessage="The Reference Number submitted by the user with the expense." id="5Zh4DV" />
    ),
  },
  {
    id: 'expenseTransferReference',
    group: 'expense',
    label: 'Expense Transfer Reference',
    tooltip: (
      <FormattedMessage
        defaultMessage="The Reference Number used when setting up the payment transfer and the actual reference the user will receive on their side."
        id="ysFgxk"
      />
    ),
  },
  {
    id: 'expensePayeeAddress',
    group: 'expense',
    label: 'Payee Address',
  },
  {
    id: 'expensePayeeCountry',
    group: 'expense',
    label: 'Payee Country',
  },
  // Imported data
  {
    id: 'importSourceName',
    group: 'imports',
    label: 'Import Source Name',
    tooltip: <FormattedMessage defaultMessage="The name of the import source" id="/0q47+" />,
  },
  {
    id: 'importSourceId',
    group: 'imports',
    label: 'Import Source ID',
    tooltip: (
      <FormattedMessage
        defaultMessage="The ID provided by the import source (e.g., bank statement transaction ID)."
        id="3Z6Z9n"
      />
    ),
  },
  {
    id: 'importSourceDescription',
    group: 'imports',
    label: 'Import Source Description',
    tooltip: (
      <FormattedMessage
        defaultMessage="The description extracted from the import source, usually corresponds to the bank statement description."
        id="A/k25b"
      />
    ),
  },
  {
    id: 'importSourceAmount',
    group: 'imports',
    label: 'Import Source Amount',
    tooltip: <FormattedMessage defaultMessage="The amount extracted from the import source." id="GKRVxa" />,
  },
  {
    id: 'importSourceDate',
    group: 'imports',
    label: 'Import Source Date',
    tooltip: <FormattedMessage defaultMessage="The date extracted from the import source." id="W9/Zp3" />,
  },
  {
    id: 'importSourceData',
    group: 'imports',
    label: 'Import Source Data',
    tooltip: <FormattedMessage defaultMessage="The raw data from the import source as a JSON string." id="ydD0AS" />,
  },

  // Deprecated
  {
    id: 'shortRefundId',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="If “IsRefunded” indicates “true” then this ID will reference the 8 character alpha-numeric unique transaction ID of the refund transaction (which will indicate “IsRefund” as “true”)."
        id="5cIM9E"
      />
    ),
    label: 'Short Refund Transaction ID',
  },
  {
    id: 'refundLegacyId',
    group: 'legacy',
    label: 'Refund Transaction ID',
  },
  {
    id: 'refundId',
    group: 'legacy',
    label: 'Refund ID',
  },
  {
    id: 'isRefund',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="Indicates “REFUND” if this transaction represents a refund (otherwise empty)."
        id="haTMSR"
      />
    ),
    label: 'Is Refund',
  },
  {
    id: 'isRefunded',
    group: 'legacy',
    tooltip: (
      <FormattedMessage
        defaultMessage="Indicates “REFUNDED” if this transaction was refunded (otherwise empty)."
        id="0Eavm2"
      />
    ),
    label: 'Is Refunded',
  },
  {
    id: 'balance',
    group: 'legacy',
    label: 'Balance',
  },
  {
    id: 'hostSlug',
    group: 'legacy',
    label: 'Host Handle',
  },
  {
    id: 'hostName',
    group: 'legacy',
    label: 'Host Name',
  },
  {
    id: 'hostType',
    group: 'legacy',
    label: 'Host Type',
  },
  {
    id: 'orderProcessedDate',
    group: 'legacy',
    label: 'Contribution Processed Date',
  },
  {
    id: 'taxAmount',
    group: 'legacy',
    label: 'Tax Amount',
  },
];

export const GROUP_FIELDS = Object.keys(GROUPS).reduce((dict, groupId) => {
  return { ...dict, [groupId]: FIELDS.filter(f => f.group === groupId).map(f => f.id) };
}, {});

const DEFAULT_FIELDS_2023: Array<CSVField> = [
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
  'isReverse',
  'isReversed',
  'reverseLegacyId',
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
  'reverseKind',
];

export const PLATFORM_PRESETS = {
  DEFAULT: { fields: DEFAULT_FIELDS, flattenTaxesAndPaymentProcessorFees: false, useFieldNames: true },
  DEFAULT_2023: { fields: DEFAULT_FIELDS_2023, flattenTaxesAndPaymentProcessorFees: true },
};

type GetDefaultExportNameParams = {
  accountFromFilter?: string;
  accountName?: string;
  accountSlug?: string;
  loggedInUserCollectiveName?: string;
  presetName?: string;
};

export const getDefaultExportName = ({
  accountFromFilter,
  accountName,
  accountSlug,
  loggedInUserCollectiveName,
  presetName,
}: GetDefaultExportNameParams): string => {
  const name = accountFromFilter || accountName || accountSlug || loggedInUserCollectiveName || 'Your';
  if (presetName) {
    return `${name}'s transactions - ${presetName}`;
  }
  return `${name}'s transactions`;
};
