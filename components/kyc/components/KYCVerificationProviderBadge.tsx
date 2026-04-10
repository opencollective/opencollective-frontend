import React from 'react';

import type { KycProvider } from '@/lib/graphql/types/v2/graphql';

import { Badge } from '@/components/ui/Badge';

import { kycVerificationProviderName } from '../intl';

type KYCVerificationProviderBadgeProps = {
  provider: KycProvider;
  className?: string;
};

export function KYCVerificationProviderBadge({ provider, className }: KYCVerificationProviderBadgeProps) {
  return (
    <Badge
      type="neutral"
      className={`rounded-sm px-2 py-0.75 text-[11px] font-bold tracking-wide uppercase ${className ?? ''}`}
    >
      {kycVerificationProviderName(provider)}
    </Badge>
  );
}
