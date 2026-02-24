import React from 'react';
import { useIntl } from 'react-intl';

import { LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';
import { i18nLegalDocumentStatus } from '../../../../lib/i18n/legal-document';

import { Badge } from '../../../ui/Badge';

const getBadgeType = (status: LegalDocumentRequestStatus) => {
  switch (status) {
    case LegalDocumentRequestStatus.ERROR:
    case LegalDocumentRequestStatus.INVALID:
      return 'error';
    case LegalDocumentRequestStatus.EXPIRED:
      return 'neutral';
    case LegalDocumentRequestStatus.REQUESTED:
      return 'info';
    case LegalDocumentRequestStatus.RECEIVED:
      return 'success';
    default:
      return 'neutral';
  }
};

export const LegalDocumentStatusBadge = ({ status }: { status: LegalDocumentRequestStatus }) => {
  const intl = useIntl();
  return (
    <Badge className="text-nowrap whitespace-nowrap" type={getBadgeType(status)}>
      {i18nLegalDocumentStatus(intl, status)}
    </Badge>
  );
};
