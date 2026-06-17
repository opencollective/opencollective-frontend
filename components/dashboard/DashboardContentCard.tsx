import React from 'react';

import { cn } from '@/lib/utils';

export function DashboardContentCard({
  title,
  className,
  children,
}: {
  title?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-lg border p-4', className)}>
      {title && <h2 className="tight text-lg font-bold text-slate-800">{title}</h2>}
      {children}
    </div>
  );
}
