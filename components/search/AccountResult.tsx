import React from 'react';
import { useIntl } from 'react-intl';

import formatCollectiveType from '../../lib/i18n/collective-type';

import Avatar from '../Avatar';
import { Badge } from '../ui/Badge';

import type { AccountResultData } from './useRecentlyVisited';

export function AccountResult({ account }: { account: AccountResultData }) {
  const intl = useIntl();
  return (
    <div className="flex w-full items-center gap-2">
      <Avatar collective={account} size={36} />

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-medium">{account.name}</div>
          <Badge type="outline" size="xs">
            {formatCollectiveType(intl, account.type)}
          </Badge>
        </div>
        <div className="truncate text-muted-foreground">@{account.slug}</div>
      </div>
    </div>
  );
}
