import { defineMessages } from 'react-intl';

import { HostApplicationStatus } from '../graphql/types/v2/graphql';

const MESSAGES = defineMessages({
  [HostApplicationStatus.APPROVED]: {
    id: 'PendingApplication.Approved',
    defaultMessage: 'Approved',
  },
  [HostApplicationStatus.PENDING]: {
    id: 'Pending',
    defaultMessage: 'Pending',
  },
  [HostApplicationStatus.REJECTED]: {
    id: 'PendingApplication.Rejected',
    defaultMessage: 'Rejected',
  },
  [HostApplicationStatus.EXPIRED]: {
    id: 'HostApplication.Expired',
    defaultMessage: 'Expired',
  },
});

const i18nHostApplicationStatus = (intl, status) => {
  const i18nMsg = MESSAGES[status];
  return i18nMsg ? intl.formatMessage(i18nMsg) : status;
};

export default i18nHostApplicationStatus;
