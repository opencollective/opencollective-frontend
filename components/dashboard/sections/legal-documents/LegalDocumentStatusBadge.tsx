import React from 'react';
import { useIntl } from 'react-intl';

import { LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';
import { i18nLegalDocumentStatus } from '../../../../lib/i18n/legal-document';

import { Badge } from '../../../ui/Badge';

const getBadgeType = (status: LegalDocumentRequestStatus, isExpired: boolean) => {
  switch (status) {
    case LegalDocumentRequestStatus.ERROR:
    case LegalDocumentRequestStatus.INVALID:
      return 'error';
    case LegalDocumentRequestStatus.REQUESTED:
      return isExpired ? 'neutral' : 'info';
    case LegalDocumentRequestStatus.RECEIVED:
      return isExpired ? 'neutral' : 'success';
    default:
      return 'neutral';
  }
};

export const LegalDocumentStatusBadge = ({
  status,
  isExpired,
}: {
  status: LegalDocumentRequestStatus;
  isExpired: boolean;
}) => {
  const intl = useIntl();
  return (
    <Badge className="whitespace-nowrap text-nowrap" type={getBadgeType(status, isExpired)}>
      {i18nLegalDocumentStatus(intl, status, isExpired)}
    </Badge>
  );
};
