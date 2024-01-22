import { defineMessages } from 'react-intl';

import { VirtualCardRequestStatus } from '../graphql/types/v2/graphql';

const VirtualCardRequestStatusI18n = defineMessages({
  [VirtualCardRequestStatus.APPROVED]: {
    id: 'VirtualCardRequest.status.APPROVED',
    defaultMessage: 'Approved',
  },
  [VirtualCardRequestStatus.REJECTED]: {
    id: 'VirtualCardRequest.status.REJECTED',
    defaultMessage: 'Rejected',
  },
  [VirtualCardRequestStatus.PENDING]: {
    id: 'VirtualCardRequest.status.PENDING',
    defaultMessage: 'Pending',
  },
});

export const i18nVirtualCardRequestStatus = (intl, status) => {
  const i18nMsg = VirtualCardRequestStatusI18n[status];
  return i18nMsg ? intl.formatMessage(i18nMsg) : status;
};
