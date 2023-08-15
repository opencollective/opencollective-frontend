import { defineMessages } from 'react-intl';

import { VirtualCardRequestStatus } from '../graphql/types/v2/graphql';

export const VirtualCardRequestStatusI18n = defineMessages({
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
