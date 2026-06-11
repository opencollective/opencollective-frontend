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
  MONEY_MOVEMENTS = 'money-movements',
  EXPECTED_FUNDS = 'expected-funds',
  AGREEMENTS = 'agreements',
  ABOUT = 'about',
  ACTIVITIES = 'activities',
}
