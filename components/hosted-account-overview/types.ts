import type {
  AccountWithHost,
  AccountWithParent,
  HostedAccountProfileQuery,
  HostedCollectiveFieldsFragment,
} from '@/lib/graphql/types/v2/graphql';

export type HostedAccountFieldsData = HostedCollectiveFieldsFragment &
  Partial<AccountWithHost> &
  Partial<AccountWithParent>;

export type HostedAccountProfileData = NonNullable<HostedAccountProfileQuery['account']> &
  Partial<AccountWithHost> &
  Partial<AccountWithParent>;

export enum HostedAccountView {
  OVERVIEW = 'overview',
  ACCOUNTS = 'accounts',
  PAYMENT_INTENTS = 'payment-intents',
  EXPECTED_FUNDS = 'expected-funds',
  AGREEMENTS = 'agreements',
  UPDATES = 'updates',
  ABOUT = 'about',
  ACTIVITIES = 'activities',
}

export type MoneyMovementsView = 'ALL' | 'CONTRIBUTIONS' | 'PAYOUTS';
