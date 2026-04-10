import React from 'react';
import { useIntl } from 'react-intl';

import { KycVerificationStatus } from '../../lib/graphql/types/v2/graphql';

import type { BadgeProps } from '../ui/Badge';
import { Badge } from '../ui/Badge';

import { i18nKYCVerificationStatus } from './intl';
type KYCVerificationStatusBadgeProps = BadgeProps & {
  status: KycVerificationStatus;
  label?: React.ReactNode;
};

function getBadgeType(status: KycVerificationStatus) {
  switch (status) {
    case KycVerificationStatus.VERIFIED:
      return 'success';
    case KycVerificationStatus.REVOKED:
    case KycVerificationStatus.FAILED:
      return 'error';
    case KycVerificationStatus.EXPIRED:
    case KycVerificationStatus.PENDING:
    default:
      return 'neutral';
  }
}

export function KYCVerificationStatusBadge(props: KYCVerificationStatusBadgeProps) {
  const intl = useIntl();
  const { status, label, ...badgeProps } = props;
  return (
    <Badge {...badgeProps} type={getBadgeType(status)}>
      {label}
      {i18nKYCVerificationStatus(intl, status)}
    </Badge>
  );
}
