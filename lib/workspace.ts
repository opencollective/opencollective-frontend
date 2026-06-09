import type { AccountType } from './graphql/types/v2/graphql';
import type { WorkspaceAccount } from './LoggedInUser';

export type { WorkspaceAccount } from './LoggedInUser';

/** Narrows any account union to its Individual members */
export function isIndividual<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Individual' }> {
  return account.type === 'INDIVIDUAL';
}

/** Narrows any account union to its Organization members */
export function isOrganization<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Organization' }> {
  return account.type === 'ORGANIZATION';
}

/** Narrows any account union to its Event members */
export function isEvent<T extends { type: AccountType }>(account: T): account is Extract<T, { __typename?: 'Event' }> {
  return account.type === 'EVENT';
}

/** Narrows any account union to its Project members */
export function isProject<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Project' }> {
  return account.type === 'PROJECT';
}

/** Narrows any account union to child accounts (Event, Project) */
export function isChild<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Event' | 'Project' }> {
  return account.type === 'EVENT' || account.type === 'PROJECT';
}

/** Narrows any account union to its Collective members */
export function isCollective<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Collective' }> {
  return account.type === 'COLLECTIVE';
}

// Matching the AccountWithHost GraphQL interface
export function isHostableAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Collective' | 'Event' | 'Project' | 'Fund' }> {
  return (
    account.type === 'COLLECTIVE' || account.type === 'EVENT' || account.type === 'PROJECT' || account.type === 'FUND'
  );
}

export function hasPlatformSubscription<T extends object>(
  account: T,
): account is T & {
  platformSubscription: NonNullable<(T & { platformSubscription?: unknown })['platformSubscription']>;
} {
  return (
    'platformSubscription' in account &&
    Boolean((account as T & { platformSubscription?: unknown }).platformSubscription)
  );
}

export const getTransactionsSection = (account: WorkspaceAccount) =>
  isOrganization(account) && account.hasHosting ? 'host-transactions' : 'transactions';
