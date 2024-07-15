import React from 'react';

import Avatar from '../../Avatar';
import DateTime from '../../DateTime';
import LinkCollective from '../../LinkCollective';
import { Badge } from '../../ui/Badge';
import { Skeleton } from '../../ui/Skeleton';

export function UpdateHeader({ update, loading = undefined }) {
  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <Skeleton className="h-6 w-3/4" />
      ) : (
        <h3 className="text-3xl font-semibold tracking-tight">{update.title}</h3>
      )}

      <div className="flex items-center gap-3">
        {loading ? (
          <Skeleton className="size-8 rounded-full" />
        ) : (
          <LinkCollective collective={update.fromAccount}>
            <Avatar collective={update.fromAccount} radius={32} />
          </LinkCollective>
        )}

        {loading ? (
          <Skeleton className="h-4 w-1/2" />
        ) : (
          <div>
            <p className="flex items-center gap-1 text-sm">
              {update.fromAccount.name}
              <Badge type="info" size="xs">
                Admin
              </Badge>
            </p>
            <p className="text-sm text-muted-foreground">
              <DateTime value={update.publishedAt} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
