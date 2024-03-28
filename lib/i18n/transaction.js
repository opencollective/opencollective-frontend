import { defineMessages } from 'react-intl';

import { TRANSACTION_SETTLEMENT_STATUS, TransactionKind, TransactionTypes } from '../constants/transactions';

const i18nTypes = defineMessages({
  ALL: {
    id: 'AllTransactions',
    defaultMessage: 'All transactions',
  },
  [TransactionTypes.CREDIT]: {
    id: 'Transaction.Type.Credit',
    defaultMessage: 'Credit',
  },
  [TransactionTypes.DEBIT]: {
    id: 'Expense.Type.Debit',
    defaultMessage: 'Debit',
  },
});

const i18nKind = defineMessages({
  ALL: {
    id: 'SectionTransactions.All',
    defaultMessage: 'All',
  },
  [TransactionKind.ADDED_FUNDS]: {
    id: 'Transaction.kind.ADDED_FUNDS',
    defaultMessage: 'Added funds',
  },
  [TransactionKind.CONTRIBUTION]: {
    defaultMessage: 'Contribution',
  },
  [TransactionKind.EXPENSE]: {
    id: 'Expense',
    defaultMessage: 'Expense',
  },
  [TransactionKind.HOST_FEE]: {
    id: 'HostFee',
    defaultMessage: 'Host fee',
  },
  [TransactionKind.HOST_FEE_SHARE]: {
    id: 'Transaction.kind.HOST_FEE_SHARE',
    defaultMessage: 'Platform share',
  },
  [TransactionKind.PAYMENT_PROCESSOR_COVER]: {
    id: 'Transaction.kind.PAYMENT_PROCESSOR_COVER',
    defaultMessage: 'Payment processor cover',
  },
  [TransactionKind.PAYMENT_PROCESSOR_FEE]: {
    id: 'contribution.paymentFee',
    defaultMessage: 'Payment processor fee',
  },
  [TransactionKind.PLATFORM_FEE]: {
    id: 'PlatformFee',
    defaultMessage: 'Platform fee',
  },
  [TransactionKind.PLATFORM_TIP]: {
    id: 'Transaction.kind.PLATFORM_TIP',
    defaultMessage: 'Platform tip',
  },
  [TransactionKind.PREPAID_PAYMENT_METHOD]: {
    id: 'Transaction.kind.PREPAID_PAYMENT_METHOD',
    defaultMessage: 'Prepaid payment method',
  },
  [TransactionKind.HOST_FEE_SHARE_DEBT]: {
    id: 'Transaction.kind.HOST_FEE_SHARE_DEBT',
    defaultMessage: 'Platform share (Owed)',
  },
  [TransactionKind.PLATFORM_TIP_DEBT]: {
    id: 'Transaction.kind.PLATFORM_TIP_DEBT',
    defaultMessage: 'Platform tip (Owed)',
  },
  [TransactionKind.BALANCE_TRANSFER]: {
    id: 'Transaction.kind.BALANCE_TRANSFER',
    defaultMessage: 'Balance transfer',
  },
  [TransactionKind.PAYMENT_PROCESSOR_DISPUTE_FEE]: {
    id: 'Transaction.kind.PAYMENT_PROCESSOR_DISPUTE_FEE',
    defaultMessage: 'Payment processor dispute fee',
  },
  [TransactionKind.TAX]: {
    defaultMessage: 'Tax',
  },
});

const i18nKindDefinition = defineMessages({
  [TransactionKind.ADDED_FUNDS]: {
    id: 'Transaction.kind.ADDED_FUNDS.definition',
    defaultMessage: 'Off platform contributions',
  },
  [TransactionKind.CONTRIBUTION]: {
    id: 'Transaction.kind.CONTRIBUTION.definition',
    defaultMessage: 'On platform contributions',
  },
  [TransactionKind.HOST_FEE]: {
    id: 'host.hostFee.help',
    defaultMessage:
      'The Host Fee is what a Fiscal Host charges a Collective for its services, such as holding funds, making expense payouts, meeting tax obligations, and access to the Open Collective software platform.',
  },

  [TransactionKind.PAYMENT_PROCESSOR_FEE]: {
    id: 'Transaction.kind.PAYMENT_PROCESSOR_FEE.definition',
    defaultMessage: 'Fees to external payment processor',
  },
  [TransactionKind.PLATFORM_FEE]: {
    id: 'host.platformFee.help',
    defaultMessage: 'The Platform fee is what Open Collective charges for use of the software.',
  },
  [TransactionKind.BALANCE_TRANSFER]: {
    id: 'Transaction.kind.BALANCE_TRANSFER.definition',
    defaultMessage:
      'Balance transfer from a child account to a parent account or from Hosted Collective to Fiscal Host account.',
  },
  // TransactionKind.PAYMENT_PROCESSOR_DISPUTE_FEE
  // TransactionKind.TAX
  // TransactionKind.EXPENSE
  // TransactionKind.HOST_FEE_SHARE
  // TransactionKind.PAYMENT_PROCESSOR_COVER
  // TransactionKind.PLATFORM_TIP
  // TransactionKind.PREPAID_PAYMENT_METHOD
  // TransactionKind.HOST_FEE_SHARE_DEBT
  // TransactionKind.PLATFORM_TIP_DEBT
});

const i18nSettlementStatus = defineMessages({
  [TRANSACTION_SETTLEMENT_STATUS.OWED]: {
    id: 'SettlementStatus.OWED',
    defaultMessage: 'Owed',
  },
  [TRANSACTION_SETTLEMENT_STATUS.INVOICED]: {
    id: 'SettlementStatus.INVOICED',
    defaultMessage: 'Invoiced',
  },
  [TRANSACTION_SETTLEMENT_STATUS.SETTLED]: {
    id: 'SettlementStatus.SETTLED',
    defaultMessage: 'Settled',
  },
});

/**
 * Translate the type of an transaction
 */
export const i18nTransactionType = (intl, type, id) => {
  let formattedType = i18nTypes[type] ? intl.formatMessage(i18nTypes[type]) : type;
  if (id) {
    formattedType = `${formattedType} #${id}`;
  }
  return formattedType;
};

/**
 * Translate the type of an transaction
 */
export const i18nTransactionKind = (intl, type) => {
  return i18nKind[type] ? intl.formatMessage(i18nKind[type]) : type;
};

export const i18nTransactionSettlementStatus = (intl, status) => {
  return i18nSettlementStatus[status] ? intl.formatMessage(i18nSettlementStatus[status]) : status;
};

/**
 * The definition (help text) of a transaction kind, returns null if no definition exists
 */
export const i18nTransactionKindDefinition = (intl, type) => {
  return i18nKindDefinition[type] ? intl.formatMessage(i18nKind[type]) : null;
};
