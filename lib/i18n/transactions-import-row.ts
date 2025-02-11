import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { TransactionsImportRowStatus } from '../graphql/types/v2/schema';

const MESSAGES = defineMessages({
  ALL: {
    defaultMessage: 'All',
    id: 'transactions.all',
  },
  [TransactionsImportRowStatus.IGNORED]: {
    defaultMessage: 'No action',
    id: 'zue9QR',
  },
  [TransactionsImportRowStatus.LINKED]: {
    defaultMessage: 'Imported',
    id: 'transaction.imported',
  },
  [TransactionsImportRowStatus.PENDING]: {
    defaultMessage: 'Pending',
    id: 'transaction.pending',
  },
  [TransactionsImportRowStatus.ON_HOLD]: {
    defaultMessage: 'On hold',
    id: 'transaction.onHold',
  },
});

export const i18nTransactionsRowStatus = (
  intl: IntlShape,
  status: TransactionsImportRowStatus | `${TransactionsImportRowStatus}` | 'ALL',
) => {
  const i18nMsg = MESSAGES[status];
  return i18nMsg ? intl.formatMessage(i18nMsg) : status;
};
