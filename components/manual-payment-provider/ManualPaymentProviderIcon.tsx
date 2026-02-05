import type { LucideIcon } from 'lucide-react';
import { HandCoins, Landmark } from 'lucide-react';

import type { ManualPaymentProvider } from '@/lib/graphql/types/v2/schema';

import { CUSTOM_PAYMEMENT_ICON_MAP } from './constants';

export const getManualPaymentProviderIconComponent = (
  provider: Pick<ManualPaymentProvider, 'icon' | 'type'>,
  fallback: LucideIcon = HandCoins,
): LucideIcon | null => {
  if (provider.icon && CUSTOM_PAYMEMENT_ICON_MAP[provider.icon]) {
    return CUSTOM_PAYMEMENT_ICON_MAP[provider.icon];
  } else if (provider.type === 'BANK_TRANSFER') {
    return Landmark;
  } else {
    return fallback;
  }
};
