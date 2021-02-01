import { defineMessages } from 'react-intl';

import { TransactionTypes } from '../constants/transactions';

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
  [TransactionTypes.GIFT_CARDS]: {
    id: 'Expense.Type.Gift',
    defaultMessage: 'Gift Cards',
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
