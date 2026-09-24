import React from 'react';

import { cn } from '@/lib/utils';

export function DashboardContentCard({
  title,
  action,
  className,
  children,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-lg border p-4', className)}>
      {(title || action) && (
        <div className="flex items-center gap-2">
          {title && <h2 className="tight text-lg font-bold text-slate-800">{title}</h2>}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
