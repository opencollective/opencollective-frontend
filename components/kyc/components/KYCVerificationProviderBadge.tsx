import React from 'react';

import type { KycProvider } from '@/lib/graphql/types/v2/graphql';

import { Badge } from '@/components/ui/Badge';

import { kycVerificationProviderName } from '../intl';

type KYCVerificationProviderBadgeProps = {
  provider: KycProvider;
};

export function KYCVerificationProviderBadge(props: KYCVerificationProviderBadgeProps) {
  const { provider } = props;
  return <Badge type="neutral">{kycVerificationProviderName(provider)}</Badge>;
}
