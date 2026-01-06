import React from 'react';

import type { KycStatusFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import { KYCVerificationStatusBadge } from './KYCVerificationStatusBadge';

type IndividualKYCStatusProps = {
  kycStatus: KycStatusFieldsFragment;
};
export function IndividualKYCStatus(props: IndividualKYCStatusProps) {
  const { kycStatus } = props;

  if (!kycStatus.manual) {
    return null;
  }

  return <KYCVerificationStatusBadge status={kycStatus.manual.status} />;
}
