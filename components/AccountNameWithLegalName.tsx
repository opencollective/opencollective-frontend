import React from 'react';

import type { Account } from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

type AccountNameWithLegalNameAccount = Pick<Account, 'name' | 'legalName'> & {
  slug?: string | null;
};

const getAccountLegalNameIfDifferent = (account: AccountNameWithLegalNameAccount) =>
  account.legalName && account.legalName !== account.name ? account.legalName : null;

export const AccountNameWithLegalName = ({
  account,
  className,
  nameClassName,
  legalNameClassName,
  fallbackToSlug = true,
}: {
  account: AccountNameWithLegalNameAccount;
  /** Classes applied to the root wrapper */
  className?: string;
  /** Classes applied to the display name */
  nameClassName?: string;
  /** Classes applied to the legal name suffix */
  legalNameClassName?: string;
  /** When true, falls back to slug if name is empty */
  fallbackToSlug?: boolean;
}) => {
  const legalName = getAccountLegalNameIfDifferent(account);
  const displayName = account.name || (fallbackToSlug ? account.slug : '') || '';

  return (
    <span className={cn('flex min-w-0 overflow-hidden', className)}>
      <span className={cn('min-w-0 shrink truncate', nameClassName)}>{displayName}</span>
      {legalName && (
        <span className={cn('ml-1 max-w-[45%] shrink-0 truncate text-muted-foreground', legalNameClassName)}>
          {` (${legalName})`}
        </span>
      )}
    </span>
  );
};
