import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { LegalDocumentRequestStatus } from '../graphql/types/v2/graphql';

const LEGAL_DOCUMENT_STATUSES = defineMessages({
  [LegalDocumentRequestStatus.ERROR]: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  [LegalDocumentRequestStatus.REQUESTED]: {
    id: 'LegalDocument.Requested',
    defaultMessage: 'Requested',
  },
  [LegalDocumentRequestStatus.NOT_REQUESTED]: {
    id: 'LegalDocument.NotRequested',
    defaultMessage: 'Not requested',
  },
  [LegalDocumentRequestStatus.RECEIVED]: {
    id: 'LegalDocument.Received',
    defaultMessage: 'Received',
  },
  [LegalDocumentRequestStatus.INVALID]: {
    id: 'LegalDocument.Invalid',
    defaultMessage: 'Invalid',
  },
  [LegalDocumentRequestStatus.EXPIRED]: {
    id: 'LegalDocument.Expired',
    defaultMessage: 'Expired',
  },
});

export const i18nLegalDocumentStatus = (intl: IntlShape, status: LegalDocumentRequestStatus) => {
  if (LEGAL_DOCUMENT_STATUSES[status]) {
    return intl.formatMessage(LEGAL_DOCUMENT_STATUSES[status]);
  } else {
    return status;
  }
};
