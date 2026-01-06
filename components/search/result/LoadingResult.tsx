import React from 'react';

import { Skeleton } from '@/components/ui/Skeleton';

export function LoadingResult() {
  return (
    <div className="flex items-center gap-2 px-2 py-3">
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
