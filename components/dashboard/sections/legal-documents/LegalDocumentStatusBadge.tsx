import React from 'react';
import { useIntl } from 'react-intl';

import { LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';
import { i18nLegalDocumentStatus } from '../../../../lib/i18n/legal-document';

import { Badge } from '../../../ui/Badge';

const getBadgeType = (status: LegalDocumentRequestStatus) => {
  switch (status) {
    case LegalDocumentRequestStatus.ERROR:
      return 'error';
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
    <Badge className="whitespace-nowrap text-nowrap" type={getBadgeType(status)}>
      {i18nLegalDocumentStatus(intl, status)}
    </Badge>
  );
};
