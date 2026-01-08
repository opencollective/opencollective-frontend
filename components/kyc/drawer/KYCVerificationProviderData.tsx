import React from 'react';

import type { KycProviderData, ManualKycProviderData, PersonaKycProviderData } from '@/lib/graphql/types/v2/schema';
import { KycProvider } from '@/lib/graphql/types/v2/schema';

import { KYCVerificationManualProviderData } from './KYCVerificationManualProviderData';
import { KYCVerificationPersonaProviderData } from './KYCVerificationPersonaProviderData';

type KYCVerificationProviderDataProps = {
  providerData: KycProviderData;
  provider: KycProvider;
};

export function KYCVerificationProviderData(props: KYCVerificationProviderDataProps) {
  const { providerData } = props;

  switch (props.provider) {
    case KycProvider.MANUAL:
      return <KYCVerificationManualProviderData providerData={providerData as ManualKycProviderData} />;
    case KycProvider.PERSONA:
      return <KYCVerificationPersonaProviderData providerData={providerData as PersonaKycProviderData} />;
    default:
      return null;
  }
}
