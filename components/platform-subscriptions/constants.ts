import { Building, Crown, Zap } from 'lucide-react';
import type React from 'react';
import { defineMessages } from 'react-intl';

import type { PlatformSubscriptionFeatures as PlatformSubscriptionFeaturesSchema } from '@/lib/graphql/types/v2/schema';

type PlatformSubscriptionFeaturesType = keyof Omit<PlatformSubscriptionFeaturesSchema, '__typename'>;

export const PlatformSubscriptionFeatures = [
  'TRANSFERWISE',
  'PAYPAL_PAYOUTS',
  'CHART_OF_ACCOUNTS',
  'TAX_FORMS',
  'OFF_PLATFORM_TRANSACTIONS',
] satisfies PlatformSubscriptionFeaturesType[];

export type PlatformSubscriptionTierType = 'Discover' | 'Basic' | 'Pro';
export const PlatformSubscriptionTiers: PlatformSubscriptionTierType[] = ['Discover', 'Basic', 'Pro'];

export const PlatformSubscriptionTierTitles = defineMessages<(typeof PlatformSubscriptionTiers)[number]>({
  Discover: {
    defaultMessage: 'Discover',
    id: 'tier.Discover.title',
  },
  Basic: {
    defaultMessage: 'Basic',
    id: 'tier.Basic.title',
  },
  Pro: {
    defaultMessage: 'Pro',
    id: 'tier.Pro.title',
  },
});

export const PlatformSubscriptionTierTagLine = defineMessages<(typeof PlatformSubscriptionTiers)[number]>({
  Discover: {
    defaultMessage: 'For new Organizations',
    id: 'odz8h6',
  },
  Basic: {
    defaultMessage: 'For growing Organizations',
    id: 'bgl/3/',
  },
  Pro: {
    defaultMessage: 'For professional Organization',
    id: 'Wff5OS',
  },
});

export const PlatformSubscriptionTierDescription = defineMessages<(typeof PlatformSubscriptionTiers)[number]>({
  Discover: {
    defaultMessage: 'Get started, discover the platform and process expenses manually.',
    id: 'SWkpeH',
  },
  Basic: {
    defaultMessage: 'Scale expense management with automated payouts and advanced categorization.',
    id: 's5kZlm',
  },
  Pro: {
    defaultMessage: 'Increase legal compliance and accounting reconciliation with our most advanced features',
    id: 'PjbVJ8',
  },
});

export const PlatformSubscriptionTierIcon: Record<(typeof PlatformSubscriptionTiers)[number], React.ComponentType> = {
  Discover: Zap,
  Basic: Crown,
  Pro: Building,
};

export const PlatformSubscriptionTierFeatures: Record<
  (typeof PlatformSubscriptionTiers)[number],
  Record<(typeof PlatformSubscriptionFeatures)[number], boolean>
> = {
  Discover: {
    CHART_OF_ACCOUNTS: false,
    OFF_PLATFORM_TRANSACTIONS: false,
    PAYPAL_PAYOUTS: false,
    TAX_FORMS: false,
    TRANSFERWISE: false,
  },
  Basic: {
    CHART_OF_ACCOUNTS: true,
    OFF_PLATFORM_TRANSACTIONS: false,
    PAYPAL_PAYOUTS: true,
    TAX_FORMS: false,
    TRANSFERWISE: true,
  },
  Pro: {
    CHART_OF_ACCOUNTS: true,
    OFF_PLATFORM_TRANSACTIONS: true,
    PAYPAL_PAYOUTS: true,
    TAX_FORMS: true,
    TRANSFERWISE: true,
  },
};

export const PlatformSubscriptionFeatureTitles = defineMessages<(typeof PlatformSubscriptionFeatures)[number]>({
  CHART_OF_ACCOUNTS: {
    defaultMessage: 'Chart of Accounts',
    id: 'IzFWHI',
  },
  OFF_PLATFORM_TRANSACTIONS: {
    defaultMessage: 'Bank Account Synchronization',
    id: 'R9kjJI',
  },
  PAYPAL_PAYOUTS: {
    defaultMessage: 'Payouts With PayPal',
    id: 'vHjZn7',
  },
  TAX_FORMS: {
    defaultMessage: 'Tax Forms',
    id: 'skSw4d',
  },
  TRANSFERWISE: {
    defaultMessage: 'Payouts With Wise',
    id: 'YN48Qe',
  },
});
