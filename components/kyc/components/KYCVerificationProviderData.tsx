import React from 'react';

import type { KycProviderData, ManualKycProviderData } from '@/lib/graphql/types/v2/graphql';
import { KycProvider } from '@/lib/graphql/types/v2/graphql';

import { KYCVerificationManualProviderData } from './KYCVerificationManualProviderData';

type KYCVerificationProviderDataProps = {
  providerData: KycProviderData;
  provider: KycProvider;
};

export function KYCVerificationProviderData(props: KYCVerificationProviderDataProps) {
  const { providerData } = props;

  switch (props.provider) {
    case KycProvider.MANUAL:
      return <KYCVerificationManualProviderData providerData={providerData as ManualKycProviderData} />;
    default:
      return null;
  }
}
