import React from 'react';
import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { LegalDocumentRequestStatus } from '../../../../lib/graphql/types/v2/graphql';
import { i18nLegalDocumentStatus } from '../../../../lib/i18n/legal-document';
import { cn } from '@/lib/utils';

import type { BadgeProps } from '../../../ui/Badge';
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

export const LegalDocumentStatusBadge = ({
  status,
  label,
  ...props
}: { status: LegalDocumentRequestStatus; label?: ReactNode } & BadgeProps) => {
  const intl = useIntl();
  return (
    <Badge {...props} className={cn('text-nowrap whitespace-nowrap', props.className)} type={getBadgeType(status)}>
      {label}
      {i18nLegalDocumentStatus(intl, status)}
    </Badge>
  );
};
