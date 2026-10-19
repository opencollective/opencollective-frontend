import type { Account } from './graphql/types/v2/graphql';
import { AccountType, MemberRole } from './graphql/types/v2/graphql';
import { hasAccountMoneyManagement } from './collective';
import type LoggedInUser from './LoggedInUser';

export type ExportRequestAccount = Pick<Account, 'slug' | 'type'> & {
  parent?: { slug: string } | null;
  host?: { slug: string } | null;
  hasMoneyManagement?: boolean;
  isHost?: boolean;
};

/** Whether async exports are implemented for this account type (the worker only processes transactions exports). */
export function supportsAsyncExports(account: ExportRequestAccount): boolean {
  return (
    account?.type === AccountType.COLLECTIVE ||
    account?.type === AccountType.PROJECT ||
    account?.type === AccountType.EVENT ||
    (account?.type === AccountType.ORGANIZATION && hasAccountMoneyManagement(account))
  );
}

/**
 * Whether the given viewer can use async exports for this account: async exports must be implemented for the
 * account type and the viewer must be allowed to create export requests, mirroring the API's
 * `canUseExportRequestsForAccount` (admin or accountant of the account, its parent or its fiscal host).
 */
export function canUseAsyncExports(
  loggedInUser: LoggedInUser | null | undefined,
  account: ExportRequestAccount,
): boolean {
  if (!loggedInUser || !account || !supportsAsyncExports(account)) {
    return false;
  }

  const isAccountantOf = (target: { slug: string }) =>
    Boolean(target?.slug) && loggedInUser.hasRole(MemberRole.ACCOUNTANT, target);

  return (
    loggedInUser.isAdminOfCollectiveOrHost(account) ||
    isAccountantOf(account) ||
    isAccountantOf(account.parent) ||
    isAccountantOf(account.host)
  );
}
