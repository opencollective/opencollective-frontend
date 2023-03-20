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
    id: 'ContributionFlow.Contribution',
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
