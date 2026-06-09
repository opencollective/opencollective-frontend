import type { AccountType, LoggedInUserWorkspaceFieldsFragment } from './graphql/types/v2/graphql';

/**
 * A workspace account returned by the individual.workspaces resolver, enriched with dashboard-relevant fields.
 * Bot and Vendor are excluded: they cannot be dashboard workspaces (no memberOf admin role).
 */
export type WorkspaceAccount = Exclude<LoggedInUserWorkspaceFieldsFragment, { __typename?: 'Bot' | 'Vendor' }>;

/** Narrows any account union to its Individual members */
export function isIndividualAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Individual' }> {
  return account.type === 'INDIVIDUAL';
}

/** Narrows any account union to its Organization members */
export function isOrganizationAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Organization' }> {
  return account.type === 'ORGANIZATION';
}

/** Narrows any account union to its Event members */
export function isEventAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Event' }> {
  return account.type === 'EVENT';
}

/** Narrows any account union to its Project members */
// ts-unused-exports:disable-next-line
export function isProjectAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Project' }> {
  return account.type === 'PROJECT';
}

/** Narrows any account union to child accounts (Event, Project) */
export function isChildAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Event' | 'Project' }> {
  return account.type === 'EVENT' || account.type === 'PROJECT';
}

/** Narrows any account union to its Collective members */
export function isCollectiveAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Collective' }> {
  return account.type === 'COLLECTIVE';
}

/** Narrows any account union to its Fund members */
export function isFundAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Fund' }> {
  return account.type === 'FUND';
}

/** Narrows any account union to Collective or Fund members */
export function isCollectiveOrFundAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Collective' | 'Fund' }> {
  return isCollectiveAccount(account) || isFundAccount(account);
}

/** Narrows any account union to its Vendor members */
export function isVendorAccount<T extends { type: AccountType }>(
  account: T,
): account is Extract<T, { __typename?: 'Vendor' }> {
  return account.type === 'VENDOR';
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
  isOrganizationAccount(account) && account.hasHosting ? 'host-transactions' : 'transactions';
