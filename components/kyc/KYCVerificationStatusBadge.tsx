import React from 'react';
import { useIntl } from 'react-intl';

import { KycVerificationStatus } from '../../lib/graphql/types/v2/graphql';

import { Badge } from '../ui/Badge';

import { i18nKYCVerificationStatus } from './intl';
type KYCVerificationStatusBadgeProps = {
  status: KycVerificationStatus;
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
  const { status } = props;
  return <Badge type={getBadgeType(status)}>{i18nKYCVerificationStatus(intl, status)}</Badge>;
}
