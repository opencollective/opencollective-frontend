import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { KycProvider, KycVerificationStatus } from '@/lib/graphql/types/v2/graphql';

const KYC_STATUS_MESSAGES = defineMessages({
  [KycVerificationStatus.EXPIRED]: {
    id: 'KYCVerificationStatus.EXPIRED',
    defaultMessage: 'Expired',
  },
  [KycVerificationStatus.FAILED]: {
    id: 'KYCVerificationStatus.FAILED',
    defaultMessage: 'Failed',
  },
  [KycVerificationStatus.PENDING]: {
    id: 'KYCVerificationStatus.PENDING',
    defaultMessage: 'Pending',
  },
  [KycVerificationStatus.REVOKED]: {
    id: 'KYCVerificationStatus.REVOKED',
    defaultMessage: 'Revoked',
  },
  [KycVerificationStatus.VERIFIED]: {
    id: 'KYCVerificationStatus.VERIFIED',
    defaultMessage: 'Verified',
  },
});

export function i18nKYCVerificationStatus(intl: IntlShape, status: KycVerificationStatus) {
  const message = KYC_STATUS_MESSAGES[status];
  return message ? intl.formatMessage(message) : status;
}

export function kycVerificationProviderName(provider: KycProvider) {
  switch (provider) {
    case KycProvider.MANUAL:
      return 'Manual';
    case KycProvider.PERSONA:
      return 'Persona';
  }
}
