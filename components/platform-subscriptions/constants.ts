import type { LucideIcon } from 'lucide-react';
import { Building, Crown, Zap } from 'lucide-react';
import { defineMessages } from 'react-intl';

import type { PlatformSubscriptionFeatures as PlatformSubscriptionFeaturesSchema } from '@/lib/graphql/types/v2/schema';

type PlatformSubscriptionFeaturesType = keyof Omit<PlatformSubscriptionFeaturesSchema, '__typename'>;

export const PlatformSubscriptionFeatures = [
  'RECEIVE_FINANCIAL_CONTRIBUTIONS',
  'USE_EXPENSES',
  'TRANSFERWISE',
  'PAYPAL_PAYOUTS',
  'CHART_OF_ACCOUNTS',
  'TAX_FORMS',
  'OFF_PLATFORM_TRANSACTIONS',
  'FUNDS_GRANTS_MANAGEMENT',
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
    defaultMessage: 'For professional Organizations',
    id: 'bS7TrO',
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

export const PlatformSubscriptionTierIcon: Record<(typeof PlatformSubscriptionTiers)[number], LucideIcon> = {
  Discover: Zap,
  Basic: Crown,
  Pro: Building,
};

export const PlatformSubscriptionTierFeatures: Record<
  (typeof PlatformSubscriptionTiers)[number],
  Record<(typeof PlatformSubscriptionFeatures)[number], boolean>
> = {
  Discover: {
    RECEIVE_FINANCIAL_CONTRIBUTIONS: true,
    USE_EXPENSES: true,
    CHART_OF_ACCOUNTS: false,
    OFF_PLATFORM_TRANSACTIONS: false,
    PAYPAL_PAYOUTS: false,
    TAX_FORMS: false,
    TRANSFERWISE: false,
    FUNDS_GRANTS_MANAGEMENT: false,
  },
  Basic: {
    RECEIVE_FINANCIAL_CONTRIBUTIONS: true,
    USE_EXPENSES: true,
    CHART_OF_ACCOUNTS: true,
    OFF_PLATFORM_TRANSACTIONS: false,
    PAYPAL_PAYOUTS: true,
    TAX_FORMS: false,
    TRANSFERWISE: true,
    FUNDS_GRANTS_MANAGEMENT: false,
  },
  Pro: {
    RECEIVE_FINANCIAL_CONTRIBUTIONS: true,
    USE_EXPENSES: true,
    CHART_OF_ACCOUNTS: true,
    OFF_PLATFORM_TRANSACTIONS: true,
    PAYPAL_PAYOUTS: true,
    TAX_FORMS: true,
    TRANSFERWISE: true,
    FUNDS_GRANTS_MANAGEMENT: true,
  },
};

export const PlatformSubscriptionFeatureTitles = defineMessages<(typeof PlatformSubscriptionFeatures)[number]>({
  RECEIVE_FINANCIAL_CONTRIBUTIONS: {
    defaultMessage: 'Crowdfunding pages',
    id: 'lLH5Iy',
  },
  USE_EXPENSES: {
    defaultMessage: 'Expense management',
    id: 'RYRVnQ',
  },
  CHART_OF_ACCOUNTS: {
    defaultMessage: 'Chart of Accounts',
    id: 'IzFWHI',
  },
  OFF_PLATFORM_TRANSACTIONS: {
    defaultMessage: 'Bank Account Synchronization',
    id: 'R9kjJI',
  },
  PAYPAL_PAYOUTS: {
    defaultMessage: 'Payouts with PayPal',
    id: 'DktLfa',
  },
  TAX_FORMS: {
    defaultMessage: 'Tax Forms',
    id: 'skSw4d',
  },
  TRANSFERWISE: {
    defaultMessage: 'Payouts with Wise',
    id: 'QwF3vJ',
  },
  FUNDS_GRANTS_MANAGEMENT: {
    defaultMessage: 'Funds & Grants',
    id: 'cjQcnL',
  },
});
