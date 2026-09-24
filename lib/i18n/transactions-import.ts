import { defineMessages } from 'react-intl';

import { TransactionsImportType } from '../graphql/types/v2/graphql';

const TransactionsImportTypeI18n = defineMessages({
  [TransactionsImportType.MANUAL]: {
    defaultMessage: 'Manual',
    id: 'Payout.Manual',
  },
  [TransactionsImportType.PLAID]: {
    defaultMessage: 'Bank account',
    id: 'BankAccount',
  },
});

export const i18nTransactionsImportType = (intl, status) => {
  const i18nMsg = TransactionsImportTypeI18n[status];
  return i18nMsg ? intl.formatMessage(i18nMsg) : status;
};
